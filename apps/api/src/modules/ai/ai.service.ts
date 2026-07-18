import { prisma, TaskStatus } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';
import * as shoppingService from '../shopping/shopping.service';
import * as swapService from '../swaps/swap.service';
import * as choreService from '../chores/chore.service';

interface AiContext {
  householdId: string;
  userId: string;
}

// ============================================================
// Tool definitions (Ollama /api/chat format)
// ============================================================

const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_shopping_item',
      description:
        'Add one or more items to the household shopping list. For a single item, pass an array with one entry. Use when the user wants to buy something or add anything to their shopping list.',
      parameters: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            description: 'One or more items to add to the shopping list',
            items: {
              type: 'object',
              required: ['item_name'],
              properties: {
                item_name: {
                  type: 'string',
                  description: 'Name of the item (e.g. "milk")',
                },
                quantity: {
                  type: 'number',
                  description: 'How many to buy (default 1)',
                },
                unit: {
                  type: 'string',
                  description: 'Unit of measurement (e.g. "pcs", "kg", "liters")',
                },
                category: {
                  type: 'string',
                  description: 'Category for grouping (e.g. "dairy")',
                },
              },
            },
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_chore_swap',
      description:
        'Request a chore swap with another household member. Use when the user wants to trade chores or swap tasks with someone.',
      parameters: {
        type: 'object',
        required: ['chore_title', 'target_member_name'],
        properties: {
          chore_title: {
            type: 'string',
            description: 'The chore the user wants to swap away (partial name match is fine)',
          },
          target_member_name: {
            type: 'string',
            description: 'The household member to swap with (partial name match is fine)',
          },
          reason: {
            type: 'string',
            description: 'Optional reason for the swap request',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_chores',
      description:
        "Get the current user's assigned chores/tasks. Use when the user asks about their tasks, what they need to do, or their chore schedule.",
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
            description: 'Filter by task status',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_shopping_list',
      description:
        'Get the current household shopping list. Use when the user wants to see what is on the list or check shopping items.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

const MAX_TOOL_ITERATIONS = 3;

// ============================================================
// Fuzzy matching helpers
// ============================================================

async function resolveChore(householdId: string, titleHint: string) {
  const chores = await prisma.chore.findMany({
    where: { householdId, isActive: true },
  });

  if (chores.length === 0) {
    throw new AppError(400, 'No chores exist in this household yet.');
  }

  const hint = titleHint.toLowerCase();

  const exact = chores.find((c) => c.title.toLowerCase() === hint);
  if (exact) return exact;

  const substring = chores.filter((c) => c.title.toLowerCase().includes(hint));

  if (substring.length === 1) return substring[0];
  if (substring.length > 1) {
    throw new AppError(
      400,
      `Multiple chores match "${titleHint}": ${substring.map((c) => `"${c.title}"`).join(', ')}. Please be more specific.`,
    );
  }

  throw new AppError(
    400,
    `No chore found matching "${titleHint}". Available chores: ${chores.map((c) => `"${c.title}"`).join(', ') || 'none'}.`,
  );
}

async function resolveMember(householdId: string, nameHint: string) {
  const members = await prisma.householdMember.findMany({
    where: { householdId, isActive: true },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, displayName: true },
      },
    },
  });

  if (members.length === 0) {
    throw new AppError(400, 'No members in this household.');
  }

  const hint = nameHint.toLowerCase();

  const matches = members.filter((m) => {
    const u = m.user;
    return [u.displayName, u.firstName, u.lastName]
      .filter(Boolean)
      .some((name) => name!.toLowerCase().includes(hint));
  });

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new AppError(
      400,
      `Multiple members match "${nameHint}": ${matches.map((m) => m.user.displayName || `${m.user.firstName} ${m.user.lastName}`).join(', ')}. Please be more specific.`,
    );
  }

  throw new AppError(
    400,
    `No member found matching "${nameHint}". Available members: ${members.map((m) => m.user.displayName || `${m.user.firstName} ${m.user.lastName}`).join(', ') || 'none'}.`,
  );
}

// ============================================================
// Tool dispatcher — calls real service functions
// ============================================================

async function executeTool(
  name: string,
  args: Record<string, any>,
  context: AiContext,
): Promise<string> {
  switch (name) {
    case 'add_shopping_item': {
      const lists = await shoppingService.getLists(context.householdId, context.userId);
      if (!lists.length) {
        throw new AppError(400, 'No shopping list found. Create one first via the Shopping page.');
      }
      const list = lists[0];
      const rawItems = Array.isArray(args.items) ? args.items : args.items ? [args.items] : [];
      if (!rawItems.length) {
        throw new AppError(400, 'No items provided. Pass an items array with at least one entry.');
      }
      const created = [];
      for (const entry of rawItems) {
        if (!entry || !entry.item_name || typeof entry.item_name !== 'string' || !entry.item_name.trim()) {
          throw new AppError(400, 'Each item must have a non-empty item_name string.');
        }
        const item = await shoppingService.addItem(
          list.id,
          {
            name: entry.item_name.trim(),
            quantity: entry.quantity,
            unit: entry.unit,
            category: entry.category,
          },
          context.userId,
        );
        created.push({ id: item.id, name: item.name, quantity: item.quantity, unit: item.unit });
      }
      return JSON.stringify({ success: true, list: list.title, items: created });
    }

    case 'request_chore_swap': {
      const chore = await resolveChore(context.householdId, args.chore_title);
      const targetMember = await resolveMember(context.householdId, args.target_member_name);

      if (targetMember.userId === context.userId) {
        throw new AppError(400, 'You cannot swap chores with yourself.');
      }

      const swap = await swapService.requestSwap(
        context.userId,
        context.householdId,
        chore.id,
        targetMember.userId,
        undefined,
        args.reason,
      );

      return JSON.stringify({
        success: true,
        swap: {
          id: swap.id,
          chore: swap.originalChore.title,
          with: swap.requestedTo.displayName || `${swap.requestedTo.firstName} ${swap.requestedTo.lastName}`,
          status: swap.status,
        },
      });
    }

    case 'get_my_chores': {
      const assignments = await choreService.getMyAssignments(context.userId, args.status);
      return JSON.stringify(
        assignments.map((a) => ({
          chore: a.chore.title,
          status: a.status,
          dueDate: a.dueDate,
          points: a.chore.points,
        })),
      );
    }

    case 'get_shopping_list': {
      const lists = await shoppingService.getLists(context.householdId, context.userId);
      return JSON.stringify(
        lists.map((l) => ({
          title: l.title,
          items: l.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            purchased: i.isPurchased,
          })),
        })),
      );
    }

    default:
      throw new AppError(400, `Unknown tool: ${name}`);
  }
}

// ============================================================
// System prompt (provided as the first message to Ollama)
// ============================================================

function buildSystemPrompt(context: any) {
  const memberList = context.members
    .map((m: any) => `- ${m.user.displayName || `${m.user.firstName} ${m.user.lastName}`} (${m.role})`)
    .join('\n');

  const todayTasks = context.todayAssignments
    .map((a: any) => `- ${a.chore.title} → ${a.assignee.displayName || a.assignee.firstName}`)
    .join('\n') || 'No tasks today';

  const overdueTasks = context.overdueAssignments
    .map((a: any) => `- ${a.chore.title} → ${a.assignee.displayName || a.assignee.firstName} (overdue)`)
    .join('\n') || 'No overdue tasks';

  return `You are Household OS AI Assistant. You help manage household chores, schedules, and tasks.

Household Members:
${memberList}

Today's Tasks:
${todayTasks}

Overdue Tasks:
${overdueTasks}

Instructions:
- You have tools to add shopping items, request chore swaps, view chores, and view shopping lists.
- When the user asks you to do something actionable, use the appropriate tool.
- When using a tool, do NOT describe what you will do — just call the tool. The system will confirm what was done.
- Do NOT call get_shopping_list or get_my_chores before an add/request action unless the user explicitly asks to see the current list first — go straight to the action.
- When the user asks a read-only question, answer directly using the context above.
- Be friendly and conversational.
- Keep responses concise and helpful.
- Always respond in the same language the user writes in.`;
}

// ============================================================
// Ollama tool-calling agent loop
// ============================================================

async function queryOllamaWithTools(
  messages: Array<{ role: string; content?: string; tool_calls?: any[]; tool_name?: string }>,
  context: AiContext,
): Promise<string> {
  const url = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2:1b';

  try {
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const res = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          tools: AI_TOOLS,
          stream: false,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Ollama error ${res.status}: ${body}`);
      }

      const data = (await res.json()) as { message?: { content?: string; tool_calls?: any[] } };
      const msg = data.message;

      if (!msg) throw new Error('Empty response from Ollama');

      // No tool calls — return the text response
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return msg.content || 'Done.';
      }

      // Append assistant message (with tool_calls) to conversation history
      messages.push({ role: 'assistant', content: msg.content || '', tool_calls: msg.tool_calls });

      // Execute each tool call and collect results
      for (const call of msg.tool_calls) {
        const toolName = call.function.name;
        const toolArgs = call.function.arguments || {};

        let result: string;
        try {
          result = await executeTool(toolName, toolArgs, context);
        } catch (error: any) {
          const message = error instanceof AppError ? error.message : `Tool failed: ${error.message}`;
          result = JSON.stringify({ success: false, error: message });
        }

        messages.push({ role: 'tool', tool_name: toolName, content: result });
      }
    }

    return 'I made some changes but exceeded the action limit. Please check the results above.';
  } catch (error: any) {
    console.error('Ollama tool-calling failed:', error.message);
    return `I apologize, but I'm having trouble connecting to my AI backend. Please try again later. (Error: ${error.message})`;
  }
}

// ============================================================
// OpenAI fallback (kept for when AI_PROVIDER=openai)
// ============================================================

async function queryOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  if (!apiKey) {
    return 'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.';
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content || 'I could not process that request.';
  } catch (error: any) {
    console.error('OpenAI query failed:', error.message);
    return `I apologize, but I'm having trouble connecting to my AI backend. Please try again later.`;
  }
}

// ============================================================
// Main entry point
// ============================================================

export async function processAiQuery(prompt: string, context: AiContext) {
  const householdContext = await getHouseholdContext(context.householdId);

  const provider = process.env.AI_PROVIDER || 'ollama';
  let response: string;

  if (provider === 'ollama') {
    const systemPrompt = buildSystemPrompt(householdContext);

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    response = await queryOllamaWithTools(messages, context);
  } else {
    const systemPrompt = buildSystemPrompt(householdContext);
    const fullPrompt = `${systemPrompt}\n\nUser Query: ${prompt}`;
    response = await queryOpenAI(fullPrompt);
  }

  await prisma.aiConversation.create({
    data: {
      userId: context.userId,
      householdId: context.householdId,
      prompt,
      response,
      modelUsed:
        provider === 'ollama'
          ? process.env.OLLAMA_MODEL || 'llama3.2:1b'
          : process.env.OPENAI_MODEL || 'gpt-4o',
    },
  });

  return { response, context: householdContext };
}

// ============================================================
// Context helper (used by getHouseholdContext below)
// ============================================================

async function getHouseholdContext(householdId: string) {
  const members = await prisma.householdMember.findMany({
    where: { householdId, isActive: true },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, displayName: true },
      },
    },
  });

  const chores = await prisma.chore.findMany({
    where: { householdId, isActive: true },
    select: { id: true, title: true, category: true, points: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAssignments = await prisma.taskAssignment.findMany({
    where: {
      householdId,
      dueDate: { gte: today, lt: tomorrow },
    },
    include: {
      chore: { select: { id: true, title: true, category: true } },
      assignee: { select: { id: true, firstName: true, lastName: true, displayName: true } },
    },
  });

  const overdueAssignments = await prisma.taskAssignment.findMany({
    where: {
      householdId,
      dueDate: { lt: today },
      status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
    },
    include: {
      chore: { select: { id: true, title: true, category: true } },
      assignee: { select: { id: true, firstName: true, lastName: true, displayName: true } },
    },
  });

  return { members, chores, todayAssignments, overdueAssignments };
}

import { prisma, TaskStatus } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';

interface AiContext {
  householdId: string;
  userId: string;
}

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
- Answer questions about chores, schedules, swaps, and household tasks.
- For swap requests, respond with a structured JSON action: {"action": "request_swap", "originalChoreId": "...", "targetMemberDisplayName": "..."}
- You can propose swaps, report stats, and answer scheduling questions.
- Be friendly and conversational.
- Keep responses concise and helpful.`;
}

export async function processAiQuery(prompt: string, context: AiContext) {
  const householdContext = await getHouseholdContext(context.householdId);

  const systemPrompt = buildSystemPrompt(householdContext);
  const fullPrompt = `${systemPrompt}\n\nUser Query: ${prompt}`;

  const provider = process.env.AI_PROVIDER || 'ollama';
  let response: string;

  if (provider === 'ollama') {
    response = await queryOllama(fullPrompt);
  } else {
    response = await queryOpenAI(fullPrompt);
  }

  await prisma.aiConversation.create({
    data: {
      userId: context.userId,
      householdId: context.householdId,
      prompt,
      response,
      modelUsed: provider === 'ollama'
        ? (process.env.OLLAMA_MODEL || 'llama3')
        : (process.env.OPENAI_MODEL || 'gpt-4o'),
    },
  });

  return { response, context: householdContext };
}

async function queryOllama(prompt: string): Promise<string> {
  const url = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';

  try {
    const res = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

    const data = await res.json() as { response?: string };
    return data.response || 'I could not process that request.';
  } catch (error: any) {
    console.error('Ollama query failed:', error.message);
    return `I apologize, but I'm having trouble connecting to my AI backend. Please try again later. (Error: ${error.message})`;
  }
}

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
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content || 'I could not process that request.';
  } catch (error: any) {
    console.error('OpenAI query failed:', error.message);
    return `I apologize, but I'm having trouble connecting to my AI backend. Please try again later.`;
  }
}

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './shopping.controller';

export const shoppingRouter = Router();
shoppingRouter.use(authenticate);

shoppingRouter.post('/lists', controller.createList);
shoppingRouter.get('/lists/:householdId', controller.getLists);
shoppingRouter.post('/lists/:listId/items', controller.addItem);
shoppingRouter.patch('/items/:itemId/toggle', controller.toggleItem);
shoppingRouter.patch('/items/:itemId/price', controller.updatePrice);

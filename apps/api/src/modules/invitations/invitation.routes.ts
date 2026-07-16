import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './invitation.controller';

export const invitationRouter = Router();

const publicRouter = Router();
publicRouter.get('/by-token/:token', controller.getByToken);
publicRouter.post('/accept/:token', controller.accept);
publicRouter.post('/decline/:token', controller.decline);

const authenticatedRouter = Router();
authenticatedRouter.use(authenticate);
authenticatedRouter.get('/:householdId', controller.listByHousehold);
authenticatedRouter.post('/:householdId', controller.create);
authenticatedRouter.post('/:householdId/:invitationId/resend', controller.resend);
authenticatedRouter.delete('/:householdId/:invitationId', controller.cancel);

export { publicRouter as invitationPublicRouter, authenticatedRouter as invitationAuthenticatedRouter };

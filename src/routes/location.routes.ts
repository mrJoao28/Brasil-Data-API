import { Router } from 'express';
import { getCitiesByState, getStates } from '../controllers/location.controller';
import { validate } from '../middlewares/validate';
import { ufParamSchema } from '../schemas/location.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const locationRouter = Router();

locationRouter.get('/states', asyncHandler(getStates));
locationRouter.get(
  '/states/:uf/cities',
  validate('params', ufParamSchema),
  asyncHandler(getCitiesByState),
);

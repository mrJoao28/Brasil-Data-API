import { Router } from 'express';
import { getHolidays } from '../controllers/holidays.controller';
import { validate } from '../middlewares/validate';
import { yearParamSchema } from '../schemas/holidays.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const holidaysRouter = Router();

holidaysRouter.get(
  '/holidays/:year',
  validate('params', yearParamSchema),
  asyncHandler(getHolidays),
);

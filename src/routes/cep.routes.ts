import { Router } from 'express';
import { getCep } from '../controllers/cep.controller';
import { validate } from '../middlewares/validate';
import { cepParamSchema } from '../schemas/cep.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const cepRouter = Router();

cepRouter.get('/cep/:cep', validate('params', cepParamSchema), asyncHandler(getCep));

import { Router } from 'express';
import { getCnpj } from '../controllers/cnpj.controller';
import { validate } from '../middlewares/validate';
import { cnpjParamSchema } from '../schemas/cnpj.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const cnpjRouter = Router();

cnpjRouter.get('/cnpj/:cnpj', validate('params', cnpjParamSchema), asyncHandler(getCnpj));

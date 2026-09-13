import { Router } from 'express';
import { getEmpresaCompletaHandler } from '../controllers/empresaCompleta.controller';
import { validate } from '../middlewares/validate';
import { cnpjParamSchema } from '../schemas/cnpj.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const empresaCompletaRouter = Router();

empresaCompletaRouter.get(
  '/empresa-completa/:cnpj',
  validate('params', cnpjParamSchema),
  asyncHandler(getEmpresaCompletaHandler),
);

import type { Request, Response } from 'express';
import { getEmpresaCompleta } from '../services/empresaCompleta.service';
import { sendSuccess } from '../utils/response';

export async function getEmpresaCompletaHandler(req: Request, res: Response): Promise<void> {
  const { cnpj } = req.params as unknown as { cnpj: string };
  const result = await getEmpresaCompleta(cnpj);
  sendSuccess(res, result);
}

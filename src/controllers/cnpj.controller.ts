import type { Request, Response } from 'express';
import { getCompanyByCnpj } from '../services/cnpj.service';
import { sendSuccess } from '../utils/response';

export async function getCnpj(req: Request, res: Response): Promise<void> {
  const { cnpj } = req.params as unknown as { cnpj: string };
  const company = await getCompanyByCnpj(cnpj);
  sendSuccess(res, company);
}

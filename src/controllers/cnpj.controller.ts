import type { Request, Response } from 'express';
import { getCompanyByCnpjWithProvider } from '../services/cnpj.service';
import { sendSuccess } from '../utils/response';

export async function getCnpj(req: Request, res: Response): Promise<void> {
  const { cnpj } = req.params as unknown as { cnpj: string };
  const { company, provider } = await getCompanyByCnpjWithProvider(cnpj);
  res.setHeader('X-Provider', provider);
  sendSuccess(res, company);
}

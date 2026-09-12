import type { Request, Response } from 'express';
import { getAddressByCep } from '../services/cep.service';
import { sendSuccess } from '../utils/response';

export async function getCep(req: Request, res: Response): Promise<void> {
  const { cep } = req.params as unknown as { cep: string };
  const address = await getAddressByCep(cep);
  sendSuccess(res, address);
}

import type { Request, Response } from 'express';
import { listCitiesByState, listStates } from '../services/location.service';
import { sendSuccess } from '../utils/response';

export async function getStates(_req: Request, res: Response): Promise<void> {
  const states = await listStates();
  sendSuccess(res, states);
}

export async function getCitiesByState(req: Request, res: Response): Promise<void> {
  const { uf } = req.params as unknown as { uf: string };
  const cities = await listCitiesByState(uf);
  sendSuccess(res, cities);
}

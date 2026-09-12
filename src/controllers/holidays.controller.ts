import type { Request, Response } from 'express';
import { listHolidaysByYear } from '../services/holidays.service';
import { sendSuccess } from '../utils/response';

export async function getHolidays(req: Request, res: Response): Promise<void> {
  const { year } = req.params as unknown as { year: number };
  const holidays = await listHolidaysByYear(year);
  sendSuccess(res, holidays);
}

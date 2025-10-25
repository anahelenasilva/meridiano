import { Request, Response } from 'express';

import { getBriefById } from '../../database/briefing';

export async function getBriefingById(req: Request, res: Response) {
  try {
    const briefId = parseInt(req.params.briefId);
    const brief = await getBriefById(briefId);

    if (!brief) {
      return res.status(404).json({ error: 'Briefing not found' });
    }

    res.json({ brief });
  } catch (error) {
    console.error('Error loading briefing:', error);
    res.status(500).json({ error: 'Error loading briefing' });
  }
}

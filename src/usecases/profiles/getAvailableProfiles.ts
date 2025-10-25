import { Request, Response } from 'express';

import { getDistinctFeedProfiles } from '../../database/feed_profile';

export async function getAvailableProfiles(req: Request, res: Response) {
  try {
    const availableProfiles = await getDistinctFeedProfiles('articles');
    res.json({ profiles: availableProfiles });
  } catch (error) {
    console.error('Error loading profiles:', error);
    res.status(500).json({ error: 'Error loading profiles' });
  }
}

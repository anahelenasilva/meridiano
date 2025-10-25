import { Request, Response } from 'express';

import { getAllBriefsMetadata } from '../../database/briefing';
import { getDistinctFeedProfiles } from '../../database/feed_profile';

export async function listBriefings(req: Request, res: Response) {
  try {
    const feedProfile = req.query.feed_profile as string || '';
    const availableProfiles = await getDistinctFeedProfiles('articles');
    const briefings = await getAllBriefsMetadata(feedProfile || undefined);

    res.json({
      briefings,
      current_feed_profile: feedProfile,
      available_profiles: availableProfiles
    });
  } catch (error) {
    console.error('Error loading briefings:', error);
    res.status(500).json({ error: 'Error loading briefings' });
  }
}

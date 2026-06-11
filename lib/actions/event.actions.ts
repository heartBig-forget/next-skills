'use server';

import { connectDB } from '@/lib/mongodb';
import Event from '@/database/event.model';

export const getSimilarEventsBySlug = async (slug: string) => {
	try{
		await connectDB();
		const event = await Event.findOne({ slug });

		// Find events that are not the current one and share at least one tag
		return await Event.find({ _id: { $ne: event?._id }, tags: { $in: event?.tags || [] } }).lean();
	} catch (error) {
		// Return empty array on error so callers can safely map/iterate
		return [];
	}
}
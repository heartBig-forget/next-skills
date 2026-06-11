import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Event from '@/database/event.model'

/**
 * GET /api/events/[slug]
 * 
 * Fetches a single event by its slug.
 * Returns event details in JSON format with appropriate error handling.
 * 
 * @param req - Next.js request object
 * @param context - Route context containing params
 * @returns Event data or error message with appropriate HTTP status
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Extract and validate slug parameter
    const { slug } = await context.params

    if (!slug?.trim()) {
      return NextResponse.json(
        { error: 'Event slug is required' },
        { status: 400 }
      )
    }

    // Normalize slug to lowercase for consistency
    const normalizedSlug = slug.toLowerCase().trim()

    // Establish database connection
    await connectDB()

    // Query event by slug
    const event = await Event.findOne({ slug: normalizedSlug })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(event, { status: 200 })
  } catch (error) {
    // Log error for debugging
    console.error('[GET /api/events/[slug]] Error:', error)

    // Handle unexpected server errors
    return NextResponse.json(
      {
        error: 'Failed to fetch event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

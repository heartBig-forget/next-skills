import mongoose, { HydratedDocument, Model, Schema } from 'mongoose';

export type EventMode = 'online' | 'offline' | 'hybrid';

export interface IEvent {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // ISO-8601 date (YYYY-MM-DD)
  time: string; // 24h time (HH:MM)
  mode: EventMode;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

type EventDoc = HydratedDocument<IEvent>;

function assertNonEmptyString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
}

function assertNonEmptyStringArray(value: unknown, fieldName: string): asserts value is string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((v) => typeof v !== 'string' || v.trim().length === 0)) {
    throw new Error(`${fieldName} must contain at least one non-empty item`);
  }
}

// Slug: URL-friendly, stable, and safe across languages/diacritics.
function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      minlength: [1, 'Description cannot be empty'],
    },
    overview: {
      type: String,
      required: [true, 'Event overview is required'],
      trim: true,
      minlength: [1, 'Overview cannot be empty'],
    },
    image: {
      type: String,
      required: [true, 'Event image is required'],
      trim: true,
      minlength: [1, 'Image URL cannot be empty'],
    },
    venue: {
      type: String,
      required: [true, 'Event venue is required'],
      trim: true,
      minlength: [1, 'Venue cannot be empty'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
      minlength: [1, 'Location cannot be empty'],
    },
    date: {
      type: String,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
    },
    mode: {
      type: String,
      required: [true, 'Event mode is required'],
      enum: {
        values: ['online', 'offline', 'hybrid'],
        message: 'Mode must be online, offline, or hybrid',
      },
    },
    audience: {
      type: String,
      required: [true, 'Event audience is required'],
      trim: true,
      minlength: [1, 'Audience cannot be empty'],
    },
    agenda: {
      type: [String],
      required: [true, 'Event agenda is required'],
      validate: {
        validator: (agenda: string[]) => agenda.length > 0 && agenda.every((v) => typeof v === 'string' && v.trim().length > 0),
        message: 'Agenda must contain at least one item',
      },
    },
    organizer: {
      type: String,
      required: [true, 'Event organizer is required'],
      trim: true,
      minlength: [1, 'Organizer cannot be empty'],
    },
    tags: {
      type: [String],
      required: [true, 'Event tags are required'],
      validate: {
        validator: (tags: string[]) => tags.length > 0 && tags.every((v) => typeof v === 'string' && v.trim().length > 0),
        message: 'Tags must contain at least one item',
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

eventSchema.pre('save', async function () {
  // Hook-level validation ensures "required and non-empty" semantics for strings and arrays.
  assertNonEmptyString(this.title, 'title');
  assertNonEmptyString(this.description, 'description');
  assertNonEmptyString(this.overview, 'overview');
  assertNonEmptyString(this.image, 'image');
  assertNonEmptyString(this.venue, 'venue');
  assertNonEmptyString(this.location, 'location');
  assertNonEmptyString(this.date, 'date');
  assertNonEmptyString(this.time, 'time');
  assertNonEmptyString(this.mode, 'mode');
  assertNonEmptyString(this.audience, 'audience');
  assertNonEmptyString(this.organizer, 'organizer');
  assertNonEmptyStringArray(this.agenda, 'agenda');
  assertNonEmptyStringArray(this.tags, 'tags');

  // Slug generation: only update when the title changes to keep URLs stable.
  if (this.isNew || this.isModified('title')) {
    this.slug = slugify(this.title);
  }

  // Date normalization: store as ISO-8601 calendar date (YYYY-MM-DD).
  {
    const parsed = new Date(this.date);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid date format. Please provide a valid date.');
    }
    this.date = parsed.toISOString().slice(0, 10);
  }

  // Time normalization: accept H:MM or HH:MM and store as HH:MM (24h).
  {
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(this.time.trim());
    if (!match) {
      throw new Error('Invalid time format. Please use HH:MM format.');
    }
    const hh = match[1].padStart(2, '0');
    const mm = match[2];
    this.time = `${hh}:${mm}`;
  }
});

/**
 * Add unique index on slug for fast lookups
 */
eventSchema.index({ slug: 1 }, { unique: true });

/**
 * Event model
 */
const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);

export default Event;
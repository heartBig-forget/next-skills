import mongoose, { Model, Schema } from 'mongoose';
import Event from './event.model';

/**
 * Interface defining the Booking document structure
 */
export interface IBooking {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking schema with validation and indexing
 */
const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      validate: {
        validator: (value: mongoose.Types.ObjectId) => mongoose.Types.ObjectId.isValid(value),
        message: 'Invalid Event ID format',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (email: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * Pre-save hook to verify that the referenced event exists
 * Prevents creating bookings for non-existent events
 */
bookingSchema.pre('save', async function () {
  // Pre-save referential integrity: block bookings for missing events.
  const exists = await Event.exists({ _id: this.eventId });
  if (!exists) {
    throw new Error('Referenced event does not exist');
  }
});

/**
 * Add index on eventId for faster queries when filtering bookings by event
 */
bookingSchema.index({ eventId: 1 });

/**
 * Booking model
 */
const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
'use client';

import { useState } from 'react';
import { createBooking } from '@/lib/actions/booking.actions';
import posthog from 'posthog-js';

const BookEvent = ({ eventId, slug }: { eventId: string, slug: string}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

	const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const { success } = await createBooking({ eventId, slug, email });

		if (success) {
			setSubmitted(true);
			posthog.capture('event_booked', { eventId, slug, email });
		} else {
			console.log('Booking failed');
			posthog.captureException(new Error('Booking failed'));
		}
	}

  return (
    <div id="book-event">
			{submitted ? (
				<p className="text-green-600">Thank you for booking your spot! We look forward to seeing you at the event.</p>
			) : (
				<form onSubmit={handleSubmit}>
					<div>
						<label htmlFor="email">Email Address</label>
						<input
							type="email"
							id="email"
							value={email}
							placeholder="Enter your email address"
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>

					<button type="submit" className="button-submit">Submit</button>
				</form>
			)
		}
		</div>
  )
}

export default BookEvent
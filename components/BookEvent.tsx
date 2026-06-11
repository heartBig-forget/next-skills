'use client';

import { useState } from 'react';

const BookEvent = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
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
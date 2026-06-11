/**
 * Tests for components/EventCard.tsx
 * Focus: the unoptimized={true} addition and core rendering behavior.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import EventCard from '@/components/EventCard';

// Mock next/image so we can inspect its props without a Next.js runtime
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, unoptimized, ...rest }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-unoptimized={String(unoptimized)}
      {...rest}
    />
  ),
}));

// Mock next/link to render a plain <a> tag
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const defaultProps = {
  title: 'Next.js World Conference',
  image: 'https://res.cloudinary.com/test/event.jpg',
  slug: 'nextjs-world-conference',
  location: 'San Francisco, CA',
  date: '2025-03-15',
  time: '09:00',
};

describe('EventCard component', () => {
  describe('link rendering', () => {
    it('renders a link to the correct event detail URL', () => {
      render(<EventCard {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/events/nextjs-world-conference');
    });

    it('builds the href using the slug prop', () => {
      render(<EventCard {...defaultProps} slug="react-summit-2025" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/events/react-summit-2025');
    });
  });

  describe('event poster image', () => {
    it('renders the event poster image', () => {
      render(<EventCard {...defaultProps} />);
      const poster = screen.getAllByRole('img').find(
        (img) => img.getAttribute('alt') === defaultProps.title
      );
      expect(poster).toBeInTheDocument();
    });

    it('renders the poster with the provided image URL', () => {
      render(<EventCard {...defaultProps} />);
      const poster = screen.getAllByRole('img').find(
        (img) => img.getAttribute('alt') === defaultProps.title
      );
      expect(poster).toHaveAttribute('src', defaultProps.image);
    });

    it('renders the poster with unoptimized={true}', () => {
      render(<EventCard {...defaultProps} />);
      const poster = screen.getAllByRole('img').find(
        (img) => img.getAttribute('alt') === defaultProps.title
      );
      // Our mock serializes the unoptimized prop as a data attribute
      expect(poster).toHaveAttribute('data-unoptimized', 'true');
    });

    it('uses the title as alt text for the poster image', () => {
      render(<EventCard {...defaultProps} title="Vue.js Nation" />);
      const poster = screen.getAllByRole('img').find(
        (img) => img.getAttribute('alt') === 'Vue.js Nation'
      );
      expect(poster).toBeInTheDocument();
    });
  });

  describe('event details display', () => {
    it('displays the event title', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    });

    it('displays the location', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText(defaultProps.location)).toBeInTheDocument();
    });

    it('displays the event date', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText(defaultProps.date)).toBeInTheDocument();
    });

    it('displays the event time', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText(defaultProps.time)).toBeInTheDocument();
    });
  });

  describe('icon images', () => {
    it('renders a location pin icon', () => {
      render(<EventCard {...defaultProps} />);
      const pinIcon = screen.getAllByRole('img').find(
        (img) => img.getAttribute('alt') === 'location'
      );
      expect(pinIcon).toBeInTheDocument();
    });

    it('renders a calendar icon', () => {
      render(<EventCard {...defaultProps} />);
      const calendarIcon = screen.getAllByRole('img').find(
        (img) => img.getAttribute('alt') === 'date'
      );
      expect(calendarIcon).toBeInTheDocument();
    });

    it('renders a clock icon', () => {
      render(<EventCard {...defaultProps} />);
      const clockIcon = screen.getAllByRole('img').find(
        (img) => img.getAttribute('alt') === 'time'
      );
      expect(clockIcon).toBeInTheDocument();
    });
  });

  describe('regression: unoptimized flag is always true', () => {
    it('always passes unoptimized={true} regardless of image source', () => {
      render(<EventCard {...defaultProps} image="/local/image.jpg" />);
      const poster = screen.getAllByRole('img').find(
        (img) => img.getAttribute('alt') === defaultProps.title
      );
      expect(poster).toHaveAttribute('data-unoptimized', 'true');
    });
  });
});
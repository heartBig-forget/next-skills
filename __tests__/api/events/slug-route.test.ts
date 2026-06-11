/**
 * Tests for GET /api/events/[slug]
 */

import { NextRequest } from 'next/server';

// Mock dependencies before importing the handler
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/database/event.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

import { GET } from '@/app/api/events/[slug]/route';
import { connectDB } from '@/lib/mongodb';
import Event from '@/database/event.model';

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockFindOne = Event.findOne as jest.MockedFunction<typeof Event.findOne>;

function makeRequest(slug: string): NextRequest {
  return new NextRequest(`http://localhost/api/events/${slug}`);
}

function makeContext(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe('GET /api/events/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  describe('slug validation', () => {
    it('returns 400 when slug is an empty string', async () => {
      const response = await GET(makeRequest(''), makeContext(''));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: 'Event slug is required' });
    });

    it('returns 400 when slug is whitespace only', async () => {
      const response = await GET(makeRequest('   '), makeContext('   '));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: 'Event slug is required' });
    });

    it('does not call connectDB when slug is invalid', async () => {
      await GET(makeRequest(''), makeContext(''));
      expect(mockConnectDB).not.toHaveBeenCalled();
    });
  });

  describe('slug normalization', () => {
    it('normalizes slug to lowercase before querying', async () => {
      mockFindOne.mockResolvedValue({ title: 'Test Event', slug: 'test-event' } as any);

      await GET(makeRequest('TEST-EVENT'), makeContext('TEST-EVENT'));

      expect(mockFindOne).toHaveBeenCalledWith({ slug: 'test-event' });
    });

    it('trims whitespace from slug before querying', async () => {
      mockFindOne.mockResolvedValue({ title: 'Test Event', slug: 'test-event' } as any);

      await GET(makeRequest('  test-event  '), makeContext('  test-event  '));

      expect(mockFindOne).toHaveBeenCalledWith({ slug: 'test-event' });
    });
  });

  describe('successful event fetch', () => {
    const mockEvent = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Next.js Conference',
      slug: 'nextjs-conference',
      description: 'A conference about Next.js',
      date: '2025-01-15',
      time: '10:00',
      location: 'San Francisco, CA',
      mode: 'offline',
    };

    it('returns 200 with event data when event is found', async () => {
      mockFindOne.mockResolvedValue(mockEvent as any);

      const response = await GET(makeRequest('nextjs-conference'), makeContext('nextjs-conference'));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toMatchObject({ slug: 'nextjs-conference', title: 'Next.js Conference' });
    });

    it('calls connectDB before querying the database', async () => {
      mockFindOne.mockResolvedValue(mockEvent as any);

      await GET(makeRequest('nextjs-conference'), makeContext('nextjs-conference'));

      expect(mockConnectDB).toHaveBeenCalledTimes(1);
    });
  });

  describe('event not found', () => {
    it('returns 404 when event does not exist', async () => {
      mockFindOne.mockResolvedValue(null);

      const response = await GET(makeRequest('non-existent-event'), makeContext('non-existent-event'));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({ error: 'Event not found' });
    });

    it('queries with the correct normalized slug when event is not found', async () => {
      mockFindOne.mockResolvedValue(null);

      await GET(makeRequest('MISSING-EVENT'), makeContext('MISSING-EVENT'));

      expect(mockFindOne).toHaveBeenCalledWith({ slug: 'missing-event' });
    });
  });

  describe('database error handling', () => {
    it('returns 500 when connectDB throws', async () => {
      mockConnectDB.mockRejectedValue(new Error('Connection refused'));

      const response = await GET(makeRequest('some-slug'), makeContext('some-slug'));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch event');
      expect(body.message).toBe('Connection refused');
    });

    it('returns 500 when Event.findOne throws', async () => {
      mockFindOne.mockRejectedValue(new Error('Query timeout'));

      const response = await GET(makeRequest('some-slug'), makeContext('some-slug'));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch event');
      expect(body.message).toBe('Query timeout');
    });

    it('returns "Unknown error" message for non-Error throws', async () => {
      mockFindOne.mockRejectedValue('unexpected string error');

      const response = await GET(makeRequest('some-slug'), makeContext('some-slug'));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.message).toBe('Unknown error');
    });

    it('includes both error and message fields in 500 response', async () => {
      mockFindOne.mockRejectedValue(new Error('DB is down'));

      const response = await GET(makeRequest('some-slug'), makeContext('some-slug'));
      const body = await response.json();

      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
    });
  });

  describe('regression: slug with mixed case', () => {
    it('finds event regardless of input case when slug is stored lowercase', async () => {
      const event = { slug: 'react-summit', title: 'React Summit' };
      mockFindOne.mockResolvedValue(event as any);

      const response = await GET(makeRequest('React-Summit'), makeContext('React-Summit'));

      expect(response.status).toBe(200);
      expect(mockFindOne).toHaveBeenCalledWith({ slug: 'react-summit' });
    });
  });
});
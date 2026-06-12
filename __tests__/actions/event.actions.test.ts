/**
 * Tests for lib/actions/event.actions.ts
 */

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/database/event.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    find: jest.fn(),
  },
}));

// 'use server' directive is a Next.js build-time transform;
// ts-jest will treat it as a plain string expression — no special mocking needed.

import { getSimilarEventsBySlug } from '@/lib/actions/event.actions';
import { connectDB } from '@/lib/mongodb';
import Event from '@/database/event.model';

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockFindOne = Event.findOne as jest.MockedFunction<typeof Event.findOne>;
const mockFind = Event.find as jest.MockedFunction<typeof Event.find>;

describe('getSimilarEventsBySlug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  describe('successful retrieval', () => {
    it('connects to the database before querying', async () => {
      mockFindOne.mockResolvedValue(null);
      mockFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);

      await getSimilarEventsBySlug('some-slug');

      expect(mockConnectDB).toHaveBeenCalledTimes(1);
    });

    it('looks up the event by its slug', async () => {
      const event = { _id: 'abc123', tags: ['react', 'nextjs'] };
      mockFindOne.mockResolvedValue(event as any);
      mockFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);

      await getSimilarEventsBySlug('react-summit');

      expect(mockFindOne).toHaveBeenCalledWith({ slug: 'react-summit' });
    });

    it('returns events that share tags with the current event', async () => {
      const currentEvent = { _id: 'event-1', tags: ['react', 'typescript'] };
      const similarEvents = [
        { _id: 'event-2', title: 'TypeScript Conf', tags: ['typescript'] },
        { _id: 'event-3', title: 'React Summit', tags: ['react'] },
      ];

      mockFindOne.mockResolvedValue(currentEvent as any);
      const mockLean = jest.fn().mockResolvedValue(similarEvents);
      mockFind.mockReturnValue({ lean: mockLean } as any);

      const result = await getSimilarEventsBySlug('current-event');

      expect(result).toEqual(similarEvents);
    });

    it('excludes the current event from similar events query', async () => {
      const currentEvent = { _id: 'current-id', tags: ['node'] };
      mockFindOne.mockResolvedValue(currentEvent as any);
      mockFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);

      await getSimilarEventsBySlug('current-event');

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ _id: { $ne: 'current-id' } })
      );
    });

    it('queries similar events using $in on tags', async () => {
      const currentEvent = { _id: 'id-1', tags: ['javascript', 'node'] };
      mockFindOne.mockResolvedValue(currentEvent as any);
      mockFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);

      await getSimilarEventsBySlug('js-event');

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ tags: { $in: ['javascript', 'node'] } })
      );
    });

    it('uses empty array for tags when event has no tags', async () => {
      const eventWithoutTags = { _id: 'id-2', tags: undefined };
      mockFindOne.mockResolvedValue(eventWithoutTags as any);
      mockFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);

      await getSimilarEventsBySlug('no-tags-event');

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ tags: { $in: [] } })
      );
    });

    it('returns lean documents (plain objects)', async () => {
      const currentEvent = { _id: 'id-3', tags: ['python'] };
      const leanResults = [{ _id: 'id-4', title: 'PyCon', tags: ['python'] }];
      mockFindOne.mockResolvedValue(currentEvent as any);
      const mockLean = jest.fn().mockResolvedValue(leanResults);
      mockFind.mockReturnValue({ lean: mockLean } as any);

      const result = await getSimilarEventsBySlug('python-event');

      expect(mockLean).toHaveBeenCalled();
      expect(result).toEqual(leanResults);
    });
  });

  describe('event not found', () => {
    it('returns events using empty tags array when event slug does not exist', async () => {
      mockFindOne.mockResolvedValue(null);
      mockFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);

      const result = await getSimilarEventsBySlug('ghost-slug');

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ tags: { $in: [] } })
      );
      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('returns empty array when connectDB throws', async () => {
      mockConnectDB.mockRejectedValue(new Error('DB connection failed'));

      const result = await getSimilarEventsBySlug('some-slug');

      expect(result).toEqual([]);
    });

    it('returns empty array when Event.findOne throws', async () => {
      mockFindOne.mockRejectedValue(new Error('Query failed'));

      const result = await getSimilarEventsBySlug('some-slug');

      expect(result).toEqual([]);
    });

    it('returns empty array when Event.find throws', async () => {
      const currentEvent = { _id: 'id-5', tags: ['go'] };
      mockFindOne.mockResolvedValue(currentEvent as any);
      mockFind.mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('Find failed')) } as any);

      const result = await getSimilarEventsBySlug('go-event');

      expect(result).toEqual([]);
    });

    it('always returns an array (never undefined or null)', async () => {
      mockConnectDB.mockRejectedValue(new Error('Any error'));

      const result = await getSimilarEventsBySlug('anything');

      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array for unexpected non-Error throws', async () => {
      mockFindOne.mockRejectedValue('string rejection');

      const result = await getSimilarEventsBySlug('some-slug');

      expect(result).toEqual([]);
    });
  });
});
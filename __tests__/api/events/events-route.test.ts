/**
 * Tests for GET and POST /api/events
 */

import { NextRequest } from 'next/server';

// Mock heavy dependencies before importing the handler
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/database/event.model', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/instrumentation', () => ({
  loggerProvider: {
    getLogger: jest.fn().mockReturnValue({
      emit: jest.fn(),
    }),
  },
}));

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

import { GET, POST } from '@/app/api/events/route';
import { connectDB } from '@/lib/mongodb';
import Event from '@/database/event.model';
import { v2 as cloudinary } from 'cloudinary';

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockFind = Event.find as jest.MockedFunction<typeof Event.find>;
const mockCreate = Event.create as jest.MockedFunction<typeof Event.create>;
const mockUploadStream = cloudinary.uploader.upload_stream as jest.MockedFunction<typeof cloudinary.uploader.upload_stream>;

// Helper: create a mock stream that calls its callback and writes buffer
function mockCloudinaryUpload(result: object | null, error?: Error) {
  mockUploadStream.mockImplementation((_options: any, callback: any) => {
    const stream = {
      end: (buffer: Buffer) => {
        if (error) {
          callback(error, undefined);
        } else {
          callback(undefined, result);
        }
      },
    };
    return stream as any;
  });
}

function buildFormData(fields: Record<string, string>, imageFile?: File): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  if (imageFile) {
    formData.append('image', imageFile);
  }
  return formData;
}

function makePostRequest(formData: FormData): NextRequest {
  return new NextRequest('http://localhost/api/events', {
    method: 'POST',
    body: formData,
  });
}

describe('GET /api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  it('returns 200 with events and success message', async () => {
    const mockEvents = [
      { title: 'Event A', slug: 'event-a' },
      { title: 'Event B', slug: 'event-b' },
    ];

    // Event.find().sort() chain
    mockFind.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockEvents) } as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Events fetched successfully');
    expect(body.events).toEqual(mockEvents);
  });

  it('calls connectDB before querying events', async () => {
    mockFind.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) } as any);

    await GET();

    expect(mockConnectDB).toHaveBeenCalledTimes(1);
  });

  it('sorts events by createdAt descending', async () => {
    const mockSort = jest.fn().mockResolvedValue([]);
    mockFind.mockReturnValue({ sort: mockSort } as any);

    await GET();

    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('returns 200 with empty events array when no events exist', async () => {
    mockFind.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) } as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.events).toEqual([]);
  });

  it('returns 500 when database query fails', async () => {
    mockFind.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) } as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Error fetching failed');
  });

  it('returns 500 when connectDB fails', async () => {
    mockConnectDB.mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
  });
});

describe('POST /api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  describe('validation', () => {
    it('returns 400 when image file is missing from form data', async () => {
      const formData = buildFormData({
        title: 'Test Event',
        tags: '["javascript"]',
        agenda: '["Talk 1"]',
      });
      // No image appended

      const response = await POST(makePostRequest(formData));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Image file is required');
    });
  });

  describe('successful event creation', () => {
    it('returns 201 with created event on success', async () => {
      const imageFile = new File(['image-content'], 'event.jpg', { type: 'image/jpeg' });
      const formData = buildFormData(
        {
          title: 'Dev Summit 2025',
          description: 'Annual developer summit',
          tags: '["react","nextjs"]',
          agenda: '["Opening keynote","Workshops"]',
        },
        imageFile
      );

      mockCloudinaryUpload({ secure_url: 'https://res.cloudinary.com/test/image.jpg' });

      const createdEvent = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Dev Summit 2025',
        image: 'https://res.cloudinary.com/test/image.jpg',
      };
      mockCreate.mockResolvedValue(createdEvent as any);

      const response = await POST(makePostRequest(formData));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.message).toBe('Event created successfully');
      expect(body.event).toEqual(createdEvent);
    });

    it('uploads image to Cloudinary before saving event', async () => {
      const imageFile = new File(['img'], 'photo.png', { type: 'image/png' });
      const formData = buildFormData(
        { title: 'Event', tags: '[]', agenda: '[]' },
        imageFile
      );

      mockCloudinaryUpload({ secure_url: 'https://res.cloudinary.com/folder/img.png' });
      mockCreate.mockResolvedValue({ title: 'Event' } as any);

      await POST(makePostRequest(formData));

      expect(mockUploadStream).toHaveBeenCalledWith(
        { resource_type: 'image', folder: 'DevEvent' },
        expect.any(Function)
      );
    });

    it('sets the event image URL from Cloudinary result', async () => {
      const imageFile = new File(['data'], 'banner.jpg', { type: 'image/jpeg' });
      const cloudinaryUrl = 'https://res.cloudinary.com/test/banner.jpg';
      const formData = buildFormData(
        { title: 'Banner Event', tags: '["tag1"]', agenda: '["item1"]' },
        imageFile
      );

      mockCloudinaryUpload({ secure_url: cloudinaryUrl });
      mockCreate.mockResolvedValue({ title: 'Banner Event', image: cloudinaryUrl } as any);

      await POST(makePostRequest(formData));

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ image: cloudinaryUrl })
      );
    });

    it('passes parsed tags array to Event.create', async () => {
      const imageFile = new File(['x'], 'img.jpg', { type: 'image/jpeg' });
      const formData = buildFormData(
        { title: 'Tagged Event', tags: '["node","express","mongodb"]', agenda: '["item"]' },
        imageFile
      );

      mockCloudinaryUpload({ secure_url: 'https://res.cloudinary.com/test/img.jpg' });
      mockCreate.mockResolvedValue({} as any);

      await POST(makePostRequest(formData));

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['node', 'express', 'mongodb'] })
      );
    });

    it('passes parsed agenda array to Event.create', async () => {
      const imageFile = new File(['x'], 'img.jpg', { type: 'image/jpeg' });
      const formData = buildFormData(
        { title: 'Agenda Event', tags: '["tag"]', agenda: '["Welcome","Talk","Q&A"]' },
        imageFile
      );

      mockCloudinaryUpload({ secure_url: 'https://res.cloudinary.com/test/img.jpg' });
      mockCreate.mockResolvedValue({} as any);

      await POST(makePostRequest(formData));

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ agenda: ['Welcome', 'Talk', 'Q&A'] })
      );
    });
  });

  describe('error handling', () => {
    it('returns 500 when Cloudinary upload fails', async () => {
      const imageFile = new File(['x'], 'img.jpg', { type: 'image/jpeg' });
      const formData = buildFormData(
        { title: 'Event', tags: '[]', agenda: '[]' },
        imageFile
      );

      mockCloudinaryUpload(null, new Error('Upload failed'));

      const response = await POST(makePostRequest(formData));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.message).toBe('Event Creation failed');
      expect(body.error).toBe('Upload failed');
    });

    it('returns 500 when Event.create throws', async () => {
      const imageFile = new File(['x'], 'img.jpg', { type: 'image/jpeg' });
      const formData = buildFormData(
        { title: 'Event', tags: '["tag"]', agenda: '["item"]' },
        imageFile
      );

      mockCloudinaryUpload({ secure_url: 'https://res.cloudinary.com/test/img.jpg' });
      mockCreate.mockRejectedValue(new Error('Validation failed'));

      const response = await POST(makePostRequest(formData));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.message).toBe('Event Creation failed');
      expect(body.error).toBe('Validation failed');
    });

    it('returns "Unknown error" for non-Error throws', async () => {
      const imageFile = new File(['x'], 'img.jpg', { type: 'image/jpeg' });
      const formData = buildFormData(
        { title: 'Event', tags: '["tag"]', agenda: '["item"]' },
        imageFile
      );

      mockCloudinaryUpload({ secure_url: 'https://res.cloudinary.com/test/img.jpg' });
      mockCreate.mockRejectedValue('string error');

      const response = await POST(makePostRequest(formData));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Unknown error');
    });

    it('returns 500 when connectDB fails', async () => {
      mockConnectDB.mockRejectedValue(new Error('No connection'));

      const imageFile = new File(['x'], 'img.jpg', { type: 'image/jpeg' });
      const formData = buildFormData({ title: 'Event', tags: '[]', agenda: '[]' }, imageFile);

      const response = await POST(makePostRequest(formData));
      const body = await response.json();

      expect(response.status).toBe(500);
    });
  });
});
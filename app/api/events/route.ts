import { SeverityNumber } from '@opentelemetry/api-logs'
import { after, NextRequest,NextResponse } from 'next/server'
import { loggerProvider } from '@/instrumentation'
import { v2 as cloudinary } from 'cloudinary';
import { connectDB } from '@/lib/mongodb'
import Event from '@/database/event.model';

const logger = loggerProvider.getLogger('my-nextjs-app')

export async function GET() {
  try {
     await connectDB();

     const events = await Event.find().sort({ createdAt: -1 });

     return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200 });

  } catch (e) {
    return NextResponse.json({ message: 'Error fetching failed', error: e }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    let event;

    try {
      event = Object.fromEntries(formData.entries());
    } catch (error) {
      return NextResponse.json({ message: 'Invalid form data' }, { status: 400 })
    }

    // 获取上传图片的文件对象
    const file = formData.get('image') as File;
    if (!file) {
      return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
    }

    let tags = JSON.parse(formData.get('tags') as string);
    let agenda = JSON.parse(formData.get('agenda') as string);

    // 将文件写入缓冲区
    const arrayBuffer = await file.arrayBuffer();
    // 将缓冲区转换为二进制数据
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      }).end(buffer);
    })
    event.image = (uploadResult as { secure_url: string }).secure_url;
    

    const createdEvent = await Event.create({
      ...event,
      tags,
      agenda
    });

    return NextResponse.json({ message: 'Event created successfully', event: createdEvent }, { status: 201 });
  } catch (error) {
    console.log('Error connecting to MongoDB:', error) ;
    return NextResponse.json({ message: 'Event Creation failed', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
import { SeverityNumber } from '@opentelemetry/api-logs'
import { after } from 'next/server'
import { loggerProvider } from '@/instrumentation'

const logger = loggerProvider.getLogger('my-nextjs-app')

export async function GET() {
  logger.emit({
    body: 'API request received',
    severityNumber: SeverityNumber.INFO,
    attributes: {
      endpoint: '/api/example',
      method: 'GET',
    },
  })

  // Ensure logs are flushed before the serverless function freezes
  after(async () => {
    await loggerProvider.forceFlush()
  })

  return Response.json({ success: true })
}
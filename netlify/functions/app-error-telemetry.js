import { handleAppErrorTelemetryIngest } from '../../server/appErrorTelemetryIngestCore.js';

export async function handler(event) {
  const result = await handleAppErrorTelemetryIngest({
    method: event.httpMethod,
    body: event.body,
    headers: event.headers,
  });

  return {
    statusCode: result.status,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(result.body),
  };
}

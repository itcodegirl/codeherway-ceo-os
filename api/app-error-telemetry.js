import { handleAppErrorTelemetryIngest } from '../server/appErrorTelemetryIngestCore.js';

export default async function handler(req, res) {
  const result = await handleAppErrorTelemetryIngest({
    method: req.method,
    body: req.body,
    headers: req.headers,
  });

  res.status(result.status).json(result.body);
}

import { handleChiefOfStaffProxy } from '../server/chiefOfStaffProxyCore.js';

export default async function handler(req, res) {
  const result = await handleChiefOfStaffProxy({
    method: req.method,
    body: req.body,
  });

  res.status(result.status).json(result.body);
}

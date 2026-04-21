import { handleChiefOfStaffProxy } from '../../server/chiefOfStaffProxyCore.js';

export async function handler(event) {
  const result = await handleChiefOfStaffProxy({
    method: event.httpMethod,
    body: event.body,
  });

  return {
    statusCode: result.status,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(result.body),
  };
}

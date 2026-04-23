import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveTelemetryVerificationKeys,
  resetTelemetryKeyProviderCacheForTests,
} from './appErrorTelemetryKeyProvider.js';

describe('server/appErrorTelemetryKeyProvider', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
    delete process.env.APP_ERROR_TELEMETRY_ASYMMETRIC_PUBLIC_KEYS_JSON;
    delete process.env.APP_ERROR_TELEMETRY_KMS_KEYS_URL;
    delete process.env.APP_ERROR_TELEMETRY_KMS_AUTH_TOKEN;
    delete process.env.APP_ERROR_TELEMETRY_KMS_CACHE_MS;
    resetTelemetryKeyProviderCacheForTests();
  });

  afterEach(() => {
    resetTelemetryKeyProviderCacheForTests();
    process.env = { ...originalEnv };
  });

  it('returns unconfigured state when no asymmetric key source is set', async () => {
    const result = await resolveTelemetryVerificationKeys();

    expect(result.configured).toBe(false);
    expect(result.required).toBe(false);
    expect(result.source).toBe('none');
  });

  it('resolves active keys from env-based asymmetric key map', async () => {
    const keyPair = crypto.generateKeyPairSync('ed25519');
    const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    process.env.APP_ERROR_TELEMETRY_ASYMMETRIC_PUBLIC_KEYS_JSON = JSON.stringify({
      'env-key': {
        publicKeyPem,
        algorithm: 'ed25519',
        version: 'v1',
      },
    });

    const result = await resolveTelemetryVerificationKeys();

    expect(result.configured).toBe(true);
    expect(result.source).toBe('env');
    expect(result.keysById['env-key']).toMatchObject({
      keyId: 'env-key',
      version: 'v1',
      source: 'env',
    });
  });

  it('fetches KMS keys and reuses cached keysets within cache ttl', async () => {
    const keyPair = crypto.generateKeyPairSync('ed25519');
    const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    process.env.APP_ERROR_TELEMETRY_KMS_KEYS_URL = 'https://kms.example.com/keys';
    process.env.APP_ERROR_TELEMETRY_KMS_CACHE_MS = '60000';
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        keys: [
          {
            keyId: 'kms-key',
            publicKeyPem,
            algorithm: 'ed25519',
            version: 'v3',
          },
        ],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const first = await resolveTelemetryVerificationKeys({ nowMs: Date.now() });
    const second = await resolveTelemetryVerificationKeys({ nowMs: Date.now() + 500 });

    expect(first.configured).toBe(true);
    expect(first.source).toBe('kms');
    expect(first.keysById['kms-key']).toBeTruthy();
    expect(second.metadata.cacheHit).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

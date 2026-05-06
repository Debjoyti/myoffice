import { describe, it, expect } from 'vitest';
import { PRSKError } from '@/lib/errors/prsk-error';
import { panValidator } from '@/lib/validators/indian';

describe('PRSK Foundation', () => {
  it('creates PRSKError correctly', () => {
    const error = new PRSKError({
      message: 'Test error',
      code: 'UNAUTHORIZED',
      status: 401
    });

    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.status).toBe(401);
  });

  it('validates PAN correctly', () => {
    expect(panValidator.safeParse('ABCDE1234F').success).toBe(true);
    expect(panValidator.safeParse('INVALID').success).toBe(false);
  });
});

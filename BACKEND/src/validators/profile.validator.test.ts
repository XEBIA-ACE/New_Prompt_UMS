import { validateUpdateProfileBody } from './profile.validator';
import { ProfileValidationException } from '../errors/profile.errors';

function fieldErrorsOf(body: unknown): Record<string, string | undefined> {
  try {
    validateUpdateProfileBody(body);
  } catch (err) {
    if (err instanceof ProfileValidationException) return err.fieldErrors;
    throw err;
  }
  throw new Error('expected validation to fail');
}

const valid = { displayName: 'Jane Doe', email: 'jane@example.test', phoneNumber: '+1 (555) 010-2000', version: 1 };

describe('validateUpdateProfileBody', () => {
  // [US-004-AC5] [US-004-AC15] [US-004-AC23] valid input is accepted and sanitised (trimmed)
  test('[US-004-AC23] trims values and returns a command', () => {
    expect(
      validateUpdateProfileBody({ ...valid, displayName: '  Jane Doe  ', email: ' jane@example.test ' }),
    ).toEqual({ ...valid, displayName: 'Jane Doe', email: 'jane@example.test' });
  });

  test('[US-004-AC38] empty/null optional fields are normalised to null', () => {
    expect(validateUpdateProfileBody({ ...valid, displayName: '', phoneNumber: null })).toEqual({
      ...valid,
      displayName: null,
      phoneNumber: null,
    });
  });

  test('[US-004-AC6] [US-004-AC38] email is required and must be well formed', () => {
    expect(fieldErrorsOf({ ...valid, email: '' }).email).toBe('Email is required.');
    expect(fieldErrorsOf({ ...valid, email: 'not-an-email' }).email).toBe('Enter a valid email address.');
    expect(fieldErrorsOf({ ...valid, email: `${'a'.repeat(250)}@x.io` }).email).toMatch(/at most 254/);
  });

  test('[US-004-AC23] display name rejects markup, control characters and over-long values', () => {
    expect(fieldErrorsOf({ ...valid, displayName: '<script>alert(1)</script>' }).displayName).toMatch(/not allowed/);
    expect(fieldErrorsOf({ ...valid, displayName: 'a\u0000b' }).displayName).toMatch(/not allowed/);
    expect(fieldErrorsOf({ ...valid, displayName: 'x'.repeat(101) }).displayName).toMatch(/at most 100/);
  });

  test('[US-004-AC38] phone number must contain 7-15 digits with allowed separators', () => {
    expect(fieldErrorsOf({ ...valid, phoneNumber: '12345' }).phoneNumber).toBeDefined();
    expect(fieldErrorsOf({ ...valid, phoneNumber: '555-CALL-NOW' }).phoneNumber).toBeDefined();
    expect(fieldErrorsOf({ ...valid, phoneNumber: '+1234567890123456' }).phoneNumber).toBeDefined();
    expect(validateUpdateProfileBody({ ...valid, phoneNumber: '+447700900123' }).phoneNumber).toBe('+447700900123');
  });

  test('[US-004-AC40] version is required for optimistic locking', () => {
    expect(fieldErrorsOf({ ...valid, version: undefined }).version).toBeDefined();
    expect(fieldErrorsOf({ ...valid, version: 0 }).version).toBeDefined();
    expect(fieldErrorsOf({ ...valid, version: '1' }).version).toBeDefined();
  });

  test('[US-004-AC3] [US-004-AC50] read-only and unknown fields (incl. userId) are rejected', () => {
    const errors = fieldErrorsOf({ ...valid, userId: 'someone-else', username: 'x', status: 'active' });
    expect(errors.userId).toBe('Unknown or read-only field.');
    expect(errors.username).toBe('Unknown or read-only field.');
    expect(errors.status).toBe('Unknown or read-only field.');
  });

  test('non-object bodies are rejected', () => {
    expect(fieldErrorsOf(null).body).toBeDefined();
    expect(fieldErrorsOf([valid]).body).toBeDefined();
  });

  test('[US-004-AC6] reports every invalid field at once', () => {
    const errors = fieldErrorsOf({ displayName: 1, email: 'bad', phoneNumber: 'x', version: -1 });
    expect(Object.keys(errors).sort()).toEqual(['displayName', 'email', 'phoneNumber', 'version']);
  });
});

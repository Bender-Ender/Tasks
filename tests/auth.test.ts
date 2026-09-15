import { describe, expect, it } from 'vitest';
import { OWNER, userIdFrom } from '../worker/auth';

describe('userIdFrom', () => {
  // The task list emptied twice because identity moved underneath the data:
  // once when a deploy dropped the ENVIRONMENT var and every query fell back to
  // another user, once when Access asserted a different address. Identity must
  // not depend on anything that can drift between deploys or sign-ins.
  it('returns the same owner every time', () => {
    expect(userIdFrom()).toBe(OWNER);
    expect(userIdFrom()).toBe(userIdFrom());
  });

  it('takes no argument, so nothing about a request can change it', () => {
    expect(userIdFrom).toHaveLength(0);
  });

  it('is not an email address', () => {
    expect(OWNER).not.toContain('@');
  });
});

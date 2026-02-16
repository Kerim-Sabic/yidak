import { describe, expect, it } from 'vitest';

import { designTokens } from './index';

describe('designTokens', () => {
  it('exposes radius tokens', () => {
    expect(designTokens.radius.sm).toBe('0.5rem');
    expect(designTokens.radius.md).toBe('0.75rem');
    expect(designTokens.radius.lg).toBe('1rem');
  });
});

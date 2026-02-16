import { describe, expect, it } from 'vitest';

import { db, sql } from './client';

describe('db client exports', () => {
  it('exports sql and db clients', () => {
    expect(sql).toBeDefined();
    expect(db).toBeDefined();
  });
});

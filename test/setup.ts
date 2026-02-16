import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import { server } from './mocks/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

const intlMock = {
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
  useFormatter: () => ({ number: (value: number) => String(value) })
};

vi.mock('next-intl', () => intlMock);
vi.mock('next-intl/react-client', () => intlMock);

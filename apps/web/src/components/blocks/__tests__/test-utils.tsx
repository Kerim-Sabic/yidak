import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

export const renderWithIntl = (ui: ReactElement): RenderResult =>
  render(
    <NextIntlClientProvider
      locale="en"
      messages={{}}
      onError={() => undefined}
      getMessageFallback={({ key }) => key}
    >
      {ui}
    </NextIntlClientProvider>,
  );

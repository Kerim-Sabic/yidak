'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { ComponentPropsWithoutRef } from 'react';

type LinkProps = ComponentPropsWithoutRef<typeof Link>;

const getPrefetchPath = (href: LinkProps['href']): string | null => {
  if (typeof href === 'string') {
    return href;
  }

  const pathname = href.pathname;
  return typeof pathname === 'string' ? pathname : null;
};

export const PrefetchLink = ({
  href,
  onMouseEnter,
  onFocus,
  ...props
}: LinkProps): React.JSX.Element => {
  const router = useRouter();

  return (
    <Link
      href={href}
      onMouseEnter={(event) => {
        const prefetchPath = getPrefetchPath(href);
        if (prefetchPath) {
          router.prefetch(prefetchPath);
        }

        if (onMouseEnter) {
          onMouseEnter(event);
        }
      }}
      onFocus={(event) => {
        const prefetchPath = getPrefetchPath(href);
        if (prefetchPath) {
          router.prefetch(prefetchPath);
        }

        if (onFocus) {
          onFocus(event);
        }
      }}
      {...props}
    />
  );
};

export default PrefetchLink;

'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import type { ImageProps } from 'next/image';

type ImageCategory = 'job' | 'worker' | 'review' | 'generic';

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt' | 'blurDataURL'> {
  src: string | null | undefined;
  alt: string;
  blurDataURL?: string;
  category?: ImageCategory;
}

const fallbackByCategory: Readonly<Record<ImageCategory, string>> = {
  job: '/icons/icon-512.png',
  worker: '/icons/icon-192.png',
  review: '/icons/icon-maskable.png',
  generic: '/icons/icon-192.png',
};

const normalizeSource = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const OptimizedImage = ({
  src,
  alt,
  blurDataURL,
  category = 'generic',
  loading = 'lazy',
  sizes = '100vw',
  className,
  ...props
}: OptimizedImageProps): React.JSX.Element => {
  const [hasError, setHasError] = useState(false);
  const normalizedSource = useMemo(() => normalizeSource(src), [src]);
  const fallback = fallbackByCategory[category];
  const resolvedSource = hasError || !normalizedSource ? fallback : normalizedSource;
  const blurProps = blurDataURL
    ? {
        placeholder: 'blur' as const,
        blurDataURL,
      }
    : {
        placeholder: 'empty' as const,
      };

  return (
    <Image
      src={resolvedSource}
      alt={alt}
      loading={loading}
      sizes={sizes}
      className={className}
      {...blurProps}
      onError={() => {
        setHasError(true);
      }}
      {...props}
    />
  );
};

export default OptimizedImage;

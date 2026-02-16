import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { NextResponse } from 'next/server';

const faviconPath = resolve(process.cwd(), 'public', 'icons', 'icon-192.png');

export const dynamic = 'force-static';

export const GET = async (): Promise<Response> => {
  const iconBuffer = await readFile(faviconPath);

  return new NextResponse(iconBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};

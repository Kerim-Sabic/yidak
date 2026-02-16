import { NextResponse, type NextRequest } from 'next/server';

const notImplemented = (request: NextRequest): NextResponse =>
  NextResponse.json(
    {
      message: 'Use apps/api for tRPC requests.',
      path: request.nextUrl.pathname
    },
    { status: 501 }
  );

export const GET = notImplemented;
export const POST = notImplemented;

import { NextResponse } from 'next/server';
import { getSystemInfo } from '@/lib/sysinfo';

export async function GET() {
  try {
    const info = await getSystemInfo();
    return NextResponse.json(info);
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

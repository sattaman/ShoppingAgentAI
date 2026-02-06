import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const ANONYMOUS_ID_COOKIE = 'ct_anonymous_id';

export async function getOrCreateAnonymousId(): Promise<string> {
  const cookieStore = await cookies();
  let anonymousId = cookieStore.get(ANONYMOUS_ID_COOKIE)?.value;

  if (!anonymousId) {
    anonymousId = uuidv4();
    cookieStore.set(ANONYMOUS_ID_COOKIE, anonymousId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return anonymousId;
}

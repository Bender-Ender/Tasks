/**
 * Identity.
 *
 * In production the whole app sits behind Cloudflare Access, which strips and
 * re-signs its own headers, so the authenticated email it injects is
 * trustworthy — the app itself never sees or stores a credential.
 *
 * Locally there is no Access in front, so we fall back to a single fixed user.
 * Every query is scoped by user_id either way, which is what keeps multi-user
 * from being a migration later on.
 */

export const LOCAL_USER = 'local';

const ACCESS_EMAIL_HEADER = 'Cf-Access-Authenticated-User-Email';

export function userIdFrom(request: Request, isProduction: boolean): string {
  const email = request.headers.get(ACCESS_EMAIL_HEADER);

  // Outside production the header is attacker-controllable, so ignore it
  // rather than letting a spoofed header pick a user.
  if (!isProduction) return LOCAL_USER;

  return email && email.length > 0 ? email.toLowerCase() : LOCAL_USER;
}

/**
 * Identity.
 *
 * This is a single-person app. Cloudflare Access decides who may reach it at
 * all; past that gate there is exactly one owner and every row belongs to
 * them, so the owner id is a constant rather than something read off the
 * request.
 *
 * It used to be the Access email, gated on an ENVIRONMENT variable. That tied
 * the identity of the data to two things that drift. ENVIRONMENT lived only in
 * the dashboard, and `wrangler deploy` replaces a Worker's vars with whatever
 * the committed config declares — so a deploy silently switched every query to
 * the fallback user and the list came up empty. Access, meanwhile, signs in
 * automatically and asserts whichever address it likes, which had already
 * split the data across two emails. Both failures look identical from the
 * outside: the tasks are still there, and the app cannot see them. A constant
 * cannot be lost by a deploy or changed by a sign-in.
 *
 * This removes no protection that was holding: Access is still the only way in,
 * and the app still never handles a credential. What it drops is the separation
 * between users, which had one user on either side of it.
 *
 * Every query is still scoped by user_id, so the column and its indexes go on
 * working and real per-user identity can return later without a schema change.
 */

/** The one account. Deliberately not an email address: which address Access
 *  asserts is exactly the thing that kept moving. */
export const OWNER = 'owner';

export function userIdFrom(): string {
  return OWNER;
}

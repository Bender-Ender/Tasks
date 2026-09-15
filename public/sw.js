/**
 * Tombstone service worker.
 *
 * An earlier version of this site registered a service worker that cached the
 * app shell. Nothing registers one any more, but the old worker outlives the
 * code: it survives in every browser that ever loaded the site, keeps serving
 * its stale cached index.html — whose hashed asset URLs are long gone — and
 * cannot follow the Cloudflare Access redirect when a session expires. Either
 * way the page comes up blank, and redeploying does not help, because the dead
 * worker intercepts the new files too.
 *
 * This file exists to replace that worker and immediately dismantle it.
 * Browsers re-fetch the worker script on navigation, so each device picks this
 * up once, drops the caches, unregisters, and reloads into the live site.
 *
 * Nothing registers this. It only reaches browsers that already hold a
 * registration for /sw.js, which is exactly the set that needs it. Keep it
 * until every device has loaded the site at least once — deleting it early
 * strands whatever has not checked in yet.
 */

self.addEventListener('install', () => {
  // Don't wait for the broken tabs to close; they are the ones that need this.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
      await self.registration.unregister();

      // Those tabs are still showing the stale shell. Now that nothing sits in
      // front of the network, send them back through it.
      for (const client of await self.clients.matchAll({ type: 'window' })) {
        client.navigate(client.url).catch(() => {});
      }
    })(),
  );
});

// No fetch handler on purpose: requests go straight to the network, so the
// browser handles an Access redirect itself instead of failing it.

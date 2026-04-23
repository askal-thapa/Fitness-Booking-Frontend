// Custom service worker entry — compiled by next-pwa and merged into sw.js
// Handles Web Push notifications

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  const title: string = data.title ?? 'Askal';
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'askal-msg',
    renotify: true,
    data: { url: data.url ?? '/chat' },
    vibrate: [150, 80, 150],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url: string = (event.notification.data as any)?.url ?? '/chat';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});

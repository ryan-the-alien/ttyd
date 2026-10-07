self.addEventListener('notificationclick', event => {
    const notificationUrl = event.notification.data?.url || self.registration.scope;
    event.notification.close();

    event.waitUntil(
        (async () => {
            const target = new URL(notificationUrl, self.location.origin);
            if (target.origin !== self.location.origin) {
                target.href = self.registration.scope;
            }

            const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            const existing = windows.find(client => {
                const clientUrl = new URL(client.url);
                return clientUrl.origin === target.origin && clientUrl.pathname === target.pathname;
            });

            if (existing) return existing.focus();
            return self.clients.openWindow(target.href);
        })()
    );
});

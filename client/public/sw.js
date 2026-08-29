// client/public/sw.js
// Must be served from the site root (e.g. https://yoursite.com/sw.js) so its
// scope covers the whole app. Vite/CRA both serve /public files at the root.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = { title: "Local Newz", body: "New story published.", url: "/" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch (e) {
    payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      data: { url: payload.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
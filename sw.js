/* ============================================================================
 * SERVICE WORKER FÜR WEB-PUSH BENACHRICHTIGUNGEN (sw.js)
 * ============================================================================ */

self.addEventListener('push', function (event) {
    var payload = {
        title: '♟️ Familien-Schach',
        body: 'Dein Gegner hat gezogen!',
        gameId: null
    };

    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload.body = event.data.text();
        }
    }

    var options = {
        body: payload.body,
        vibrate: [150, 70, 150],
        tag: payload.gameId ? ('fc-game-' + payload.gameId) : 'fc-move',
                      renotify: true,
                      data: {
                          url: './index.html',
                      gameId: payload.gameId
                      }
    };

    event.waitUntil(
        self.registration.showNotification(payload.title || '♟️ Familien-Schach', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./index.html');
            }
        })
    );
});

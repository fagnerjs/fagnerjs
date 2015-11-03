'use strict';

self.addEventListener('push', function(event) {
    console.log('Received a push message', event);
    event.waitUntil(
        self.registration.showNotification('Teste', {
            body: 'Teste de push',
            icon: 'http://e.imguol.com/futebol/brasoes/40x40/corinthians.png',
            tag: 'tag-push'
        })
    );
});

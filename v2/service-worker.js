'use strict';

self.addEventListener('click', function(event) {
  console.log('Received a push message', event);

  var title = 'BBBBBYay a message.';
  var body = 'We have received a push message.';
  var icon = '/images/icon-192x192.png';
  var tag = 'simple-push-demo-notification-tag';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag
    })
  );
});
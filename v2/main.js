'use strict';

window.addEventListener('load', function() {  
	// Check that service workers are supported, if so, progressively  
	// enhance and add push messaging support, otherwise continue without it.  
	if ('serviceWorker' in navigator) {  
		navigator.serviceWorker.register('./service-worker.js')  
			.then(initialiseState);  
	} else {  
		console.warn('Service workers aren\'t supported in this browser.');  
	}  

});

// Once the service worker is registered set the initial state  
function initialiseState() {  
  // Are Notifications supported in the service worker?  
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {  
    console.warn('Notifications aren\'t supported.');  
    return;  
  }

  // Check the current Notification permission.  
  // If its denied, it's a permanent block until the  
  // user changes the permission  
  if (Notification.permission === 'denied') {  
    console.warn('The user has blocked notifications.');  
    return;  
  }else{
    // We need the service worker registration to check for a subscription  
    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {  
      // Do we already have a push message subscription?  
      console.log(serviceWorkerRegistration) 
      serviceWorkerRegistration.showNotification('title', {
        body: 'body',
        icon: 'icon',
        tag: 'tag'
      })
    });
  }

    
}

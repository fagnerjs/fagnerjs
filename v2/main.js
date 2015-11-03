(function(){

    'use strict';
    
    var that;

    return {
        data : {},
        settings : {
            API_KEY : 'AIzaSyDAd7op8e9azlfOu-wvN5D--nxzEDbj2GE',
            GCM_ENDPOINT : 'https://android.googleapis.com/gcm/send',
            STORAGE_KEY : 'uolPushNotification',
            tags : ['geral']
        },
        container : document.querySelector('#panel-notifications'),
        subscribe : function ( callback ) {
            navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
                serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
                    .then(function(subscription) {
                        document.querySelector('.debug').innerHTML = JSON.stringify(subscription);

                        if(!subscription.subscriptionId){
                            var endpointSections = subscription.endpoint.split('/');
                            subscription.subscriptionId = endpointSections[endpointSections.length - 1];
                        }

                        // Set user subscription
                        that.postData(subscription.subscriptionId, function ( data ) {
                            // show curl command
                            that.showCurlCommand(subscription);
                            callback instanceof Function && callback.call( null, true );
                        });
                    })
                    .catch(function(e) {
                        if(Notification.permission === 'denied') {
                            console.log('Permission for Notifications was denied');
                        }else{
                            console.log('Unable to subscribe to push.', e);
                        }
                        callback instanceof Function && callback.call( null, false, e );
                    });
                
            });
        },
        unsubscribe : function ( callback ) {
            navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
                serviceWorkerRegistration.pushManager.getSubscription().then(function(pushSubscription) {
                        pushSubscription.unsubscribe().then(function(successful){
                            // Unset data
                            that.unsetData( pushSubscription.subscriptionId, function () {
                                callback instanceof Function && callback.call( null, true );
                            });
                        }).catch(function(e) {
                            console.log('Unsubscription error: ', e);
                            callback instanceof Function && callback.call( null, false, e );
                        });
                    }).catch(function(e) {
                        callback instanceof Function && callback.call( null, false, e );
                        console.log('Error thrown while unsubscribing from ' + 'push messaging.', e);
                    });
              });
        },
        getSubscribe : function ( callback ) {
            navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
                serviceWorkerRegistration.pushManager.getSubscription().then(function(pushSubscription) {
                    if(!pushSubscription.subscriptionId){
                        var endpointSections = pushSubscription.endpoint.split('/');
                        pushSubscription.subscriptionId = endpointSections[endpointSections.length - 1];
                    }
                    callback instanceof Function && callback.call( null, pushSubscription);
                }).catch(function(e) {
                    console.warn('Error thrown while unsubscribing from ' + 'push messaging.', e);
                });
            });
        },
        showCurlCommand : function(PushSubscription) {
            document.querySelector('p').textContent = PushSubscription.subscriptionId;
            document.querySelector('code').textContent = 'curl --header "Authorization: key=' 
                + that.settings.API_KEY + '" --header Content-Type:"application/json" ' + that.settings.GCM_ENDPOINT +
                ' -d "{\\"registration_ids\\":[\\"' + PushSubscription.subscriptionId + '\\"]}"';
        },
        /**
         * 
         * @method postData
         * @param {String} subscriptionID
         * @param {Function} callback Function returned as callback
         * @return {Void}
         */
        postData : function ( subscriptionID, callback ) {

            // Tags of interest
            [].forEach.call(that.container.querySelectorAll('input[name="tags"]:checked'), function(el,index){
                that.settings.tags.push(el.value);
            });

            // Object to be taken in storage and sent to the api
            that.data = {
                subscriptionID : subscriptionID,
                configs : {
                    channel : location.host,
                    team : this.getCookie('meuTime'),
                    tags : that.settings.tags
                }
            };

            // Saving the settings in the 'localStorage'
            that.setStorage( that.data );

            callback instanceof Function && callback.call( null, that.data);
        },
        /**
         * 
         * @method putData
         * @param {String} subscriptionID
         * @param {Function} callback Function returned as callback
         * @return {Void}
         */
        putData : function ( subscriptionID, object, callback ) {

            // Interest
            if(!object){
                [].forEach.call(that.container.querySelectorAll('input[name="tags"]:checked'), function(el,index){
                    that.settings.tags.push(el.value);
                });
            }

            // Object to be taken in storage and sent to the api
            that.data = {
                subscriptionID : subscriptionID,
                configs : object || {
                    channel : location.host,
                    team : this.getCookie('meuTime'),
                    tags : that.settings.tags
                }
            };

            // store configs
            that.setStorage( that.data );

            callback instanceof Function && callback.call( null, that.data);
        },
        /**
         * 
         * @method unsetData
         * @param {String} subscriptionID
         * @param {Function} callback Function returned as callback
         * @return {Void}
         */
        unsetData : function ( subscriptionID, callback ) {
            localStorage.removeItem( that.settings.STORAGE_KEY );
            delete that.data;
            callback instanceof Function && callback.call( null, subscriptionID);
        },
        /**
         * Get localStorage data
         *
         * @method setStorage
         * @return {Object} localStorage data
         */
        setStorage : function(data){
            if(!data) return false;
            localStorage.setItem(that.settings.STORAGE_KEY, JSON.stringify(data));
        },
        /**
         * Get localStorage data
         *
         * @method getStorage
         * @return {Object} localStorage data
         */
        getStorage : function(){
            return JSON.parse( localStorage.getItem(that.settings.STORAGE_KEY) );
        },
        /**
         * Retorna um objeto com o id do
         * @method getData
         * @return {Object} data object
         */
        getUserData : function ( callback ) {
            var data;
            /**
             * Return the callback with the user data
             * @method callbackHandler
             * @param {Object} user data
             * @return {Void}
             */
            var callbackHandler = function ( data ) {
                callback instanceof Function && callback.call( null, data );
            }
            // Get subscriptionID
            that.getSubscribe( function ( subscription ) {
                // show curl command
                // Check subscription
                if(subscription){            
                    that.showCurlCommand(subscription);
                    data = that.getStorage();
                    // Verifies the user data in localStorage
                    if(data && data.subscriptionID){
                        // Check that the signature matches with localStorage data
                        // If the signature is different, retrieve data via API
                        if(subscription.subscriptionId != data.subscriptionID){
                            that.request('http://esporte.uol.com.br/futebol/extensions/chrome/fetchall.htm', function ( response ) {
                                that.putData(subscription.subscriptionId, response.config, function ( data ) {
                                    callbackHandler( data );
                                });
                            });
                        }else{
                            callbackHandler( data );
                        }
                    }else{
                        that.request('http://esporte.uol.com.br/futebol/extensions/chrome/fetchall.htm?callback=jsonpCallback&paths=team-games-live,team&team-id=6', function ( response, status ) {
                            that.putData(subscription.subscriptionId, response.config , function ( data ) {
                                callbackHandler( data );
                            });
                        });
                    }
                }else{
                    callbackHandler( data );
                }
            });
        },
        /**
         * Get the cookie by name and domain
         * @method getCookie
         * @param {String} domain The desired cookie domain
         * @param {String} name The desired cookie name
         * @param {Function} callback Function returned as callback
         */
        getCookie : function(c_name) {
            var c_value = document.cookie;
            var c_start = c_value.indexOf(" " + c_name + "=");
            if (c_start == -1){
                c_start = c_value.indexOf(c_name + "=");
            }
            if (c_start == -1){
                c_value = null;
            }else{
                c_start = c_value.indexOf("=", c_start) + 1;
                var c_end = c_value.indexOf(";", c_start);
                if (c_end == -1){
                    c_end = c_value.length;
                }
                c_value = unescape(c_value.substring(c_start,c_end));
            }
            return c_value;
        },
        /**
         * Set a cookie based on the parameters passed to the method
         * @method setCookie
         * @param {Object} Parameters needed to set the cookie (cookieName, cookieValue, nDays, path)
         * @param {Function} callback Function returned as callback
         */
        setCookie : function(cookieName,cookieValue,nDays, path) 
        {
            var today = new Date();
            var expire = new Date();
            var path = (!path) ? '/' : path;
            var nDays =  (nDays == null || nDays == 0) ? 1 : nDays;
            expire.setTime(today.getTime() + 3600000*24*nDays);
            document.cookie = cookieName + "=" + cookieValue + ";expires=" + expire.toGMTString() + ';path=' + path;
            return true;
        },
        /**
         * It makes a request data
         * @method request
         * @param {String} url Url to request
         * @param {Function} callback Function returned as callback
         * @return {Function} callback Function returned as callback
         */
        request : function(url, callback){
            var x = new XMLHttpRequest();
            x.open('GET', url, true);
            x.onload = function() {
                if (x.readyState === 4) {  
                    if (x.status === 200) {  
                        callback instanceof Function && callback.call( null, x.response, x.status );
                    } else {
                        console.warn('Request error');
                    }  
                }
            };
            x.onerror = function() {
                callback instanceof Function && callback.call( null, x.response, x.status );
                console.warn('Request error');
            };
            x.setRequestHeader( "Pragma", "no-cache" );
            x.setRequestHeader( "Cache-Control", "no-cache" );
            x.send( null );
        },
        binds : function() {
            var button = that.container.querySelector('#enable-notification');
            /**
             * Changes the status of the button if the push notification is enabled
             * @method buttonState
             * @return {Void}
             */
            var buttonState = function () {
                // Button states
                if(that.data){
                    // the active button state
                    button.innerHTML = 'Desabilitar notificações'
                    button.classList.add('btn-danger');
                }else{
                    // state inactive button
                    button.innerHTML = 'Habilitar notificações'
                    button.classList.remove('btn-danger');
                }
                return true;
            };
            /**
             * Marks the tags selected by the user
             * @method tagsState
             * @return {Void}
             */
            var tagsState = function () {
                [].forEach.call(document.querySelectorAll('input[name="tags"]'), function (el, index) {
                    if(that.data){
                        if(that.data.configs.tags.indexOf(el.value) > -1 ){
                            el.setAttribute('checked', true);
                        }else{
                            el.removeAttribute('checked');
                        }
                    }else{
                        el.removeAttribute('checked');
                    }
                });
                return true;
            };
            // Enalbe Button listener
            button.addEventListener('click', function(){
                navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
                    if(that.data){
                        that.unsubscribe( function ( success ) {
                            success && buttonState() && tagsState();
                        });
                    }else{
                        that.subscribe( function ( success ) {
                            success && buttonState() && tagsState();
                        });
                    }
                });
            });
            // Update configs
            [].forEach.call(document.querySelectorAll('input[name="tags"]'), function (el, index) {
                el.addEventListener('click', function (evt) {
                    that.data && that.putData(that.data.subscriptionID);
                });
            });

            buttonState() && tagsState();
        },
        init : function() {
            that = this;

            // Teste
            that.setCookie('meuTime', 6);

            if('serviceWorker' in navigator) {  
                navigator.serviceWorker.register('https://fagnerjs.github.io/fagnerjs/v2/service-worker.js').then(function(){
                    // verifies that supports notifications
                    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {  
                        console.warn('Notifications aren\'t supported.');
                        alert('Notifications aren\'t supported.');
                        return;  
                    }
                    // checks are allowed to notifications
                    if (Notification.permission === 'denied') {  
                        console.warn('The user has blocked notifications.');  
                        alert('The user has blocked notifications.');  
                        return;  
                    }
                    // Handle user data and starts the binds
                    that.getUserData( function ( data ) {
                        that.data = data;
                        that.binds();
                    });
                });  
            }else{  
                console.warn('Service workers aren\'t supported in this browser.');  
            }          
        }
    }.init();
})();








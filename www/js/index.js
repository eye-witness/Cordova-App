//cross platform IndexedDB
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        //var parentElement = document.getElementById(id);
        //var listeningElement = parentElement.querySelector('.listening');
        //var receivedElement = parentElement.querySelector('.received');

        //isteningElement.setAttribute('style', 'display:none;');
        //eceivedElement.setAttribute('style', 'display:block;');
        
        if (device.platform === "Android"){
           //Android only stuff
           console.log('Background mode enabled');
           
           cordova.plugins.backgroundMode.enable(); 
           cordova.plugins.backgroundMode.onfailure = function(errorCode) {
             console.log('Background mode failed');  
           };
        }
        
        StatusBar.backgroundColorByHexString('#22229c');

        var that = this;        
        this.loadDatabase(function(db){
           //database loaded
            var objectStore = db.transaction("gps").objectStore("gps");
            
            var lowerBound = IDBKeyRange.lowerBound(Date.now() - 10*1000);
            
            objectStore.openCursor(lowerBound).onsuccess = function(event) {
              var cursor = event.target.result;
              if (cursor) {
                console.log("Name for SSN " + (cursor.key/1000) + " is " + cursor.value.lat);
                cursor.continue();
              }
              else {
                //finished
              }
            };

           setInterval(function () {
             that.getGPSLocation(db);
             that.createNotification();
           }, 10000);
           
          that.loadGoogleMaps(db);
        });
        
    },
    getGPSLocation: function(db){
        var onSuccess = function(position){
          var gpsData = {
            "lat": position.coords.latitude,
            "long": position.coords.longitude,
            "speed": position.coords.speed,
            "timestamp": position.timestamp
          }
          
          var transaction = db.transaction(["gps"], "readwrite");
          var objectStore = transaction.objectStore("gps");
          var request = objectStore.add(gpsData);
          request.onsuccess = function(event) {
            console.log('Yo GPS went in database');
          };
        };
        
        var onError = function(err){
          alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
        };
        
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
        
        
        
    },
    loadGoogleMaps: function(db){
        var mapOptions = {
          center: { lat: -25.363882, lng: 131.044922},
          zoom: 8,
          disableDefaultUI: true

        };
                    
        var map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
            
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(-25.363882,131.044922),
          map: map,
          title: 'A test Point'
        });
        
        var lowerBound = IDBKeyRange.lowerBound(Date.now() - 600*1000);
        var transaction = db.transaction(["gps"], "readwrite");
        var objectStore = transaction.objectStore("gps"); 
        var gpsLine = [];
        objectStore.openCursor(lowerBound).onsuccess = function(event) {
              var cursor = event.target.result;
              if (cursor) {
                gpsLine.push( new google.maps.LatLng(cursor.value.lat,cursor.value.long));
                console.log('hello')
                var center = new google.maps.LatLng(cursor.value.lat, cursor.value.long);
                map.panTo(center);
                cursor.continue();
              }
            else {
               //finished
               console.log(gpsLine);
               
               var gpsPolyline = new google.maps.Polyline({
                path: gpsLine,
                geodesic: true,
                strokeColor: '#3367d6',
                strokeOpacity: 1.0,
                strokeWeight: 3
              });

              gpsPolyline.setMap(map);
            }
       };
    },
    loadDatabase: function(callback){
        var db;
        var request = window.indexedDB.open("gps", 3);
        
        request.onerror = function(event) {
          console.log('Error creating database');
        }
        
        request.onupgradeneeded = function(event) {
          db = event.target.result;
          var objectStore = db.createObjectStore("gps", { keyPath: "timestamp" });
          objectStore.createIndex("timestamp", "timestamp", { unique: true });
          
        }
        
        request.onsuccess = function(event) {
          db = event.target.result;
          callback(db);
        };
    },
    expand: function(obj){
        console.log('Expanded Testing 123');
        var id = obj.id;
        var e = document.getElementById(id);
        console.log(e.getAttribute('class'));
        
        if (e.getAttribute('class') === 'card'){
          var es = document.getElementsByClassName('card');
        
          for (i = 0; i < es.length; i++) {
            es[i].setAttribute('class','card card-hidden');
          }
          
          e.setAttribute('class', 'card card-expanded');
        } else {
          var es = document.getElementsByClassName('card');
        
          for (i = 0; i < es.length; i++) {
            es[i].setAttribute('class','card');
          }
          
          e.setAttribute('class', 'card');            
        }
    },
    createNotification: function(){
      var t = new Date();
      t.setSeconds(t.getSeconds() + 3);

      window.plugin.notification.local.add({
        title:   'Scheduled with delay',
        message: 'Test Message ',
        date:    t
      });
    }
};

app.initialize();
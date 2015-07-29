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
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
        
        if (device.platform === "Android"){
           //Android only stuff
           console.log('Background mode enabled');
           
           cordova.plugins.backgroundMode.enable(); 
           cordova.plugins.backgroundMode.onfailure = function(errorCode) {
             console.log('Background mode failed');  
           };
        }
        
        var request = loadDatabase();
        
        this.loadGoogleMaps();
        
        var self = this;
        setInterval(function () {
          self.getGPSLocation();
        }, 1000);

    },
    getGPSLocation: function(){
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
    loadGoogleMaps: function(){
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
          title: 'Hello World!'
      });
    },
    loadDatabase: function(){
        var db;
        var request = window.indexedDB.open("MyTestDatabase", 3);
        
        request.onerror = function(event) {
          console.log('Error creating database');
        }
        
        request.onupgradeneeded = function(event) {
          db = event.target.result;
          var objectStore = db.createObjectStore("gps", { keyPath: "timestamp" });
          objectStore.createIndex("timestamp", "timestamp", { unique: true });
        }
        return db;
    }
};

app.initialize();
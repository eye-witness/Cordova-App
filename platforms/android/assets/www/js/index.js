/* global device */
/* global google */
/* global cordova */
//cross platform IndexedDB
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var that;
var db;
var lastUpdate = 0;
var backendURL = "http://104.236.110.36/index.php/api/appeals/";
var currentEvents = [{"case_id":"200","time":"1438334674","latitude":"52.035642","longitude":" -1.329481","radius":"100","description":{
    "location":"Next to M40 at Bodicote","crimeType":"Car Crash","text":"Blue Toyota Prius with unkown number plate collided with white Audi. Driver left the scene without providing ID."
 },"police_force_id":"1","block_id":"105,-4","created":"1438334674","contact":{"phoneNumber":"101","policeForce":"Surrey Police"}},
 {"case_id":"201","time":"1438334674","latitude":"52.035642","longitude":" -1.329481","radius":"100","description":{
    "location":"Last seen near Star Bucks","crimeType":"Missing Person","text":"Male age 17 left home at 5:30, spotted at Star Bucks, but not since. Wearing Red T-Shirt,  6 Foot 2."
 },"police_force_id":"1","block_id":"105,-4","created":"1438334674","contact":{"phoneNumber":"101","policeForce":"Surrey Police"}}
 ];



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
           
           StatusBar.backgroundColorByHexString('#22229c');
        }
        
        this.renderUI();

        that = this;
           
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

           that.runUpdate(db);
           setInterval(function () {
             that.getGPSLocation(db);
             //that.createNotification('Request for information matched','Tap to review the case');
           }, 60000);
           
         // that.loadGoogleMaps(db);
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
    loadGoogleMaps: function(db, id, lat, long, msg){
        //check there is internet connection before loading app
        if (google) {
            var mapOptions = {
              center: { lat: -25.363882, lng: 131.044922},
              zoom: 14,
              disableDefaultUI: true
    
            };
                        
            var map = new google.maps.Map(document.getElementById(id),
                mapOptions);
                
            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(lat,long),
              map: map,
              title: msg
            });
            
            var lowerBound = IDBKeyRange.lowerBound( (Date.now() - 7*24*60*60*1000) ) ;
            var transaction = db.transaction(["gps"], "readwrite");
            var objectStore = transaction.objectStore("gps"); 
            var gpsLine = [];
            var center;
            center = new google.maps.LatLng(lat, long);
            
            objectStore.index('timestamp').openCursor(lowerBound, 'next').onsuccess = function(event) {
                  var cursor = event.target.result;
                  if (cursor) {
                    gpsLine.push( new google.maps.LatLng(cursor.value.lat,cursor.value.long));
                    cursor.continue();
                  } else {
                   //finished
                   map.panTo(center);               
                   var gpsPolyline = new google.maps.Polyline({
                    path: gpsLine,
                    geodesic: false,
                    strokeColor: '#3367d6',
                    strokeOpacity: 1.0,
                    strokeWeight: 3
                  });
    
                  gpsPolyline.setMap(map);
                  
                  google.maps.event.trigger(map,'resize');
                }
           };
       }
    },
    loadDatabase: function(callback){
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
        console.log('Expanded '+obj.id);
        var id = obj.id;
        var e = document.getElementById(id);
        console.log(e.getAttribute('class'));
        
        if (e.getAttribute('class') === 'card'){
          var es = document.getElementsByClassName('card');
        
          for (i = 0; i < es.length; i++) {
            es[i].setAttribute('class','card card-hidden');
          }
          
          for (var i = 0; i < e.childNodes.length; i++) {
              if (e.childNodes[i].className == "card-body") {
                e2 = e.childNodes[i];
                var child = document.createElement('div');
                child.innerHTML = '<div id="map-canvas-'+obj.id+'" class="map" onclick="event.cancelBubble=true;if (event.stopPropagation) event.stopPropagation();"></div> ';
                child = child.firstChild;
                e2.insertBefore(child, e2.firstChild);
                console.log('Yo added');
                break;
              }        
          }
          
          //create google map
          that.loadGoogleMaps(db,'map-canvas-'+obj.id, e.getAttribute('data-lat'), e.getAttribute('data-long'), e.getAttribute('data-msg'));

          e.setAttribute('class', 'card card-expanded');
        } else {
          var es = document.getElementsByClassName('card');
        
          for (i = 0; i < es.length; i++) {
            es[i].setAttribute('class','card');
          }
          
          var tds = e.getElementsByTagName('div');
          var key;
          for(key in tds) {
           if(tds[key].className == 'map') {
             tds[key].parentNode.removeChild(tds[key]);
           }
          }
          
          e.setAttribute('class', 'card');            
        }
    },
    createNotification: function(title, message){
      if (device.platform === "Android"){
          var t = new Date();
          t.setSeconds(t.getSeconds() + 3);
    
          window.plugin.notification.local.add({
            title:   title,
            message: message,
            date:    t
          });
      } else {
          alert(title+':'+message);
      }
    },
    runUpdate: function(db){
        var blocks = {}; //object of blocks to be requested 
        var blocksObject = [];
        
        console.log('Running update');
        
        var lowerBound = IDBKeyRange.lowerBound(lastUpdate);
        var transaction = db.transaction(["gps"], "readwrite");
        var objectStore = transaction.objectStore("gps"); 
        var gpsLine = [];
        objectStore.openCursor(lowerBound).onsuccess = function(event) {
              var cursor = event.target.result;
              if (cursor) {
                var lat,long,latR,longR;
                var lat = cursor.value.lat;
                var long = cursor.value.long;
                
                lat = Math.ceil(lat*2).toString();
                long = Math.floor(long*2).toString();
                
                blocks[lat+','+long] = 1; 
                
                latR = cursor.value.lat - lat
                longR = cursor.value.long - long;
                
                //console.log(latR+','+longR);
                
                if (latR<0.2){
                    //request block below
                    //console.log("BlockBelow");
                    blocks[(parseInt(lat,10)-1).toString()+','+long] = 1;
                }
                
                if (latR>0.8){
                    //request block above
                    //console.log("BlockAbove");
                    blocks[(parseInt(lat,10)+1).toString()+','+long] = 1;
                }
                
                if (longR<0.2){
                    //request block right
                    //console.log("BlockRight");
                    blocks[lat+','+(parseInt(long,10)+1).toString()] = 1;
                }
                
                if (longR>0.8){
                    //request block left
                    //console.log("BlockLeft");
                    blocks[lat+','+(parseInt(long,10)-1).toString()] = 1;
                }
                
                cursor.continue();
              }
            else {
               //loop through blocks and generate request 
               
               for (var key in blocks) {
                   if (blocks.hasOwnProperty(key)) {
                       var latLong = key.split(",");
                       var lat = latLong[0];
                       var long = latLong[1];
                       
                       blocksObject.push({latitude: lat, longitude: long});
                   }
               }
               var json = {};
               json.blocks = blocksObject;
               json.lastFetched = lastUpdate;
               json.time = Math.round(Date.now()/1000);
               
               console.log(JSON.stringify(json));
               
               var r = new XMLHttpRequest(); 
                r.open("POST", backendURL, true);
                r.onreadystatechange = function () {
                	if (r.readyState != 4 || r.status != 200) return; 
                  that.filterData(r.responseText);
                };
                r.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                r.send(JSON.stringify(json));

               
               lastUpdate = Math.round(Date.now()/1000);
            }
        }
    },
    renderUI: function(){
        //first of all empty the app
        document.getElementById('app').innerHTML = '';
        
        for (var key in currentEvents) {
            if (currentEvents.hasOwnProperty(key)) {
                var e = currentEvents[key];
                
                console.log(e.description.crimeType);
                
                var child = document.createElement('div');
                child.innerHTML = '<div data-lat="'+e.latitude+'" data-long="'+e.longitude+'"  data-msg="'+e.description.crimeType+'" class="card" onclick="app.expand(this)" id="card-'+e.case_id+'"><div class="card-header"><div class="card-header-circle"></div></div><div class="card-body"><h2>'+e.description.crimeType+'</h2>Date: 31/07 16:57<br>Location: '+e.description.location+'<br><br>'+e.description.text+'<br></div><div class="card-footer"><div class="button"><span onclick="event.cancelBubble=true;if (event.stopPropagation) event.stopPropagation();"><span onclick="app.deleteCard('+e.case_id+')"><img src="img/dismiss.png" height="40px"/><br>Dismiss</span></span></div><div class="button right"><span onclick="event.cancelBubble=true;if (event.stopPropagation) event.stopPropagation();"><span onclick="app.reportCard('+e.case_id+')"><img src="img/report.png" height="40px"  /><br>Report</span></span></div></div></div>';
                child = child.firstChild;
                document.getElementsByClassName('app')[0].appendChild(child);
            }
        }
    },
    deleteCard: function(id){
      //delete from the currentEvents array
      for (var i = 0; i < currentEvents.length; i++) {
          var e = currentEvents[i];
          if (e.case_id == id){
              console.log('match found LOL');
              currentEvents.remove(i);
              that.renderUI();
          }
      }
      
    },
    reportCard: function(id){
      //make a popup message
      
      //set popup style to display
      var e = document.getElementById('popup');
      e.setAttribute('style','display:block;');
      var e = document.getElementById('app');
      e.setAttribute('style','display:none;');
    },
    closeReportCard: function(){
      var e = document.getElementById('popup');
      e.setAttribute('style','display:none;');
      var e = document.getElementById('app');
      e.setAttribute('style','display:block;');      
    },
    filterData: function(data){
      data = JSON.parse(data);
      
      //loop through all GPS 
      var lowerBound = IDBKeyRange.lowerBound( (Date.now() - 7*24*60*60*1000) ) ;
      var transaction = db.transaction(["gps"], "readwrite");
      var objectStore = transaction.objectStore("gps"); 
        
      objectStore.index('timestamp').openCursor(lowerBound, 'next').onsuccess = function(event) {
              var cursor = event.target.result;
              if (cursor) {
                var lat = cursor.value.lat;
                var long = cursor.value.long;
                 
                for (var i = 0; i < data.length; i++) {
                  var e = data[i];
                  if (e){
                      var distance = calcCrow(lat,long,e.latitude,e.longitude);   
                      //m converted to km
                      if (distance < (e.radius/1000)){
                        currentEvents.push(e);
                        //ensure there are no doubles
                        data[i] = null;
                      }
                   }
                }
                cursor.continue();
              } else {
               //finished
               //rerender UI
               that.renderUI();
              }
       };
      
      

    }
};

//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2) 
{
  var R = 6371; // km
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) 
{
    return Value * Math.PI / 180;
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

app.initialize();
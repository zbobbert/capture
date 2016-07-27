var noSqlDb = "capture";

var myLatLng = {lat: 37.76703763908325, lng: -122.399161844198};
var map;

function zoomToMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setCurrentPosition);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function setCurrentPosition(position) {
  myLatLng = {lat: position.coords.latitude, lng: position.coords.longitude};
  console.log(myLatLng);
  initMap();
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: myLatLng
  });
}

function search() {
  $.couch.db(noSqlDb).view("map/lat", {
    success: function(data) {
      console.log(data);
    },
    error: function(status) {
      console.log(status);
    },
    reduce: false
  });

  var marker = new google.maps.Marker({
    position: myLatLng,
    map: map,
    title: 'Hello World!'
  });
}

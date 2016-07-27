var noSqlDb = "capture";

var myLatLng = {lat: 37.76703763908325, lng: -122.399161844198};
var map;

var arrX;
var arrY;
var results = [];

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
  $.couch.urlPrefix = "http://localhost:5984";

  searchLat(function() {
    searchLng(function() {
      mergeResults(function() {
        showResults();
      });
    })
  });
}

function showResults() {
    results.forEach(function(item, index){
      console.log("Marker: " + item);
      var marker = new google.maps.Marker({
        position: item.coords,
        map: map,
        title: item.id
      });
    });
}

function searchLat(callback) {
  $.couch.db(noSqlDb).view("map/lat", {
    success: function(data) {
      arrX = data.rows;
      callback();
    },
    error: function(status) {
      console.log(status);
    },
    reduce: false,
    startkey: map.getBounds().getSouthWest().lat(),
    endkey: map.getBounds().getNorthEast().lat()
  });
}

function searchLng(callback) {
  $.couch.db(noSqlDb).view("map/lng", {
    success: function(data) {
      arrY = data.rows;
      callback();
    },
    error: function(status) {
      console.log(status);
    },
    reduce: false,
    startkey: map.getBounds().getSouthWest().lng(),
    endkey: map.getBounds().getNorthEast().lng()
  });
}

function mergeResults(callback) {
  arrX.forEach(function(xItem, xIndex) {
    arrY.forEach(function(yItem, yIndex) {
      if (xItem.id === yItem.id) {
        if ($.inArray(xItem.id,results)){
          results.push({id: xItem.id,
          coords:{
            lat: xItem.key,
            lng: yItem.key
          }});
        }
      }
    });
  });
  callback();
}

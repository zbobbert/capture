var host = "192.168.1.115";
var noSqlDb = "capture";
$.couch.urlPrefix = "http://" + host + ":5984";

var myLatLng = {lat: 37.76703763908325, lng: -122.399161844198};
var map;

var arrX;
var arrY;
var results;
var markers = [];

var imageButton;

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
  map.setCenter(myLatLng);
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 17,
    center: myLatLng
  });

  map.addListener('center_changed', function() {
    //deleteMarkers();
  });


}

function search() {
  results = [];

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

    marker.addListener('click', function() {
      showInfo(item);
    });

    markers.push(marker);
  });
}

function buyImage(e) {
  console.log(e);
  e.target.disabled = true;
  e.target.innerHTML = "Bought";
  imageButton.disabled = false;
  $.couch.db(noSqlDb).openDoc(e.target.id.split(",")[1], {
    success: function(data) {
      console.log(data);
      if (data.numPurchases == undefined) {
        data.numPurchases = 1;
      }
      else {
        data.numPurchases += 1;
      }
      $.couch.db(noSqlDb).saveDoc(data, {
        success: function(data) {
          console.log(data);
        },
        error: function(status) {
          console.log(status);
          alert("There was an issue with the NoSQL database.");
        }
      });
    },
    error: function(status) {
      console.log(status);
    }
  });
}

function viewImage(e) {
  console.log("Opening: " + "http://" + host + ":5984/ipfs/" + e.target.id.split(",")[1] + "/image");
  window.open("http://" + host + ":5984/ipfs/" + e.target.id.split(",")[1] + "/image");
}

function showInfo(item) {
  var infoDiv = document.getElementById("itemInfo");
  infoDiv.innerHTML = '';
  imageButton = document.createElement("button");
  imageButton.id = "img," + item.id;
  imageButton.onclick = viewImage;
  imageButton.innerHTML = item.id;
  imageButton.disabled = true;
  infoDiv.appendChild(imageButton);
  var buyButton = document.createElement("button");
  buyButton.id = "btn," + item.id;
  buyButton.onclick = buyImage;
  buyButton.innerHTML = "Buy this image";
  infoDiv.appendChild(buyButton);
  infoDiv.appendChild(document.createElement("br"));
  var thumbnail = document.createElement("img");
  thumbnail.src = "http://" + host + ":5984/capture/" + item.id + "/thumbnail.png";
  infoDiv.appendChild(thumbnail);
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
        if (checkDate(xItem.value)) {
          if ($.inArray(xItem.id,results)){
            results.push({id: xItem.id,
              coords:{
                lat: xItem.key,
                lng: yItem.key
              },
              cdate: xItem.value
            });
          }
        }
      }
    });
  });
  callback();
}

function checkDate(date) {
  var arrDateTime = date.split(" ");
  var arrDate = arrDateTime[0].split(":");
  var date = arrDate[0] + "/" + arrDate[1] + "/" + arrDate[2] + " " + arrDateTime[1];
  var date = new Date(date);
  var dateBegin = new Date(document.getElementById("datepickerBegin").value);
  var dateEnd = new Date(document.getElementById("datepickerEnd").value);

  //console.log(date + " in " + dateBegin + " and " + dateEnd);

  if ((date > dateBegin) && (date < dateEnd)) {
    return true;
  }
  else if ((dateBegin === "Invalid Date") && (date < dateEnd)) {
    console.log("dateBegin is undefined");
    return true;
  }
  else if ((date > dateBegin) && (dateEnd == "Invalid Date")) {
    console.log("dateEnd is undefined");
    return true;
  }
  else if ((dateBegin == "Invalid Date") && (dateEnd == "Invalid Date")) {
    console.log("dateBegin and dateEnd are undefined");
    return true;
  }
  else {
    return false;
  }
}

//Marker Helper Functions
// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
  setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
  setMapOnAll(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  clearMarkers();
  markers = [];
}

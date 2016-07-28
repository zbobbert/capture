var host = "192.168.1.115";
var noSqlDb = "capture";
var thumbx = 200;
var thumby = 200;
var fullPic;
var ipfsId;

/*
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

if (navigator.getUserMedia) {
console.log("handling video");
navigator.getUserMedia({video: true}, handleVideo, videoError);
}
else {
console.log("browser does not support video");
var parent = document.getElementById("camera");
var child = document.getElementById("videoElement");
parent.removeChild(child);
}
*/

function upload() {
  fullPic = document.getElementById("fullPic").files[0];
  var ownerAddr = document.getElementById("oAddr").value;
  var description = document.getElementById("desc").value;
  var tagstr = document.getElementById("tags").value;
  var thumbnail = document.getElementById("thumbnail");

  //Scrape EXIF data
  window.EXIF.getData(fullPic, function() {
    exifData = EXIF.getAllTags(this);

    //Upload NoSQL copy of data
    var noSqlPost = {
      _id: ipfsId,
      _attachments: {
        "thumbnail.png":
        {
          content_type: "image\/png;base64",
          data: thumbnail.src.split(",")[1]
        }
      },
      owner: ownerAddr,
      coords: {
        lat: processCoordArr(exifData.GPSLatitudeRef,exifData.GPSLatitude),
        lng: processCoordArr(exifData.GPSLongitudeRef,exifData.GPSLongitude)
      },
      cdate: exifData.DateTimeOriginal,
      desc: description,
      tags: tagstr.split(","),
      avail: true
    }

    console.log(exifData);
    console.log(noSqlPost);

    validateNoSql(noSqlPost);
  });
}

function processCoordArr(coordRef, coordArr) {
  if (coordArr == undefined) {
    alert("Image coordinates are undefined.");
    throw new Error("Image coordinates are undefined.");
  }
  else {
    var coord = coordArr[0] + (((coordArr[1]/60) + (coordArr[2]/3600)));
    if (coordRef === "N") {
      return coord;
    }
    else if (coordRef === "S") {
      return coord*= -1;
    }
    else if (coordRef === "E") {
      return coord;
    }
    else if (coordRef === "W") {
      return coord*= -1;
    }
    else {
      alert("Unknown coordinate: " + coordRef + " " + coordArr);
      return false;
    }
  }
}

function validateNoSql(noSqlJson) {
  if (typeof noSqlJson.coords.lat === "undefined") {
    var errorMsg = "Cannot upload this image; Latitude is undefined!";
    alert(errorMsg);
    throw errorMsg;
  }
  else if (typeof noSqlJson.coords.lng === "undefined") {
    var errorMsg = "Cannot upload this image; Longitude is undefined!";
    alert(errorMsg);
    throw errorMsg;
  }
  else if (typeof noSqlJson.cdate === "undefined") {
    var errorMsg = "Cannot upload this image; Original Creation Date is undefined!";
    alert(errorMsg);
    throw errorMsg;
  }

  uploadIPFS(fullPic, function() {
    noSqlJson._id = ipfsId;
    postNoSql(noSqlJson, noSqlDb, showSuccess);
  });
}

function uploadIPFS(file, callback) {
  /*
  var ipfs = window.IpfsApi({host: 'localhost', port: '5001', procotol: 'http'});
  //var swarmPromise = ipfs.swarm.peers();
  //console.log(swarmPromise);

  var reader = new FileReader();

  reader.readAsDataURL(file);
  var addPromise = ipfs.add(reader);
  console.log(addPromise);

  return ipfsId;
  */
  /*
  var data = "QmPmNX2ynvKCFFGNm1hciAnPFm1VvL9yZM2YX11U3UEz65";
  $.post("http://" + host + ":5001/api/v0/add", file, function(response) {
  data = response;
  console.log(data);
  }).error(function(){
  alert("Sorry could not upload file to IPFS.");
  });
  */
  var reader = new FileReader();

  if (reader != null) {
    reader.onload = function() {
      var md5 = CryptoJS.MD5(reader.result);
      var ipfsFakeId = "" + md5.words[0] + md5.words[1] + md5.words[2] + md5.words[3]
      var ipfsPost = {
        _id: ipfsFakeId,
        _attachments: {
          "image":
          {
            content_type: file.type,
            data: reader.result.split(",")[1]
          }
        }
      }

      postNoSql(ipfsPost, "ipfs", function() {
        ipfsId = ipfsFakeId;
        callback();
      });
    };
    reader.readAsDataURL(file);
  }
}

function postNoSql(noSqlJson, db, callback) {
  $.couch.urlPrefix = "http://" + host + ":5984";
  $.couch.db(db).saveDoc(noSqlJson, {
    success: function(data) {
      console.log(data);
      callback(data);
    },
    error: function(status) {
      console.log(status);
      alert("There was an issue with the NoSQL database.");
    }
  });
}

function showSuccess(data) {
  $("body").load("success.html");
}

function thumb(file) {
  if (file == null || file == undefined) {
    alert("This Browser has no support for HTML5 FileReader yet!");
    return false;
  }
  var imageType = /image.*/;

  if (!file.type.match(imageType)) {
    alert("We only support image uploads at this time!");
    return false;
  }

  var reader = new FileReader();

  if (reader != null) {
    reader.onload = GenThumbnail;
    reader.readAsDataURL(file);
  }
}

function GenThumbnail(e) {
  var myCan = document.createElement('canvas');
  var img = new Image();
  img.src = e.target.result;
  img.onload = function () {
    myCan.id = "myThumbCanvas";

    //Figure out actual dimensions without smushing the image.
    if (img.height > img.width) {
      myCan.height = Number(thumby);
      myCan.width = Number(img.width/(img.height/thumby));
    }
    else if (img.width > img.height) {
      myCan.width = Number(thumbx);
      myCan.height = Number(img.height/(img.width/thumbx));
    }
    else {
      myCan.width = Number(thumbx);
      myCan.height = Number(thumby);
    }

    if (myCan.getContext) {
      var cntxt = myCan.getContext("2d");
      cntxt.drawImage(img, 0, 0, myCan.width, myCan.height);
      var dataURL = myCan.toDataURL();

      if (dataURL != null && dataURL != undefined) {
        var tnImg = document.createElement('img');
        tnImg.src = dataURL;
        tnImg.id = "thumbnail";
        thumbDiv = document.getElementById("thumbDiv");
        thumbDiv.innerHTML = '';
        thumbDiv.appendChild(document.createElement("br"));
        label = document.createElement("label")
        label.appendChild(document.createTextNode("Thumbnail Preview:"));
        thumbDiv.appendChild(label);
        thumbDiv.appendChild(document.createElement("br"));
        thumbDiv.appendChild(tnImg);
      }
      else
      alert('unable to get context');
    }
  }
}

function handleVideo(stream) {
  var video = document.getElementById("videoElement");
  video.src = window.URL.createObjectURL(stream);
}

function videoError(e) {
  alert("Browser does not support camera capture. Use the file upload instead.");
}

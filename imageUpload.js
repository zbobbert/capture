var noSqlDb = "capture";
var thumbx = 200;
var thumby = 200;

function upload() {
  var fullPic = document.getElementById("fullPic").files[0];
  //Upload full image to IPFS encrypted
  var ipfsId = uploadIPFS(fullPic);

  var ownerAddr = document.getElementById("oAddr").value;
  var description = document.getElementById("desc").value;
  var tagstr = document.getElementById("tags").value;
  var thumbnail = document.getElementById("thumbnail");

console.log(thumbnail);

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
      coord: {
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
  var coord = coordArr[0] + (((coordArr[1]/60) + (coordArr[2]/3600))/100);
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

function validateNoSql(noSqlJson) {
  if (typeof noSqlJson.coord.lat === "undefined") {
    var errorMsg = "Cannot upload this image; Latitude is undefined!";
    alert(errorMsg);
    throw errorMsg;
  }
  else if (typeof noSqlJson.coord.lng === "undefined") {
    var errorMsg = "Cannot upload this image; Longitude is undefined!";
    alert(errorMsg);
    throw errorMsg;
  }
  else if (typeof noSqlJson.cdate === "undefined") {
    var errorMsg = "Cannot upload this image; Original Creation Date is undefined!";
    alert(errorMsg);
    throw errorMsg;
  }

  postNoSql(noSqlJson);
}

function uploadIPFS(file) {
  var ipfs = window.IpfsApi({host: 'localhost', port: '5001', procotol: 'http'});
  var swarmPromise = ipfs.swarm.peers();
  console.log(swarmPromise);

  return "QmPmNX2ynvKCFFGNm1hciAnPFm1VvL9yZM2YX11U3UEz65";
}

function postNoSql(noSqlJson) {
  $.couch.urlPrefix = "http://localhost:5984";
  $.couch.db(noSqlDb).saveDoc(noSqlJson, {
    success: function(data) {
      console.log(data);
      showSuccess(data);
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
        document.body.appendChild(document.createElement("br"));
        label = document.createElement("label")
        label.appendChild(document.createTextNode("Thumbnail Preview:"));
        document.body.appendChild(label);
        document.body.appendChild(document.createElement("br"));
        document.body.appendChild(tnImg);
      }
      else
      alert('unable to get context');
    }
  }
}

function upload() {
  var ipfs = window.IpfsApi({host: 'localhost', port: '5001', procotol: 'http'});
  var swarmPromise = ipfs.swarm.peers();
  console.log(swarmPromise);

  var fullPic = document.getElementById("fullPic").files[0];
  //Upload full image to IPFS encrypted
  var ipfsId = "QmPmNX2ynvKCFFGNm1hciAnPFm1VvL9yZM2YX11U3UEz65";

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
        thumbnail:
        {
          content_type: "image\/png;base64",
          data: thumbnail.src.split(",")[1]
        }
      },
      owner: ownerAddr,
      lat: exifData.GPSLatitude,
      lon: exifData.GPSLongitude,
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

function validateNoSql(noSqlJson) {
  if (typeof noSqlJson.lat === "undefined") {
    var errorMsg = "Cannot upload this image; Latitude is undefined!";
    alert(errorMsg);
    throw errorMsg;
  }
  else if (typeof noSqlJson.lon === "undefined") {
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

function postNoSql(noSqlJson) {
  $.couch.urlPrefix = "http://localhost:5984";
  $.couch.db("picfish").saveDoc(noSqlJson, {
    success: function(data) {
      console.log(data);
    },
    error: function(status) {
      console.log(status);
      alert("There was an issue with the NoSQL database.");
    }
  });
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

    myCan.width = Number(100);
    myCan.height = Number(100);
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

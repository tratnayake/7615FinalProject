var express = require('express');
var router = express.Router();
var stego = require('../stego.js')
var multer  = require('multer')
var upload = multer({ dest: './uploads/' })
var fs = require('fs')
var mime = require('mime')
var uuid = require('node-uuid');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("Cookies: ", req.cookies)
  //Check if the person has a cookie.
  if(typeof(req.cookies.UUID) == "undefined"){
      //If they don't,
      console.log("This user does not have a cookie")
      //generate a UUID
      var UUID = uuid.v4();
      console.log("This persons UUID will be " + UUID);
      req.cookies.UUID = UUID
      console.log(req.cookies)
    
    //Send that shit back.
  }else{
     console.log("User has a cookie: " + req.cookies) 
  }  console.log("User's UUID is " + req.cookies.UUID);
   
  res.render('index', { title: 'Stego-Yes-Graphy' });

});



//Handle the initial post with embed file size and encryption key
router.post('/stego/initial', function(req,res,next){
 console.log("POST received with body");
 console.log(req.body)
 //res.minSize = stego.calculateMinSize("text",req.body.embedSize)
 res.minSize = stego.calculateMinSize("text",req.body.embedSize)
 
 
 console.log("MIN SIZE IS " + res.minSize)
 next();
},
function(req,res){
    console.log("HERE!")
 var response = JSON.stringify({coverImageSizeReq: res.minSize});
 console.log ("Response is " + response);
 res.send(response);
}
)

//Handle the initial post with embed file size and encryption key
router.post('/stego/text/uploadCover', upload.single('avatar'), 
function (req, res, next) {
  //Get the new filename (the randomfile name that node assigns and saves under
  //uploads directory)
  req.newFileName = req.file.filename;
  //--Save that with the originale extension
  //Get the file path (e.g. ./uploads/43498529358234235)
  var filePath = req.file.path
  //Find out what the extension is by looking at the mimetype
  //e.g. mimetype:  text/gif  == gif
  req.fileExtension = mime.extension(req.file.mimetype)
  //Where we want the file with extension to be written to.
  req.writeFilePath = filePath+"."+req.fileExtension;
  //Read that binary file (grab the contents)
   //console.log("File path is " + filePath);
   var data = fs.readFileSync(filePath)
   //console.log("Read file data is " + data)
   fs.writeFileSync(req.writeFilePath, data)
      //Since we successfully wrote the file, lets
      //delete the existing binary file because it's of no use
      //to use anymore:
      fs.unlinkSync(filePath);
      //console.log("File deleted")
      next();
},
function(req,res,next){
    stego.stego(req,res)
})
  


//Handle downloads
router.get('/downloads/*',function(req,res){
    res.download('./downloads/test.bmp');
})


router.get('/stego/decrypt',function(req,res){
    var object= new Object();
    //Add object properties here
    // e.g. object.BLA = ..
    res.send(JSON.stringify({object}))
})

//Testing route
router.post('/stego/testInitial',
    function(req, res, next) {
      console.log('Request URL:', req.originalUrl);
      next();
    }, 
    function(req,res,next){
        //Do the stego here.
        var minSize = stego.calculateMinSize("text",500)
        console.log("Min Size is " + minSize)
        res.minSize = minSize;
        next();
    },
    function (req, res, next) {
      //console.log('Request Type:', req.method);
      console.log(req.body.embedImageSize)
      res.send(JSON.stringify({test:"test", minSize: res.minSize    })
    )
});

    





module.exports = router;

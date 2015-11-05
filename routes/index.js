var express = require('express');
var router = express.Router();
var stego = require('../stego.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Stego-Yes-Graphy' });
});

//Handle the initial post with embed file size and encryption key
router.post('/stego/initial', function(req,res){
 console.log("POST received");
 console.log(req.body);
 var coverImageSizeReq = stego.calculateMinSize(req.body.embedSize)
 var response = JSON.stringify({coverImageSizeReq: coverImageSizeReq})
 console.log ("Response is " + response)
 res.send(response);
})


module.exports = router;

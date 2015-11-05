

//Dependancies
var path = require('path');
var fs = require('fs')
var BitArray = require('node-bitarray')

function stegoText(coverImage,embedText){
    
    //1. Check that the embedded file exists
    if (fs.existsSync(coverImage)){
	    //2 Get the embed file type
        var coverImageType = path.extname(coverImage);
        console.log("Embed Image is " + coverImageType);
        
       //3. Break the file down into binary
        var data = fs.readFileSync(coverImage);
       //console.log("Data is " + data);
        var bits = BitArray.fromBuffer(data);
        console.log(bits)
        var bitArray = bits.join("");
        console.log(bitArray);
       
	}
    
    
}


//helper functions
function fileToBinary(filePath){
    var data = fs.readFileSync(filePath)
    var bits = BitArray.fromBuffer(data);
    var bitArray = bits.join("");
    console.log(bitArray);
}

stegoText("embedImages/coverImage.bmp", "testing testing testing");


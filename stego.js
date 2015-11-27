////////////////////////////////////////////////////////////////////////////////
// Authors: Thilina Ratnayake & Justin Tom
// Course: COMP 7615 - BCIT 2015
// Purpose: Stego.js handles all the stegonography elements of the "Stego- \
// yes-graphy" web application
////////////////////////////////////////////////////////////////////////////////


//Dependancies
var zfill = require('zfill')
var path = require('path');
var fs = require('fs')
var Jimp = require('jimp')
var ayb = require('all-your-base')
var crypto = require('crypto')
var algorithm = 'aes-256-ctr'
    //Calculates the minimum size required of cover image to fit this file into 
    //image. Assumed to be using file format with 3 color channels 
    // (No ALPHA)
    
//Calculates the minimum size required for a given text string    
module.exports.calculateMinSize = function(type, embedSize) {
    //   if(type == "text"){
    //The cover file has to be big enough to handle the data + the header
    var headerLength = this.calculateHeaderLength("text", embedSize);
    var minimumReq = (embedSize + headerLength) / 3;
    return minimumReq;
    //}

}

//Calculates the header length.
module.exports.calculateHeaderLength = function(type, embedSize) {
    if (type == "text") {
        return stringToBinary("text" + "\n" + embedSize).length;
    }
}

//The main stego task runner. 
module.exports.stego = function(req, res) {
    var object = new Object();
    object.req = req;
    object.res = res;
    this.stegoText(object)
        .then(stegoImage)
        .then(sendResponseStego)

}

//The actual stegonography takes place here.
// Order is:
//1. Encryption
//2. Crafting the header
//3. Converting the message to binary
//4. then stegoImage (which does the image manipulation)
module.exports.stegoText = function(object) {
    console.log("Inside stegoText");
    //coverImage
    var coverImage = object.req.writeFilePath;
    //embedText
    var embedText = object.req.body.msg
    
    
    //ENCRYPTION HERE
    var password = object.req.body.encryptionKey;
    var embedText = encrypt(embedText,password);
    
        //outputFileName
    var outputFileName = object.req.newFileName + "." + object.req.fileExtension,
        res
    //console.log("Cover image path is " + coverImage);
    //console.log("output File Name path is " + outputFileName)
    return new Promise(function(resolve, reject) {
        //1. Check that the embedded file exists
        if (fs.existsSync(coverImage)) {
            //2 Get the embed file type
            var coverImageType = path.extname(coverImage);
            //console.log("Embed Image is " + coverImageType);
            //3 Craft the header
            var textObject = new Object({
                text: embedText,
                size: embedText.length
            });
            //Craft the header
            var header = craftHeader("text", textObject);
            // console.log(header);
            //Convert the string to binary
            var text = stringToBinary(textObject.text + "\n")
                //console.log(text)
            //Concatenate the header + string
            var embedData = header + text
                //console.log(embedData);
            //Convert the string into an array of bits
            var array = embedData.split("")
            //Take the cover image and split
            //console.log("Embed Data "  + embedData)
            object.coverImage = coverImage;
            object.embedText = embedText;
            object.outputFileName = outputFileName;
            object.embedData = embedData;
            
            //Send a response
            //object.res.write(JSON.stringify({loadingMessage: "StegoText done!"}))
            // console.log("Object ready, resolving")
            resolve(object);
        }
    })
}


//Image manipulation portion of stegonography.
//Cont'd
//5.For every bit in the data that needs to be embed, changes the LSB of every
//pixel
function stegoImage(object) {
    console.log("Inside stegoImage")
    return new Promise(function(resolve, reject) {
        // console.log("Inside stego image");
        // console.log(object);
        var coverImage = object.coverImage;
        var embedData = object.embedData;
        var outputFileName = object.outputFileName;

        // console.log("\n\n\nThe cover image path is : " + coverImage);
        fs.exists(coverImage, function(data) {
            if (data) {
                var image = new Jimp("" + coverImage, function(err, image) {
                    if (err)
                        // console.log("ERROR in JIMP: " + err)
                    // console.log("INSIDE IMAGE" + coverImage)
                    // console.log(fs.existsSync("./" + coverImage))
                    // console.log(image)

                    var counter
                    counter = 0;
                    // this is the image 
                    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
                            // x, y is the position of this pixel on the image 
                            // idx is the position start position of this rgba tuple in the bitmap Buffer 
                            // this is the image 
                            if (counter < embedData.length) {
                                 //console.log("Pixel X: " + x + " Y: " + y +" counter: " + counter)
                                this.bitmap.data[idx] = (flipBit(this.bitmap.data[idx], embedData, counter))
                                    // console.log("Converted" + parseInt(this.bitmap.data[idx],2))
                                counter++
                            }
                            //Flip the bit for green
                            if (counter < embedData.length) {
                                //  console.log("Pixel X: " + x + " Y: " + y +" counter: " + counter)
                                this.bitmap.data[idx + 1] = flipBit(this.bitmap.data[idx + 1], embedData, counter)
                                    //  console.log("Converted" + parseInt(this.bitmap.data[idx+1],2))
                                counter++
                            }
                            //Flip the bit for blue
                            if (counter < embedData.length) {
                                //  console.log("Pixel X: " + x + " Y: " + y +" counter: " + counter)
                                this.bitmap.data[idx + 2] = flipBit(this.bitmap.data[idx + 2], embedData, counter)
                                counter++
                            }
                        })
                        //Debug:
                    //console.log(embedData.length + " bits to flip")
                    //console.log(counter + " bits flipped")
                        //Write image out
                    image.write("./public/downloads/" + outputFileName);
                    //console.log("\n IMAGE WRITTEn, NOW TO SEND THE RESPONSE BACk")
                    object.outputFileName = "/downloads/" + outputFileName
                    resolve(object);
                })
            }
        })

    })

}


//Crafts the response that should be sent back to the client for stego
function sendResponseStego(object) {
    var response = new Object();
    response.message = "Steganography done!"
    response.stegodImage = object.outputFileName
    console.log("Response to send back to the client" + JSON.stringify(response));
    object.res.send(JSON.stringify(response));
}

//Crafts the response that should be sent back to the client for destego
function sendResponseDestego(object){
    var response = new Object();
    response.message = "DeSteganography done!"
    response.plaintext = object.req.data
    console.log("Response to send back to the client" + JSON.stringify(response));
    object.res.send(JSON.stringify(response));
}


//The main destegongraphy task runner
module.exports.destego = function(req,res){
     var object = new Object();
     object.req = req;
     object.res = res;
     console.log("Inside destego, object created!");
     imageToBits(object)
    .then(grabHeader)
    .then(grabData)
    .then(sendResponseDestego)
}

// -----------------------------------ENCRYPTION DECRYPTION FUNCTIONS
//Encryption using AES
function encrypt(text,password){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
//Encryption using AES
function decrypt(text,password){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

// -----------------------------------HELPER FUNCTIONS ----------------------//

//Conversion from string to binary
function stringToBinary(string) {
    var data = new Buffer(string);

    //Create an array to hold all the bits
    var bitArray = new Array();
    //For each byte in the buffer, convert to bits.
    for (var i = 0; i < data.length; i++) {
        //console.log(data[i]);
        bitArray.push((data[i] >>> 0).toString(2));
    };

    var finalArray = new Array();
    //For each value that is just 0 ( or less than 8 bits), pad with 0s
    for (var i = 0; i < bitArray.length; i++) {
        if (bitArray[i].length < 8) {
            finalArray.push(zfill(bitArray[i], 8))
        }
    };

    //console.log(bitArray)
    //fs.writeFileSync("array.txt",bitArray);
    var bits = finalArray.join("")
    return bits;

}

//Convert a whole file to binary
function fileToBinary(filePath) {
    //Read the file into a buffer
    var data = fs.readFileSync(filePath);
    //Create an array to hold all the bits
    var bitArray = new Array();
    //For each byte in the buffer, convert to bits.
    for (var i = 0; i < data.length; i++) {
        //console.log(data[i]);
        bitArray.push((data[i] >>> 0).toString(2));
    };

    var finalArray = new Array();
    //For each value that is just 0 ( or less than 8 bits), pad with 0s
    for (var i = 0; i < bitArray.length; i++) {
        if (bitArray[i].length < 8) {
            finalArray.push(zfill(bitArray[i], 8))
        }
    };

    //console.log(bitArray)
    //fs.writeFileSync("array.txt",bitArray);
    var bits = finalArray.join("")
    return bits;
}



//Craft the header
function craftHeader(type, object) {
    switch (type) {
        case "text":
            console.log("Crafting a header for a text object");
            var header = stringToBinary("text" + "\n" + object["size"] + "\n");
            return header;
    }
}

//For a given pixel colour value, flip the LSB
function flipBit(colour, embedData, counter) {
    //Convert the current red value to binary
    var currentValue = ayb.decToBin(colour)
    if (currentValue.length < 8) {
        currentValue = zfill(currentValue, 8)
    }
    // console.log("Preflip: " + currentValue)
    // console.log("Last bit: " + currentValue[7])
    // console.log("Switch with: " + embedData[counter])
    //Flip the last bit to be the array element
    var newValue = currentValue.slice(0, 7) + embedData[counter]
        // console.log("Postflip: " + newValue)
        //Conver to an int
    var intValue = parseInt(newValue, 2)
        // console.log("Converted to an INT " + intValue)
    return intValue

}


//Convert image to bits
function imageToBits(object) {
    var coverImagePath = object.req.writeFilePath;
    return new Promise(function(resolve, reject) {
        var bitArray = new Array();
        //Go through each pixels
        var image = new Jimp(coverImagePath, function(err, image) {
            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
                var red = zfill(ayb.decToBin(this.bitmap.data[idx]), 8);
                //console.log(red)
                bitArray.push(red[7]);
                var green = zfill(ayb.decToBin(this.bitmap.data[idx + 1]), 8);
                //console.log(green)
                bitArray.push(green[7]);
                var blue = zfill(ayb.decToBin(this.bitmap.data[idx + 2]), 8);
                //console.log(blue)
                bitArray.push(blue[7]);
            })
            object.req.binaryString = bitArray.join("");
            resolve(object)

        })
    })
}


//When decrypting, grab the header
function grabHeader(object) {
    var binaryString = object.req.binaryString;
    return new Promise(function(resolve, reject) {
        console.log("BinaryString " + binaryString.slice(0, 100))
        var resultsArray = new Array()
        var valueArray = binaryString.match(/.{1,8}/g);
        for (var i = 0; i < 300; i++) {
            resultsArray.push(String.fromCharCode(parseInt(valueArray[i], 2)))

        }

        var rawData = resultsArray.join("");
        rawData = rawData.split("\n")
        console.log(rawData);
        var returnObj = new Object({
            type: rawData[0],
            length: rawData[1],
            text: rawData[2]
        })
        
        object.req.returnObj = returnObj;
        resolve(object)


    })
}

//When decrypting grab the data
function grabData(object) {
    var returnObj = object.req.returnObj;
    return new Promise(function(resolve,reject){
        if (returnObj.type == "text") {
        console.log("Data is: " + returnObj.text)
        //DECRYPT HERE
        object.req.data = decrypt(returnObj.text,object.req.body.decryptionKey)
        //object.req.data =returnObj.text;
        resolve(object)
        }
    })
}

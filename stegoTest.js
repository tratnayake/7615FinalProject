

//Dependancies
var path = require('path');
var fs = require('fs')
var zfill = require('zfill')
var Jimp = require('jimp')
var ayb = require('all-your-base')


module.exports.stegoText = function(coverImage,embedText){
    
    //1. Check that the embedded file exists
    if (fs.existsSync(coverImage)){
	    //2 Get the embed file type
        var coverImageType = path.extname(coverImage);
        console.log("Embed Image is " + coverImageType);
        
       //3 Craft the header
        console.log("The length of text is " + embedText.length) 
        
        //since it's text create a custom object
        var textObject = new Object({text: embedText, size: embedText.length});
        
        //Craft the header
        var header = craftHeader("text",textObject);
        console.log(header);
        
        //Convert the string to binary
        var text = stringToBinary(textObject.text + "\n")
        console.log(text)
        
        //Concatenate the header + string
        var embedData = header + text
        console.log(embedData);
        
        //Convert the string into an array of bits
        var array = embedData.split("")
        
        //Take the cover image and split
        console.log("Embed Data "  + embedData)
        stegoImage(coverImage,embedData)
    }
}



//helper functions
function fileToBinary(filePath){
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
        if(bitArray[i].length < 8){
           finalArray.push(zfill(bitArray[i],8))
        }
    };

    //console.log(bitArray)
    //fs.writeFileSync("array.txt",bitArray);
    var bits = finalArray.join("")
    return bits;
}

function stringToBinary(string){
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
        if(bitArray[i].length < 8){
           finalArray.push(zfill(bitArray[i],8))
        }
    };

    //console.log(bitArray)
    //fs.writeFileSync("array.txt",bitArray);
    var bits = finalArray.join("")
    return bits;
    
}

function craftHeader(type,object){
    switch(type){
        case "text":
            console.log("Crafting a header for a text object");
            var header = stringToBinary("text"+"\n"+object["size"]+"\n");
            return header;
    }
}

function flipBit(colour,embedData,counter){
    //Convert the current red value to binary
    var currentValue = ayb.decToBin(colour)
    if(currentValue.length < 8){
       currentValue = zfill(currentValue,8) 
    }
    // console.log("Preflip: " + currentValue)
    // console.log("Last bit: " + currentValue[7])
    // console.log("Switch with: " + embedData[counter])
    //Flip the last bit to be the array element
    var newValue = currentValue.slice(0,7) + embedData[counter]
    // console.log("Postflip: " + newValue)
    //Conver to an int
    var intValue = parseInt(newValue,2)
    // console.log("Converted to an INT " + intValue)
    return intValue
    
}

function stegoImage(coverImagePath,embedData){
    var image = new Jimp(coverImagePath, function (err, image) {
            
            var counter
			counter = 0;
		    // this is the image 
		    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
		        // x, y is the position of this pixel on the image 
		        // idx is the position start position of this rgba tuple in the bitmap Buffer 
		        // this is the image 
		     
		        //The first two pixels are the header pixels
		        
		      //  //If there's an element in the array to add to the last digit
		      //  //add it
		      //  //Flip the bit for red
		      //  if(x < 2 && y ==  0){
		      //      if(x == 0){
		      //          //The First pixel will be the format
		      //             //If the RED value's LSB is a 1, then it is a text file
		      //             //this.bitmap.data[idx] = this.bitmap.data[idx].
		      //      }
		      //      else{
		                
		      //      }
		      //  }
		      //  else{
		            if(counter < embedData.length){
		          //  console.log("Pixel X: " + x + " Y: " + y +" counter: " + counter)
	                this.bitmap.data[idx] = (flipBit(this.bitmap.data[idx],embedData,counter)) 
	               // console.log("Converted" + parseInt(this.bitmap.data[idx],2))
		            counter++
    		        } 
    		       //Flip the bit for green
    		        if(counter < embedData.length){
    		          //  console.log("Pixel X: " + x + " Y: " + y +" counter: " + counter)
    	                this.bitmap.data[idx+1] = flipBit(this.bitmap.data[idx+1],embedData,counter)
    		          //  console.log("Converted" + parseInt(this.bitmap.data[idx+1],2))
    		            counter++
    		        }
    		        //Flip the bit for blue
    		        if(counter < embedData.length){
    		          //  console.log("Pixel X: " + x + " Y: " + y +" counter: " + counter)
    	                this.bitmap.data[idx+2] = flipBit(this.bitmap.data[idx+2],embedData,counter)
    		            counter++
    		        } 
		        //}
		        
		       
		    })
		    //Debug:
		    console.log(embedData.length + " bits to flip")
		    console.log(counter + " bits flipped")
		    //Write image out
		    image.write("./stegodImages/test.bmp")
       
    })
}

module.exports = function(coverImagePath){
     imageToBits(coverImagePath)
    .then(grabHeader)
    .then(grabData)
}

function grabHeader(binaryString){
    return new Promise(function(resolve,reject){
        console.log("BinaryString " + binaryString.slice(0,100))
        var resultsArray = new Array()
        var valueArray = binaryString.match(/.{1,8}/g);
        for (var i = 0; i < 300; i++) {
            resultsArray.push(String.fromCharCode(parseInt(valueArray[i],2)))
            
        }
        
        var rawData = resultsArray.join("");
        rawData = rawData.split("\n")
        console.log(rawData);
        var returnObj = new Object({type: rawData[0],length: rawData[1], text:rawData[2]})
        resolve(returnObj)
    
       
    })
}

function grabData(returnObj){
    if(returnObj.type == "text"){
        console.log("Data is: " + returnObj.text)
        return returnObj.text
    }
}

function imageToBits(coverImagePath){
    return new Promise(function(resolve,reject){
        var bitArray = new Array();
        //Go through each pixels
        var image = new Jimp(coverImagePath, function (err, image) {
             image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                var red = zfill(ayb.decToBin(this.bitmap.data[idx]),8);
                //console.log(red)
                bitArray.push(red[7]);
                var green = zfill(ayb.decToBin(this.bitmap.data[idx + 1]),8); 
                //console.log(green)
                bitArray.push(green[7]);
                var blue = zfill(ayb.decToBin(this.bitmap.data[idx + 2]),8);
                //console.log(blue)
                bitArray.push(blue[7]);
             })
            resolve(bitArray.join(""))
         
        })
    })
}
//stegoText("embedImages/coverImage.bmp", "testing testing testing");
this.destegoImage("./stegodImages/test.bmp");



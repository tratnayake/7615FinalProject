
//Calculates the minimum size required of cover image to fit this file into 
//image. Assumed to be using file format with 3 color channels 
// (No ALPHA)
module.exports.calculateMinSize = function(embedFileSize){
   var minimumReq = embedFileSize / 3;
   return minimumReq;
}
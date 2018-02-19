/*
 * Shipt Interview | Battleship Game
 *
 * extract.js
 *
 * created: 4 February 2018
 * author: Kevin Boyd
 *
 * This file contains the server logic for handling routing.
 *
 */

var path = require('path');

var extractFilePath = function(url) {
  var filePath;
  var fileName = 'index.html';

  if (url.length > 1) {
    fileName = url.substring(1);
  }
  console.log('The fileName is: ' + fileName);

  filePath = path.resolve(__dirname, 'app', fileName);
  return filePath;
}

module.exports = extractFilePath;

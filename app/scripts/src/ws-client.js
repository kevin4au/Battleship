/*
 * Shipt Interview | Battleship Game
 *
 * ws-client.js
 *
 * created: 4 February 2018
 * author: Kevin Boyd
 *
 * This file contains the logic for client side websocket interface.
 *
 */

let socket;
let host = location.origin.replace(/^http/, 'ws');

//initialize the socket.  make sure this is opened before first message is received
function init() {
   //socket = new WebSocket('ws://localhost:3001');
   socket = new WebSocket(host);
   console.log('connecting...');
}

//sets what to do when the socket opens.  This is no longer in use
function registerOpenHandler(handlerFunction) {
  socket.onopen = () => {
    console.log('open');
    handlerFunction();
  };
}

//allows a callback function to be called when we recieve a message
function registerMessageHandler(handlerFunction) {
  socket.onmessage = (e) => {
    //console.log('message', e.data);
    let data = JSON.parse(e.data);
    handlerFunction(data);
  };
}

//formats and sends a message to the server
function sendMessage(payload) {
  socket.send(JSON.stringify(payload));
}

export default {
  init,
  registerOpenHandler,
  registerMessageHandler,
  sendMessage
}

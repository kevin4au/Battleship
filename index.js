/*
 * Shipt Interview | Battleship Game
 *
 * index.js
 *
 * created: 4 February 2018
 * author: Kevin Boyd
 *
 * This file contains the logic for serving files and handling the websockets.
 *
 */

var http = require('http');
var fs = require('fs');
var extract = require('./extract');
//var wss = require('./websockets-server');
var PORT = process.env.PORT || 3000;

const WebSocket = require('ws');

const express = require('express');

var handleError = function(err, res) {
  res.writeHead(404);
  res.end();
}

//This assigns a unique ID to each client upon connection
var clientId = 0;

//This will store the unique ID of each client along with their current game room
let myClients = [];

//This will define a server in two parts: One to serve the file system and one to serve the web sockets
const server = express()
  .use(function(req, res) {
    console.log('Responding to a request.');

    var filePath = extract(req.url);
    fs.readFile(filePath, function(err, data) {
      if (err) {
        handleError(err, res);
        return;
      } else {
        res.end(data);
      }
    });

  }).
listen(PORT, () => console.log(`Listening on ${ PORT }`));


//create the websocket server
const wss = new WebSocket.Server({
  server
});

console.log('websockets server started');

//upon client connection
wss.on('connection', ws => {
  ws.room = [];
  clientId++;

  console.log('connected');
  console.log('Room Counts: ', getRoomCounts());

  //notify clients that a new user has joined and the updated room counts
  ws.send(JSON.stringify({
    msg: "user joined",
    roomCounts: getRoomCounts()
  }));

  //upon a new message on the conection
  ws.on('message', message => {
    console.log('message: ', message);

    //Parse the JSON formatted message
    var mes = JSON.parse(message);

    //if we received a message to join a room, update client and myClients
    if (mes.join) {
      ws.room.push(mes.join);

      myClients.push(JSON.stringify({
        client: {
          name: clientId,
          room: ws.room[0]
        }
      }));

      console.log("Pushed a new client to myClients...")
      console.log(JSON.stringify({
        client: {
          name: clientId,
          room: ws.room[0]
        }
      }));
    }

    //once a client is in a gameRoom, broadcast their message to only the other clients of that room
    if (mes.gameRoomID) {
      broadcastToGameRoom(message);
    }

    //if the message is requesting roomCounts, generate them and send
    if (mes.refreshRoomCounts) {
      console.log("Refreshing room counts...");
      ws.send(JSON.stringify({
        roomCounts: getRoomCounts()
      }));
      console.log(JSON.stringify({
        roomCounts: getRoomCounts()
      }));
    }

    //Uncomment if wanting to debug or listen to a particular part of a message
    // if (mes.messageType) {
    //   console.log('message: ', mes.messageType)
    // }
  })

  //if a client disconnects, notify their opponent that they have disconnected, then evict all players from the game room
  ws.on('error', function(e) {
    try {

      //Keep an eye on this function.  Its possible that it may unnecessarily evict clients.  Probably a good candidate for unit testing.
      console.log(e);

      if (myClients.length > 0) {
        var client = getClient(clientId);
        console.log("client exited: ", client);
        broadcastToGameRoom(JSON.stringify({
          messageType: "Exit",
          gameRoomID: client.client.room
        }));
        evictAllFromRoom(clientId);
      }

    } catch (ex) {
      console.log(ex);
      console.log(myClients);
    }
  });

  ws.on('close', (e) => console.log('websocket closed' + e));
});


//Find each player in a specific game room, and broadcast to them
function broadcastToGameRoom(message) {
  console.log("Broadcasting...")

  wss.clients.forEach(client => {
    if (client.room.indexOf(JSON.parse(message).gameRoomID) > -1) {
      if (client.readyState === client.OPEN) {
        client.send(message);
        console.log("Broadcast message sent: ", message)
      }
    }

  });
}

//Find a client from myClients array and return it
function getClient(myClient) {

  let clientToReturn;

  myClients.forEach(client => {

    let refClient = JSON.parse(client);

    if (refClient.client.name == myClient) {
      console.log(refClient);
      clientToReturn = refClient;
    }

  });

  return clientToReturn;
}

//Find a client from myClients array and remove it
function removeClient(myClient) {

  let index = 0;

  myClients.forEach(client => {

    let refClient = JSON.parse(client);

    if (refClient.client.name == myClient) {
      console.log(refClient);
      myClients.splice(index, 1);
    }

    index++;

  });

}

//Evict all players from room.
//This helps with synchronization if other players join a game room after someone quits
function evictAllFromRoom(myClient) {

  let leftClient = getClient(myClient);

  wss.clients.forEach(client => {
    if (client.room == leftClient.client.room) {
      client.room = [];
    }

  });
}

//Get the number of players in each game room
function getRoomCounts() {

  let roomCounts = [0, 0, 0, 0, 0]

  wss.clients.forEach(client => {
    if (client.room == 1) {
      roomCounts[0]++;
    }
    if (client.room == 2) {
      roomCounts[1]++;
    }
    if (client.room == 3) {
      roomCounts[2]++;
    }
    if (client.room == 4) {
      roomCounts[3]++;
    }
    if (client.room == 5) {
      roomCounts[4]++;
    }
  });

  return roomCounts;
}

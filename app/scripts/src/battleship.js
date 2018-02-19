/*
 * Shipt Interview | Battleship Game
 *
 * battleship.js
 *
 * created: 4 February 2018
 * author: Kevin Boyd
 *
 * This file contains the primary application logic for the Battleship game.
 *
 */


import socket from './ws-client';
import $ from 'jquery';
import view from './main';


class Game {

  //creats a new instance of game
  constructor(gameRoomID, opponentIsPresent, isTurn) {
    this.gameRoomID = gameRoomID;
    this.player = new Player(gameRoomID);
    this.opponentIsPresent = opponentIsPresent;
    this.player.isTurn = isTurn;
  }

  initGame() {

    //send a join message to let the server know which game room we are joining
    let joinMessage = new GameMessage({
      gameRoomID: this.gameRoomID,
      join: this.gameRoomID,
      sender: this.player.playerName
    });
    socket.sendMessage(joinMessage.serialize());
    console.log("Join Message: ", joinMessage);

    console.log("Game Created: ", this);

    //set a click listener for each button via jquery
    //this could potentially be refactored to work through React
    //if I passed a player and callback function through the properties
    $('button').on('click', function(event) {
      event.preventDefault();
      if (this.player.isTurn == true) {
        this.player.sendAttack();
      }
    }.bind(this));

    //go ahead and arrange the player's fleet
    console.log("Arranging Fleet");
    this.player.arrangeFleet();

    //determine if we should wait or start the game
    if (this.opponentIsPresent == false) {
      console.log("no opponent present");
      this.waitForOpponent();
    } else {
      console.log("opponent present");
      view.react.updateMessageBox("Game Started!  Opponent goes first...");
      this.setMessageHandler();
    }
  }

  //wait for an opponent
  waitForOpponent() {
    view.react.updateMessageBox("Waiting for an opponent...");
    console.log("Waiting for an opponent...");


    try {
      //wait for a message from the opponent
      socket.registerMessageHandler(function(data) {

        //parse the message and see if it's relevant
        if (data.sender == this.player.playerName) {
          return null; //this came from myself
        }
        if (data.gameRoomID != this.gameRoomID) {
          return null; // this is for a different gameroom
        }

        if (data.join = this.gameRoomID) {

          console.log("opponent has joined");

          //alert the waiting player that an opponent has arrived
          view.react.updateMessageBox("Opponent has joined!  Click a square on their board to attack.");

          //update the message handler
          this.setMessageHandler(data);
        }
      }.bind(this));

    } catch (ex) {
      console.log(ex);
    }
  }

  setMessageHandler() {

    //allow the player to start handling game messages from their opponent
    socket.registerMessageHandler((data) => {
      var messageResponse = this.player.receiveMessage(data);
    });

  }

} //End of Game Class

class Player {

  //Creates a new player object for the game
  //Most turn based game play will take place throught this class
  constructor(gameRoomID) {
    this.gameRoomID = gameRoomID;
    this.opponentStateGrid = new StateGrid();
    this.myStateGrid = new StateGrid();
    this.isTurn = true;
    this.fleet = new Fleet();
    this.playerName = (new Date()).getTime(); //Update later, but for now this will distinguish,
  }

  //Randomly place each ship in the fleet
  arrangeFleet() {
    //for every ship in the player's fleet
    this.fleet.ships.forEach(function(ship) {
      this.placeShip(ship);
      console.log(ship);
    }.bind(this)); //bind our player object to the function called for each ship
  }

  //set a specific ship.  This broken out of arrangeFleet to allow for recursion
  placeShip(ship) {
    //randomly determine a starting location for the x and y coordinates
    let randomFactor = (10 - ship.size) + 1; //disallows the ship to run off board
    let xstart = Math.floor(Math.random() * randomFactor);
    let ystart = Math.floor(Math.random() * randomFactor);

    //flip a coin to determine the orientation of the ship
    let coinToss = Math.floor((Math.random() * 100) + 1);

    let i = 0;
    while (i < ship.size) {
      //create a new location
      let aLocation = new Location();

      //define both starting locations; only one will be updated
      aLocation.xCoordinate = xstart;
      aLocation.yCoordinate = ystart;

      //use stateGrid check to see if the location is not already occupied
      if (this.myStateGrid.grid[aLocation.xCoordinate][aLocation.yCoordinate] != this.myStateGrid.bgColors.Gray) {

        //push the ship onto the occupied location stack
        ship.occupiedLocations.push(aLocation);
        aLocation.status = 'occupied';

        if ((coinToss % 2) == 0) {
          xstart++;
        } else {
          ystart++;
        }
        i++;
      } else {
        console.log("Location [" + aLocation.xCoordinate + "][" + aLocation.yCoordinate + "] occupied by another ship...")
        //if the location is already occupied by another ship...
        //clear this ship's locations
        //make a recursive call to this method to re-place the ship
        //exit the while loop
        ship.occupiedLocations = [];
        this.placeShip(ship);
        i = ship.size;
      }
    }

    //update the stateGrid to show occupied locations
    ship.occupiedLocations.forEach(function(location) {
      this.myStateGrid.updateStateGrid(location);
      view.react.updateMyStateGrid(this.myStateGrid.grid);
    }.bind(this)); //bind our player object to the function called for each location

  }

  //Allows a player to create an attack location and send it in an attack message to their opponent
  sendAttack(sendCallback) {
    let targetLocation = new Location();
    targetLocation.init($(event.target).attr('data-xcoor'), $(event.target).attr('data-ycoor'), 'N/A');
    var message = new GameMessage({
      gameRoomID: this.gameRoomID,
      sender: this.playerName,
      messageType: 'Attack',
      location: targetLocation
    });
    socket.sendMessage(message.serialize());
  }

  //When a player is passive, it will listen for messages.
  receiveMessage(data) {
    console.log("Message Received: ", data);

    //Ensure the messages are relevant...
    if (data.sender == this.playerName) {
      return null; //this came from myself
    }
    if (data.gameRoomID != this.gameRoomID) {
      return null; // this is for a different gameroom
    }

    //Handle varying message types
    switch (data.messageType) {

      case 'Attack':
        console.log('Attacked at: ', data.location);


        //If location already attacked
        if (this.myStateGrid.grid[data.location.xCoordinate][data.location.yCoordinate] != "grayCell" &&
          this.myStateGrid.grid[data.location.xCoordinate][data.location.yCoordinate] != "blueCell") {
          //Draft up a response messsage to alert opponent of the outcome of their attack
          var response = new GameMessage({
            gameRoomID: this.gameRoomID,
            sender: this.playerName,
            messageType: 'Already Attacked',
          });

          //Send the message
          socket.sendMessage(response.serialize());
          console.log('Responded to Attack.  (Already Attacked)');
          this.isTurn = true;
          view.react.updateMessageBox("Your Turn.  Choose a square on your opponent's board to attack!");
          break; //break early
        }

        //See if the passed location matched a location occupied by a ship
        let hitOrMiss = false;
        this.fleet.ships.forEach(function(ship) {
          console.log(ship.occupies(data.location));
          if (ship.occupies(data.location)) {
            data.location.status = "hit";
            hitOrMiss = true;
          }
        });

        //if the attack misses, add this attribute to the location
        //its redundant, but will come in handy for brevity when updating the state grid
        if (hitOrMiss == false) {
          data.location.status = "miss";
          hitOrMiss = false;
        }

        //Draft up a response messsage to alert opponent of the outcome of their attack
        var response = new GameMessage({
          gameRoomID: this.gameRoomID,
          sender: this.playerName,
          messageType: 'Attack Response',
          location: data.location,
          isHit: hitOrMiss,
          sunkenShips: this.fleet.getAllSunk()
        });

        //Send the message
        socket.sendMessage(response.serialize());
        console.log('Responded to Attack.');
        console.log('Sunken Ships: ', response.sunkenShips);

        //Update state grid in app logic.  Pass this state grid to the view
        this.myStateGrid.updateStateGrid(response.location);
        view.react.updateMyStateGrid(this.myStateGrid.grid);

        //If the game is over, notify the outcome, else continue...
        if (this.fleet.getAllSunk().length == 5) {
          view.react.updateMessageBox("You Lose.");
          this.isTurn = false;
          //FUTURE: Return to game lobby
        } else {
          this.isTurn = true;
          view.react.updateMessageBox("Your Turn.  Choose a square on your opponent's board to attack!");
        }

        break; //End of Attack handler

      case 'Attack Response':

        console.log('Received attack response for location: ', data.location);

        //Generate a new state grid in app logic for attack response and pass it to the view
        this.opponentStateGrid.updateStateGrid(data.location);
        view.react.updateOpponentStateGrid(this.opponentStateGrid.grid); //Pass updated stategrid

        //Update the view to show sunken ships
        view.react.updateSunkenShips(data.sunkenShips);

        //If the game is over, notify the outcome, else continue...
        if (data.sunkenShips.length == 5) {
          view.react.updateMessageBox("You Win!");
          this.isTurn = false;
          //FUTURE: Return to game lobby
        } else {
          this.isTurn = false;
          view.react.updateMessageBox("Opponent's Turn.");
        }

        break; //End of Attack Response Handler

      case 'Already Attacked':
        //Notify Player that the location has already been attacked.
        view.react.updateMessageBox("That location has already been attacked.  Opponent's Turn.");
        this.isTurn = false;
        break;

      case 'Exit':

        //If the opponent disconnects
        view.react.updateMessageBox("Opponent has exited.  This game has ended.");

        break;

      default:
        console.log('Not Attacked...');
    }
  }

} //End of Player Class



class Fleet {

  //Create and Define our five ship types
  constructor() {
    this.ships = [];
    this.ships.push(new Ship('Carrier', 5));
    this.ships.push(new Ship('Battleship', 4));
    this.ships.push(new Ship('Cruiser', 3));
    this.ships.push(new Ship('Submarine', 3));
    this.ships.push(new Ship('Destroyer', 2));
  }

  //returns all sunken ships in a players fleet
  getAllSunk() {
    let sunkenShips = [];
    for (let shipIndex = 0; shipIndex < this.ships.length; shipIndex++) {
      let thisShip = this.ships[shipIndex];
      if (thisShip.isSunk()) {
        sunkenShips.push(thisShip);
      }
    }
    return sunkenShips;
  }

}

class Ship {

  //Create and define a new ship.
  constructor(name, size) {
    this.name = name;
    this.size = size;
    this.occupiedLocations = [];
  }

  //Determines if a ship occupies a specific location.
  occupies(attackLocation) {
    let locationIndex;
    for (locationIndex = 0; locationIndex < this.occupiedLocations.length; locationIndex++) {
      let myLocation = this.occupiedLocations[locationIndex];
      if ((myLocation.xCoordinate == attackLocation.xCoordinate) && (myLocation.yCoordinate == attackLocation.yCoordinate)) {
        myLocation.status = 'hit';
        return true;
      }
    };
    return false;
  }

  //Determines if all locations the ship occupies have been hit.  This is from the perspective of the ship.
  isSunk() {
    for (let locationIndex = 0; locationIndex < this.occupiedLocations.length; locationIndex++) {
      let myLocation = this.occupiedLocations[locationIndex];
      if (myLocation.status == 'occupied') {
        return false;
      }
    };
    return true;
  }
}

class Location {

  //Creates a set of coordinates and a status for them
  constructor() {
    this.xCoordinate;
    this.yCoordinate;
    this.status = 'empty';
  }

  //If we choose, we can go ahead and assign values to all attributes
  init(xCoor, yCoor, status) {
    this.xCoordinate = xCoor;
    this.yCoordinate = yCoor;
    this.status = status;
  }
}

class StateGrid {

  //Creates a new state grid in the app logic.  Grids in the view will be set to replicate instance of this class
  constructor() {
    this.bgColors = {
      "Blue": "blueCell",
      "Red": "redCell highlight",
      "Gray": "grayCell",
      "White": "whiteCell highlight"
    };

    this.row = Array(10).fill(this.bgColors.Blue);
    for (let i = 0; i < 10; i++) {
      this.grid = Array(10).fill(this.row);
    }
  }

  updateStateGrid(location) {

    let cells = this.grid.map((arr) => {
      return arr.slice()
    });

    switch (location.status) {
      case "hit":
        cells[location.xCoordinate][location.yCoordinate] = this.bgColors.Red;
        break;
      case "miss":
        cells[location.xCoordinate][location.yCoordinate] = this.bgColors.White;
        break;
      case "occupied":
        cells[location.xCoordinate][location.yCoordinate] = this.bgColors.Gray;
        break;
      default:
        cells[0][0] = this.bgColors.Blue;
    }

    this.grid = cells.map((arr) => {
      return arr.slice()
    });

  }

}


export class GameMessage {

  //class defines all serialized messages transmitted between players
  constructor({ //includes all possible JSON objects to transmit
    gameRoomID: g,
    timestamp: t = (new Date()).getTime(), //defaults to current time stamp
    messageType: mT,
    location: l,
    player1: p1,
    player2: p2,
    sender: s,
    receiver: r,
    isHit: h,
    sunkenShips: sS,
    winner: w,
    join: j,
    refreshRoomCounts: rRC,
    exit: e
  }) {
    this.gameRoomID = g;
    this.timestamp = t;
    this.messageType = mT;
    this.location = l;
    this.player1 = p1;
    this.player2 = p2;
    this.sender = s;
    this.receiver = r;
    this.isHit = h;
    this.sunkenShips = sS;
    this.winner = w;
    this.join = j;
    this.refreshRoomCounts = rRC;
    this.exit = e;
  }
  serialize() {
    return {
      gameRoomID: this.gameRoomID,
      timestamp: this.timestamp,
      messageType: this.messageType,
      location: this.location,
      player1: this.player1,
      player2: this.player2,
      sender: this.sender,
      receiver: this.receiver,
      isHit: this.isHit,
      sunkenShips: this.sunkenShips,
      winner: this.winner,
      join: this.join,
      refreshRoomCounts: this.refreshRoomCounts,
      exit: this.exit
    };
  }
}

export default Game;

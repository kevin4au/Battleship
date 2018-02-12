import React from 'react';
import ReactDOM from 'react-dom';

//import styles
import styles from './../../stylesheets/app.css';
import Bootstrap from './../../stylesheets/bootstrap.min.css';

//import websocket interface
import socket from './ws-client';

//import required classes from application logic
import Game from './battleship';
import { GameMessage } from './battleship';

//import the Singleton class to link our view to the application logic
import view from './main';

//exported to main for initial renderCell
//this is the topmost React component in the view
export class GameWrapper extends React.Component {

  constructor(props) {
    super(props);

    //map out the varying colors for the grid cells
    this.bgColors = {
      "Blue": "blueCell",
      "Red": "redCell",
      "Gray": "grayCell",
      "White": 'whiteCell'
    };

    //initialize opponent grid to empty
    this.opponentStateRow = Array(10).fill(this.bgColors.Blue);
    for (let i = 0; i < 10; i++) {
      this.opponentStateGrid = Array(10).fill(this.opponentStateRow);
    }

    //initialize my grid to empty
    this.myStateRow = Array(10).fill(this.bgColors.Blue);
    for (let i = 0; i < 10; i++) {
      this.myStateGrid = Array(10).fill(this.myStateRow);

    }

    //this message should be overwritten before ever being displayed
    this.message = "Game Started!";

    //this will be the initial state of the topmost component.
    //these states will primarily be passed as props to the child components.
    this.state = {
      displayWelcomeDiv: "block",
      displayBody: "none",
      opponentStateGrid: this.opponentStateGrid,
      myStateGrid: this.myStateGrid,
      messageBox: this.message,
      roomCounts: [0,0,0,0,0],
      sunkenShips: [],
    };

    //keeps the scope for when used as a callback
    this.removeWelcomeDiv = this.removeWelcomeDiv.bind(this);
  }

  //As soon as the view is created, set it equal to the singleton and freeze the singleton
  componentWillMount() {
    view.react = this;
    Object.freeze(view);
  }

  //updates the state of messagebox.  this will be passed to the messagebox component
  updateMessageBox(message) {
    this.setState({
      messageBox: message
    });
  }

  //updates the state of opponentStateGrid.  this will be passed to a grid component
  updateOpponentStateGrid(stateGrid) {
    this.setState({
      opponentStateGrid: stateGrid
    });
  }

  //updates the state of myStateGrid.  this will be passed to a grid component
  updateMyStateGrid(stateGrid) {
    this.setState({
      myStateGrid: stateGrid
    });
  }

  //updates the state of sunkenShips.  this will be used to show sunken ships in the view
  updateSunkenShips(ships) {

    let sunkenShipNames = [];
    ships.forEach((ship) => {
      sunkenShipNames.push(ship.name);
    });

    this.setState({
      sunkenShips: sunkenShipNames
    });
  }

  //updates the state of roomCounts.  this will be used to show the number of people in each room
  //it will be passed to the game button component
  updateRoomCounts(data){

      if (data.roomCounts) {
        this.setState({roomCounts: data.roomCounts.slice()});
      }

  }

  //this will remove the div showing the game lobby by setting its display property to none
  //the body component will immediately be rendered
  removeWelcomeDiv() {
    this.setState({
      displayWelcomeDiv: "none",
      displayBody: "block"
    });
  }

  //this will remove the div showing the game and bring players back to the game lobby
  //this is not currently being used, but could be handy if a return to lobby button were added to the view
  showWelcomeDiv() {
    this.setState({
      displayWelcomeDiv: "block",
      displayBody: "none"
    });
  }

  //show the topmost component and contained elements
  render() {
    return ( <div>
      <Header/>
      <WelcomeDiv removeWelcomeCallback={this.removeWelcomeDiv} roomCounts={this.state.roomCounts} style={{display: this.state.displayWelcomeDiv}}/>
      <Body style={{display: this.state.displayBody}} messageBox={this.state.messageBox} opponentStateGrid={this.state.opponentStateGrid} myStateGrid={this.state.myStateGrid} sunkenShips={this.state.sunkenShips}/>
      </div>
    );
  }
}

//this is the header for the site.  for now, it simply shows a title
class Header extends React.Component {
  constructor(props) {
    super(props);
  }

    goBackToList() {
      //FUTURE: Offer the ability to return to the game lobby without a refresh
      //a new button would be needed
    }

    //render the header
    render() {

      return ( <header >
                <nav className="navbar navbar-default" >
                  <div className="container" >
                    <div className="navbar-header" >
                      <a className="navbar-brand" >BattleShip< /a>
                    </div>
                    <div className="nav navbar-nav navbar-right">
                    </div>
                  </div>
                </nav>
              </header>);
    }
 }

//This is the component that will hold the game itself
class Body extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      display: "none",
    };
  }

  //This will determine the sunken ship list should be rendered
  renderSunkenShips() {

    if(this.props.sunkenShips.includes("Carrier")){
      <div className="sunkenShip">Carrier</div>
    }
    else {
      <div className="floatingShip">Carrier</div>
    }
  }

  //render the game
  render() {
    return (<div className="container" style={this.props.style} >
              <div className="row" >
                <div className="col-sm-12 col-md-12 col-lg-6" >
                  <form data-game="game-form" className="cb-container" >
                    <div className="card text-center" >
                      <div className="card-header" >
                        Opponent Board
                      </div>
                      <div className="card-block" >
                        <Grid gridIdentity="Opponent" disabled="false" stateGrid={this.props.opponentStateGrid}/>
                      </div>
                    </div>
                  </form>
                </div>
              <div className = "col-sm-12 col-md-12 col-lg-6" >
                <div className = "card text-center" >
                  <div className = "card-header" >
                    Your Board
                  </div>
                  <div className = "card-block" >
                    <Grid gridIdentity="My Grid" disabled="disabled" stateGrid={this.props.myStateGrid}/>
                  </div>
                </div>
              </div>
            </div>
              <div className="row" >
                <div className = "col-sm-12 col-md-12 col-lg-12" >
                  <div className="card text-center messageCard" >
                    <div className="card-block">
                      <span>Game Status</span>
                      <br/>
                      <span className="messageCardText">{this.props.messageBox}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row" >
                <div className = "col-sm-12 col-md-12 col-lg-12" >
                  <div className="card text-center sunkenShipsCard" >
                    <div className="card-block">
                      <span>Sunken Ships</span>
                      <br/>
                      <div className="row sunkenShipList" >
                        <Ship shipName="Carrier" sunkenShips={this.props.sunkenShips} />
                        <Ship shipName="Battleship" sunkenShips={this.props.sunkenShips} />
                        <Ship shipName="Cruiser" sunkenShips={this.props.sunkenShips} />
                        <Ship shipName="Submarine" sunkenShips={this.props.sunkenShips} />
                        <Ship shipName="Destroyer" sunkenShips={this.props.sunkenShips} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
    );
  }
}

//these will each represent a ship that was either sunken or still afloat
class Ship extends React.Component {
    constructor(props) {
      super(props);
    }

    //render the ship
    render(){

        if (this.props.sunkenShips.includes(this.props.shipName)){
          return(<div className="col-sm-10-10 col-md-10-10 col-lg-2-10 sunkenShip">{this.props.shipName}</div>);
        }
        else {
          return(<div className="col-sm-10-10 col-md-10-10 col-lg-2-10 floatingShip">{this.props.shipName}</div>);
        }
      ;
    }
}

//This will hold the game lobby
class WelcomeDiv extends React.Component {
    constructor(props) {
      super(props);
      this.gameRoomButtons = [];
      this.gameRoomCount = 5;
    }

    //render each game room button assigning a unique ID and properties
    renderGameRoomButton(GameRoomID) {
      return ( <GameRoomButton gameroomid={GameRoomID} removeWelcomeCallback={this.props.removeWelcomeCallback} roomCounts={this.props.roomCounts} key={GameRoomID}/>)
    }

    //render the game lobby
    render() {
      let buttons = [];

      for (let i = 0; i < this.gameRoomCount; i++) {
        buttons.push(this.renderGameRoomButton(i + 1));
      }

      return (<div className = "container" >
                <div className = "card text-center card-plain" style = {this.props.style} >
                  <div className = "card-header" >
                    Please Select a Game Room
                  </div>
                  <div className = "card-block" >
                    <div className = "row" >
                      {buttons}
                    </div>
                  </div>
                </div>
              </div>
      )
    }
}

//this will show a button the allow users to enter a game
class GameRoomButton extends React.Component {
  constructor(props) {
    super(props);

   this.room = this.props.gameroomid - 1;

   this.updates = {disabled: false,
                  playerMessage: "Empty",
                  roomCounts: this.props.roomCounts};  //This can be updated internally without endlessly changing state

   this.state = {
      disabled: false,
      playerMessage: "Empty"
    }

  }

  //before entering a room, double check the number of people in the room
  //to be sure no one has entered since the number of people in the room was last rendered
  //synchronization issues will occur without this method
  doubleCheckRoomCounts() {
    socket.registerMessageHandler((data) => {
        var messageResponse = this.createGame(data);
    });


    let refreshRoomCountsMessage = new GameMessage({
      refreshRoomCounts: 1
    });

    socket.sendMessage(refreshRoomCountsMessage.serialize());

  }

  //once we are sure of the number of people in the room, enter or don't
  createGame(data){

    if (data.roomCounts) {
      console.log("Message Received", data);
      this.updates.roomCounts = data.roomCounts.slice();

      this.getRoomCounts(data);

      //alert("Game " + this.props.gameroomid + " started");
      let myCallback = this.props.removeWelcomeCallback;
      myCallback();

      let opponentIsPresent;
      let isTurn;
      if(this.updates.playerMessage == "Empty"){ //this gameroom has a challenger
        opponentIsPresent = false;
        isTurn = true;
      }
      else if(this.updates.playerMessage == "One Player Inside"){
        opponentIsPresent = true;
        isTurn = false;
      }
      else {
        alert("Cannot enter this room at this time.  It may have recently filled.  Please try another.")
      }

      let g = new Game(this.props.gameroomid, opponentIsPresent, isTurn);
      g.initGame();
    }
  }

  //update the text on the room counts
  getRoomCounts(data) {
    if(data.roomCounts[this.room] > 1){
      this.updates.disabled = true;
      this.updates.playerMessage ="Room Full";
    }
    else if(data.roomCounts[this.room] == 1){
      this.updates.disabled = false;
      this.updates.playerMessage = "One Player Inside";
    }
  }

  //render the game room button
  render() {

    this.getRoomCounts(this.props);
    let button;


      if(this.updates.disabled == false) {
        button = <button className="gameRoomButton" gameroomid={this.props.gameroomid} onClick={() => {this.doubleCheckRoomCounts()}} >Game Room {this.props.gameroomid}<br/><span className="playerMessageSpan">{this.updates.playerMessage}</span>< /button>
      }
      else if (this.updates.disabled == true){
        button = <button className="gameRoomButton" gameroomid={this.props.gameroomid} onClick={() => {this.doubleCheckRoomCounts()}} disabled>Game Room {this.props.gameroomid}<br/><span className="playerMessageSpan">{this.updates.playerMessage}</span>< /button>
      }

    return button;
  }
}

//This will display informative messages to the player about the status of the game
// class MessageBox extends React.Component {
//     constructor(props) {
//       super(props);
//     }
//
//     //render the message
//     render() {
//       return ( <h2> {this.props.message} </h2>);
//     }
// }


//this will show the state of grids used to play the game
class Grid extends React.Component {

  constructor(props) {
    super(props);

  }

  //render a cell, pass its color
  renderCell(x, y, cellName) {

      let columnID = `${x}-${y}`;
      let xCoor = `${x}`;
      let yCoor = `${y}`;
      return ( <Cell key={columnID} columnID={columnID} xCoor={xCoor} yCoor={yCoor} color={this.props.stateGrid[x][y]} cellName={cellName} disabled={this.props.disabled}/>)
  }

  //render the grid
  render() {
    let letterMap = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    let rows = [];
    for (var y = 0; y < 10; y++) {
      let rowID = `row${y}`;
      let column = [];
      for (var x = 0; x < 10; x++) {
        let columnID = `${x}-${y}`;
        let xCoor = `${x}`;
        let yCoor = `${y}`;
        let cellName = letterMap[x] + '-' + y;

        column.push(this.renderCell(x, y, cellName)); // Edit this to push data into cell
      }
      rows.push( <div className="row" key={y} id={rowID}>{column}</div>);
    }
      return ( <div width="100%" height="100%">{rows}</div>);
      }
    }


//the cell components will fill the grid used to play the game
class Cell extends React.Component {
    constructor(props) {
      super(props);
    }

    //render the cell, and give color
    render() {

      let cell;
      if (this.props.disabled == "disabled") {
        cell = (<div className="col-xs-1-10 col-sm-1-10 col-md-1-10 col-lg-1-10" key={this.props.columnID} id={this.props.columnID}><button className={this.props.color} data-xcoor={this.props.xCoor} data-ycoor={this.props.yCoor} disabled>{this.props.cellName}</button></div>)
      }
      else {
        cell = (<div className="col-xs-1-10 col-sm-1-10 col-md-1-10 col-lg-1-10" key={this.props.columnID} id={this.props.columnID} > <button className={this.props.color} data-xcoor={this.props.xCoor} data-ycoor={this.props.yCoor}> {this.props.cellName} </button></div>)
      }

      return (
        cell
      )
    }
}

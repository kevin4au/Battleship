/*
 * Shipt Interview | Battleship Game
 *
 * main.js
 *
 * created: 4 February 2018
 * author: Kevin Boyd
 *
 * This is the driver program for the Battleship Game.
 *
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { GameWrapper } from './view.js';
import socket from './ws-client';


//This is a Singleton class that will be used to link our application logic to the React based view.
//It is declared here in main.js and immediately frozen once the view is initialized.
class SingleView {
  constructor() {
    if (!SingleView.instance) {
      this.react;
      SingleView.instance = this;
    }
    return SingleView.instance;
  }
}

//view will be an instance of SingleView and will be passed between the each file in this program
const view = new SingleView();
export default view;

//initialize our websocket
socket.init();

//render the site
ReactDOM.render( < GameWrapper / > ,
  document.getElementById('root')
);

//set up a listener to get the number of players in each game room
socket.registerMessageHandler((data) => {
    var messageResponse = view.react.updateRoomCounts(data);
});

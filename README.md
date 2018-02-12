# Battleship
This is a Battleship Game written using Node.js and React.


**Demo:** [battleship.kevinboyd.me](http://battleship.kevinboyd.me)


## Getting Started:
To run this program locally:
1. Clone this repo to your local machine. 
2. Step inside the Battleship directory and type **"npm start"** to start the node server.  Note: npm must be installed.
  (npm may be downloaded and installed from [http://www.npmjs.com/get-npm](http://www.npmjs.com/get-npm).)  
3. Next, open up a browser and navigate to [http://localhost:3000/index.html](http://localhost:3000/index.html).  
Open up a new browser window or tab to play a game of Battleship local to your machine.  
Logs may be seen by opening up dev tools in the browser.  (Most testing has taken place in Google Chrome.)
  
## About This Program:
This program was build using Node.js and React.  It is comprised of a number of files that make up both the client and server.

### Server:
Most of the server logic takes place in index.js in the root directory.
This file handles both the serving of files and the handling of websockets.  
A second file exists to resolve the paths used by the site.  We will only use one: index.html.  
When editing files, it is useful to run "npm run dev" in a terminal window to automatically restart the server when files are saved.

### Client:
The client-side code is compiled using webpack.  While the client side code will actually run from bundle.js in the dist folder,
the code is edited in the src folder.  By running "npm run watch", webpack will watch the files for updates and rebuild the project after each update.

##### Client Files:
* *main.js*: Program execution starts here.  A singleton class is defined to link the application logic to the view. The React view is also rendered, and a socket is opened to start listening for messages from the server.
* *view.js*: All React components are defined here.  The top most component is GameWrapper, and this component passes properties to all other components.  When GameWrapper initializes, it sets itself equal to the view singleton and freezes it.  The application logic will use this singleton for any reference to the view.
* *battleship.js*: The majority of the client side application logic for the game is contained in this file.  A number of classes are defined including *Game*, *Player*, *Fleet*, *Ship*, *Location*, and *Game Message*.  Details of each of these classes may be found in the inline comments.
* *ws-client*: This file defines how we will interface with the websockets.

## Future Work:
* Return players to the game lobby after a game is complete or if they click the brand in the top left.
  This would require the view to be reset and for a notification message to be sent to other clients.
* Make the number of game rooms dynamic.  For simplicity, they have been limited to 5.
* Add a sign in screen to make players unique.  Currently, I assign players a unique ID using the timestamp of when they started the game.  Gravatars could be used.  A chat window could also be created to make for a better player to player interface.
* Refactor the receiveMessage() method in the *Player* class.  This one grew a lot, and I think it could be broken into separate methods for better readabilty.
* Make additional UI enhancements.

var valuesElement = document.getElementById('values');
var lastMeasured;
var minDelay = 300;

var socketAddress = "ws://" + window.location.host + "/sockets";
var init = function() {
  return new Promise(function(resolve, reject) {
    var socket = new WebSocket(socketAddress);
    socket.onopen = function() {
      return resolve(socket);
    }
  });
};

var vals = [];

init().then(function(socket) {
  var playerId = document.PLAYER == 'player1' ? 0 : 1;

  socket.onmessage = function(evt) {
    var data = JSON.parse(evt.data);
    if(data.players) {
      var player = data.players[playerId];
    }

    window.addEventListener('deviceorientation', function(evt) {
      if(lastMeasured === undefined || lastMeasured + minDelay < Date.now()) {
        lastMeasured = Date.now();
        vals.push(evt.beta)
        vals = vals.slice(-5);
        var avg = vals.reduce(function(a, b) {return a+b})/vals.length;
        valuesElement.textContent = [avg].join(", ");

        var res = {};
        res[playerId] = {th: (avg % 360) / 180 * 2*Math.PI};
      
        socket.send(JSON.stringify(res));

      }
    }, false);
  }

  document.getElementById('fire-button').addEventListener('click', function() {
    var res = {}
    res[playerId] = {fire: true};
   
    socket.send(JSON.stringify(res));
  });
});

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
        valuesElement.textContent = [evt.gamma, evt.alpha].join(", ");

        var res = {};
        res[playerId] = {x: evt.gamma, y: evt.beta, th: (evt.alpha % (Math.PI*2))/20};
      
        socket.send(JSON.stringify(res));

      }
    }, false);
  }
});

var WebSocketServer = require('ws').Server;
var redis = require('redis');

var client = redis.createClient(6379, 'localhost');
var writer = redis.createClient(6379, 'localhost');
client.subscribe('position');
client.subscribe('player1');
client.subscribe('player2');

var connections = [];

client.on('message', function(channel, message) {
  console.log(message);
  for(var i=0; i < connections.length; i++) {
    var res = {};
    console.log(channel);
    var key = channel == 'player1' ? 0 : 1;
    res[key] = JSON.parse(message);
    connections[i].send(JSON.stringify(res));
  }
});

var connectionListener = function(ws) {
  var id;
  connections.push(ws);
  console.log('new client');
  ws.send(JSON.stringify({'message' : 'welcome!'}));

  ws.on('message', function(message) {
    var data = JSON.parse(message);
    for(var playerId in data) {
      console.log(playerId);
      var key = (playerId == 0) ? 'player1' : 'player2';
      writer.publish(key, JSON.stringify(data[playerId]));
    };
  });

  ws.on('close', function() {
    connections.splice(connections.indexOf(ws), 1);
    console.log('socket closed');
  });
}

module.exports = function(server) {
  var wss = new WebSocketServer({
    server: server,
    path: '/sockets'
  });

  wss.on('connection', connectionListener);
};

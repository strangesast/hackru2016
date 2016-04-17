var WebSocketServer = require('ws').Server;
var redis = require('redis');

var client = redis.createClient(6379, 'localhost');
client.subscribe('position');
var connections = [];

client.on('message', function(channel, message) {
  for(var i=0; i < connections.length; i++) {
    connections[i].send(message);
  }
});

var connectionListener = function(ws) {
  connections.push(ws);
  console.log('new client');
  ws.send(JSON.stringify({'message' : 'welcome!'}));

  ws.on('message', function(message) {
    console.log('message: ' + message);
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

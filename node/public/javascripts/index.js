var mainWrapper = document.getElementById('main-wrapper');
var mainCanvas = document.getElementById('main-canvas');

var init = function(socket, new_players, gun, guninv) {
  var w, h, ctx, pad, r, players = {}, playersByIdArray = [], shots = [], blobs = [], currentDocKeyListener, currentPlayer=0, lastShotFrame, shotInterval = 50, minPlayerShotInterval = 500, hitboxvisible=false;

  var recalcVals = function() {
    let box = mainWrapper.getBoundingClientRect();
    w = box.width/4;
    h = box.height/4;
    mainCanvas.width = w;
    mainCanvas.height = h;
    ctx = mainCanvas.getContext('2d');

    pad = Math.min(w, h)/10;
    r = Math.min(w, h)/20;
  };

  var background = function() {
    let r1 = Math.PI;
    let r2 = -Math.PI/2;
    let x = pad;
    let y = pad;
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'slategray';
    ctx.beginPath();
    ctx.moveTo(x, y+r);
    ctx.arc(x+r, y+r, r, r1, r2);
    r1+=Math.PI/2;
    r2+=Math.PI/2;
    x+=w-2*pad;
    ctx.arc(x-r, y+r, r, r1, r2);
    y+=h-2*pad;
    ctx.lineTo(x, y);
    r1+=Math.PI/2;
    r2+=Math.PI/2;
    ctx.arc(x-r, y-r, r, r1, r2);
    x-=w-3*pad;
    ctx.lineTo(x, y);
    r1+=Math.PI/2;
    r2+=Math.PI/2;
    ctx.arc(x-r, y-r, r, r1, r2);

    // reverse
    ctx.rect(w, 0, -w, h);
    ctx.fill();
  }

  var addPlayer = function(num, xi, yi, th, icon, gunicon, dir) {
    players[num] = {
      x: isNaN(xi) ? w/2 : xi,
      y: isNaN(yi) ? h/2 : yi,
      th: isNaN(th) ? 0 : th,
      r: 20,
      lastshot: undefined,
      health: 100,
      icon: icon,
      gunicon: gunicon,
      dir: dir
    };
    playersByIdArray.push(num);
    return num;
  }

  var removePlayer = function(i) {
    playersByIdArray.splice(playersByIdArray.indexOf(i), 1);
    delete players[i];
    updateServer(i);
  }

  var aimPlayer = function(i, theta, rel) {
    let player = players[i];
    if(rel) {
      theta = (player.th + theta) % (Math.PI*2);
    }
    player.th = theta;
    updateServer(i);
  }

  var movePlayer = function(i, x, y, rel) {
    let player = players[i];
    if(rel) {
      x = player.x + x;
      y = player.y + y;
    }
    let nx = Math.min(w-pad-player.r, Math.max(x, pad+player.r));
    let ny = Math.min(h-pad-player.r, Math.max(y, pad+player.r));
    player.x = nx;
    player.y = ny;

    for(var j=0; j < blobs.length; j++) {
      let blob = blobs[j];
      if(Math.sqrt(Math.pow(player.x-blob.x, 2)+Math.pow(player.y-blob.y, 2)) < player.r) {
        addHealth(i, Math.round(blob.r));
        blobs.splice(j, 1);
        break;
      }
    }
    updateServer(i);
    return [nx, ny];
  }

  var updateServer = function(i) {
    let player = players[i];
    var res = {};
    res[i] = {};
    for(var prop in player) {
      if(typeof player[prop] == 'number') {
        res[i][prop] = player[prop];
      }
    }
    socket.send(JSON.stringify(res));
  }

  var addHealth = function(i, amt) {
    let player = players[i];
    player.health = Math.min(100, Math.max(0, player.health + amt));
    updateServer(i);
  }

  var getGrd = function(p) {
    var grd=ctx.createLinearGradient(0,0,0,2/3*h);
    switch (Math.floor(p/10)) {
      case 10:
      case 9:
      case 8:
        grd.addColorStop(0,"rgb(0, 255, 0)");
        grd.addColorStop(1,"rgb(0, 200, 0)");
        break;
      case 7:
      case 6:
        grd.addColorStop(0,"rgb(60, 220, 60)");
        grd.addColorStop(1,"rgb(60, 180, 60)");
        break;
      case 5:
        grd.addColorStop(0,"rgb(40, 140, 40)");
        grd.addColorStop(1,"rgb(40, 120, 40)");
        break;
      case 4:
      case 3:
        grd.addColorStop(0,"rgb(150, 80, 80)");
        grd.addColorStop(1,"rgb(120, 80, 80)");
        break;
      case 2:
      case 1:
        grd.addColorStop(0,"rgb(255, 0, 0)");
        grd.addColorStop(1,"rgb(200, 0, 0)");
        break;
      case 0:
        grd.addColorStop(0,"rgb(255, 0, 0)");
        grd.addColorStop(1,"rgb(200, 0, 0)");
        break;
    }
    return grd;
  }

  var drawHealth = function(playerId) {
    if(isNaN(playerId) || players[playerId] === undefined) {
      return false;
    }
    let player = players[playerId];
    var grd = getGrd(player.health);
    ctx.fillStyle = grd;
    let ys = h*(1/2-1/3+2/3*(1-player.health/100));
    var xs;
    if(playerId == 0) {
      xs = pad/10;
    } else if (playerId == 1) {
      xs = w - pad*9/10;
    }
    ctx.fillRect(xs, ys, pad*8/10, 2/3*h*player.health/100);
    ctx.fillStyle = 'black';
    ctx.font = Math.round(pad/2) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.health, xs+pad*4/10, ys+Math.round(pad/2));
  }

  var drawPlayers = function() {
    ctx.fillStyle = 'black';
    for(var playerId in players) {
      let player = players[playerId];
      if(hitboxvisible) {
        ctx.fillStyle='blue';
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.drawImage(player.icon, player.x-player.icon.width/2, player.y-player.icon.height/2);
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.th);
      ctx.drawImage(player.gunicon, -player.gunicon.width/2, 10);
      ctx.translate(-player.x, -player.y);
      ctx.restore();
    }
  };

  var drawShots = function() {
    ctx.fillStyle = 'red';
    for(var i=0; i < shots.length; i++) {
      let shot = shots[i];
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  var drawBlobs = function() {
    ctx.fillStyle = 'blue';
    for(var i=0; i < blobs.length; i++) {
      let blob = blobs[i];
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI*2);
      ctx.fill();
    }
  }



  var addShot = function(x, y, vx, vy, owner) {
    shots.push({x: x, y: y, vx: vx, vy: vy, owner: owner, s: Date.now(), f: 0});
  }

  var firePlayer = function(playerId) {
    let player = players[playerId];
    if(player.lastshot === undefined || player.lastshot + minPlayerShotInterval < Date.now()) {
      player.lastshot = Date.now();
      addShot(
          player.x-Math.sin(player.th)*12+(1-player.dir*2)*Math.cos(player.th)*24,
          player.y+Math.cos(player.th)*12+(1-player.dir*2)*Math.sin(player.th)*24,
          Math.cos(player.th)*(1-player.dir*2),
          Math.sin(player.th)*(1-player.dir*2),
          playerId);
    }
  };

  var redraw = function() {
    recalcVals();
    background();
    drawPlayers();
    drawShots();
    drawBlobs();
    drawHealth(0);
    drawHealth(1);
    if(lastShotFrame === undefined || lastShotFrame + shotInterval < Date.now()) {
      for(var i=0; i < shots.length; i++) {
        let s = shots[i];
        s.f += 1;
        let d = (Date.now() - s.s)/s.f;
        s.x += s.vx*d/50;
        s.y += s.vy*d/50;
        var playerId = s.owner == 0 ? 1 : 0;
        var player = players[playerId];
        if(Math.sqrt(Math.pow(player.x - s.x, 2) + Math.pow(player.y - s.y, 2)) < player.r) {
          addHealth(playerId, -8);
          shots.splice(i, 1);
          
          break;
        } else if (s.x > w - pad || s.x < pad || s.y > h - pad || s.y < pad) {
          shots.splice(i, 1);
        }
      }
      lastShotFrame = Date.now();
    }
  };

  window.onresize = function(evt) {
    redraw();
  };

  var keysDown = {};

  document.onkeyup = function(evt) {
    var keyCode = evt.keyCode;
    keysDown[keyCode] = false;
  };

  document.onkeydown = function(evt) {
    var keyCode = evt.keyCode;
    keysDown[keyCode] = true;

    if(keyCode > 48 && keyCode < 58) {
      currentPlayer = keyCode-49;
    }

    currentPlayerId = playersByIdArray[currentPlayer];

    if(currentPlayerId !== undefined) {
      var px = 0;
      var py = 0;
      var th = 0;
      if(keysDown[37]) px -= 1;
      if(keysDown[38]) py -= 1;
      if(keysDown[39]) px += 1;
      if(keysDown[40]) py += 1;
      if(keysDown[90]) th -= 10/180*Math.PI;
      if(keysDown[88]) th += 10/180*Math.PI;
      movePlayer(currentPlayerId, px, py, true);
      aimPlayer(currentPlayerId, th, true);
    }

    if(currentPlayerId !== undefined) {
      switch(keyCode) {
        case 32:
          firePlayer(currentPlayerId);
          break;
      }
    }
  }

  socket.onmessage = function(message_evt) {
    var data = JSON.parse(message_evt.data);
    for(var playerId in data) {
      var fire = false;
      for(var prop in data[playerId]) {
        if(prop == 'fire') {
          fire=true;
        } else {
          players[playerId][prop] = data[playerId][prop];
        }
      }
      if(fire) {
        firePlayer(playerId);
      }
    }
  };

  var fps = 30;
  var now;
  var then = Date.now();
  var interval = 1000/fps;
  var delta;
    
  function draw() {
    requestAnimationFrame(draw);
    now = Date.now();
    delta = now - then;
    if (delta > interval) {
      then = now - (delta % interval);
      redraw();
    }
  }
   
  draw();

  setTimeout(function() {
    for(var i=0; i < new_players.length; i++) {
      addPlayer(i, w/new_players.length*i+pad+20, h/2, 2*Math.PI*(i%2), new_players[i].icon, i%2==0 ? gun : guninv, i%2);
    }
  }, 100);

  setInterval(function() {
    if(blobs.length < 5) {
      blobs.push({
        x: pad + Math.random()*(w-2*pad),
        y: pad + Math.random()*(h-2*pad),
        r: (Math.random()*0.8 + 0.2)*5
      });
    }
  }, 1200);

  document.getElementById('update-image').addEventListener('click', function() {
    var player = document.getElementById('player-select').value;
    var url = document.getElementById('new-image-url-input').value;

    loadImage(url).then(function(img) {
      players[player].icon = img;
    });
  });
};

var loadImage = function(url) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.onload = function() {
      return resolve(img);
    }
    img.onerror = function(err) {
      return reject(err);
    }
    img.src = url;
  });
};

Promise.all(['/images/goofevilsmall.png', '/images/goofcoolsmall.png', '/images/ak_small.png', '/images/ak_a_small.png'].map(function(img_url) {
  return loadImage(img_url);

})).then(function(imgs) {
  var socketAddress = "ws://" + window.location.host + "/sockets";
  return new Promise(function(resolve, reject) {
    var socket = new WebSocket(socketAddress);
    socket.onopen = function() {
      return resolve(socket);
    }
  }).then(function(socket) {
    init(socket, [{'icon':imgs[0]}, {'icon':imgs[1]}], imgs[2], imgs[3]);
  });
});

//var img = new Image();
//img.onload = function() {
//  var ob = init(img);
//}
//img.src = '/images/goofevilsmall.png';


//var connectButton = document.getElementById('connect-button');
//connectButton.addEventListener('click', function(evt) {
//  var options = {'filters' : [{'name' : 'HC-06'}]};
//
//  navigator.bluetooth.requestDevice(options).then(function(device) {
//    connectButton.parentElement.removeChild(connectButton);
//    console.log(device);
//    //init();
//
//  }).catch(function(err) {
//    console.log('err!');
//    console.log(err);
//  });
//});

var mainWrapper = document.getElementById('main-wrapper');
var mainCanvas = document.getElementById('main-canvas');

var init = function(player1icon, player2icon, player1gun, player2gun) {
  var w, h, ctx, pad, r, players = {}, shots = [], currentDocKeyListener, firstPlayerId, secondPlayerId, currentPlayer=0, lastShotFrame, shotInterval = 50;

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

  var addPlayer = function(xi, yi, th) {
    let rand = Math.round(Math.random()*100); //ugly
    players[rand] = {
      x: xi || w/2,
      y: yi || h/2,
      th: th || 0,
      health: 100
    };
    if(firstPlayerId === undefined) {
      firstPlayerId = rand;
    } else {
      secondPlayerId = rand;
    }
    return rand;
  }

  var removePlayer = function(i) {
    delete players[i];
  }

  var aimPlayer = function(i, theta, rel) {
    let player = players[i];
    if(rel) {
      theta = (player.th + theta) % (Math.PI*2);
    }
    player.th = theta;
  }

  var movePlayer = function(i, x, y, rel) {
    let player = players[i];
    if(rel) {
      x = player.x + x;
      y = player.y + y;
    }
    let nx = Math.min(w-pad, Math.max(x, pad));
    let ny = Math.min(h-pad, Math.max(y, pad));
    player.x = nx;
    player.y = ny;

    return [nx, ny];
  }

  var addHealth = function(i, amt) {
    let player = players[i];
    player.health += amt;
  }

  var drawHealth = function(playerId) {
    if(isNaN(playerId)) {
      return false;
    }
    var grd=ctx.createLinearGradient(0,0,0,2/3*h);
    let player = players[playerId];
    if(player.health > 90) { 
      grd.addColorStop(0,"rgb(0, 255, 0)");
      grd.addColorStop(1,"rgb(0, 200, 0)");

    } else if(player.health > 70) {
      grd.addColorStop(0,"rgb(60, 220, 60)");
      grd.addColorStop(1,"rgb(60, 180, 60)");

    } else if(player.health > 50) {
      grd.addColorStop(0,"rgb(40, 140, 40)");
      grd.addColorStop(1,"rgb(40, 120, 40)");

    } else if(player.health > 30) {
      grd.addColorStop(0,"rgb(150, 80, 80)");
      grd.addColorStop(1,"rgb(120, 80, 80)");

    } else if(player.health > 10) {
      grd.addColorStop(0,"rgb(255, 0, 0)");
      grd.addColorStop(1,"rgb(200, 0, 0)");

    } else {
      grd.addColorStop(0,"rgb(255, 0, 0)");
      grd.addColorStop(1,"rgb(200, 0, 0)");
    }

    ctx.fillStyle = grd;
    let ys = h*(1/2-1/3+2/3*(1-player.health/100));
    var xs;
    if(playerId == firstPlayerId) {
      xs = pad/10;
    } else if (playerId == secondPlayerId) {
      xs = w - pad*9/10;
    }
    ctx.fillRect(xs, ys, pad*8/10, 2/3*h*player.health/100);
    ctx.fillStyle = 'black';
    ctx.font = Math.round(pad/2) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.health, xs, ys+Math.round(pad/2));
  }

  var drawPlayers = function() {
    ctx.fillStyle = 'black';
    for(var playerId in players) {
      var icon;
      var th;
      var xoff;
      var xoffg;
      let player = players[playerId];
      if(playerId == firstPlayerId) {
        icon = player1icon;
        gunicon = player1gun;
        th = player.th;
        xoff = player.x-30;
        xoffg = -50;
      } else if (playerId == secondPlayerId) {
        icon = player2icon;
        gunicon = player2gun;
        th = player.th + Math.PI;
        xoff = player.x+30;
        xoffg = 0;
      }
      ctx.drawImage(icon, xoff, player.y-30);
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(th);
      ctx.drawImage(gunicon, xoffg, -4);
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

  var addShot = function(x, y, vx, vy, owner) {
    shots.push({x: x, y: y, vx: vx, vy: vy, owner: owner, s: Date.now(), f: 0});
  }

  var firePlayer = function(playerId) {
    let player = players[playerId];
    addShot(player.x, player.y, Math.cos(player.th), Math.sin(player.th), playerId);
  };

  var redraw = function() {
    recalcVals();
    background();
    drawPlayers();
    drawShots();
    drawHealth(firstPlayerId);
    drawHealth(secondPlayerId);
    if(lastShotFrame === undefined || lastShotFrame + shotInterval < Date.now()) {
      for(var i=0; i < shots.length; i++) {
        let s = shots[i];
        s.f += 1;
        let d = (Date.now() - s.s)/s.f;
        s.x += s.vx*d/50;
        s.y += s.vy*d/50;
        var playerId = s.owner == firstPlayerId ? secondPlayerId : firstPlayerId;
        var player = players[playerId];
        if(Math.abs(player.x - s.x) < 10 && Math.abs(player.y - s.y) < 10) {
          console.log('collision!');
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

  document.onkeydown = function(evt) {
    var keyCode = evt.keyCode;
    if(keyCode == 49) {
      // player 1
      currentPlayer = 0;
    } else if (keyCode == 50) {
      // player 2
      currentPlayer = 1;
    }
    currentPlayerId = currentPlayer == 0 ? firstPlayerId : secondPlayerId;

    if(currentPlayerId !== undefined) {
      let player = players[currentPlayerId];
      if(keyCode == 37) {
        //console.log('left');
        movePlayer(currentPlayerId, -1, 0, true)
      } else if (keyCode == 38) {
        //console.log('up');
        movePlayer(currentPlayerId, 0, -1, true)
      } else if (keyCode == 39) {
        //console.log('right');
        movePlayer(currentPlayerId, 1, 0, true)
      } else if (keyCode == 40) {
        //console.log('down');
        movePlayer(currentPlayerId, 0, 1, true)
      } else if (keyCode == 90) {
        //console.log('counterclockwise');
        aimPlayer(currentPlayerId, -10/180*Math.PI, true);
      } else if (keyCode == 88) {
        //console.log('clockwise');
        aimPlayer(currentPlayerId, 10/180*Math.PI, true);
      } else if (keyCode == 32) {
        firePlayer(currentPlayerId);
      }
      redraw();
    }
  }

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
    var f = addPlayer();
    var s = addPlayer(2/3*w, h/2, Math.PI);
  }, 1000);

  //var interval;

  //interval = setInterval(function() {
  //  if(firstPlayerId) {
  //    players[firstPlayerId].health -= 5;
  //    if(players[firstPlayerId].health < 0) {
  //      players[firstPlayerId].health = 100;
  //    }
  //  }
  //}, 500)

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
  init(imgs[0], imgs[1], imgs[2], imgs[3]);
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

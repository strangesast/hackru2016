var mainWrapper = document.getElementById('main-wrapper');
var mainCanvas = document.getElementById('main-canvas');

var init = function() {
  var w, h, ctx, pad, r;

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

  var draw = function() {
    ctx.beginPath();
    ctx.arc(w/2, h/2, Math.min(w, h) / 8, 0, 2*Math.PI);
    ctx.fill();
  };
  
  var background = function() {
    let r1 = Math.PI;
    let r2 = -Math.PI/2;
    let x = pad;
    let y = pad;

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

  recalcVals();
  background();

  window.onresize = function(evt) {
    recalcVals();
    background();
  };
};

var connectButton = document.getElementById('connect-button');
connectButton.addEventListener('click', function(evt) {
  var options = {'filters' : [{'name' : 'HC-06'}]};

  navigator.bluetooth.requestDevice(options).then(function(device) {
    connectButton.parentElement.removeChild(connectButton);
    console.log(device);
    //init();

  }).catch(function(err) {
    console.log('err!');
    console.log(err);
  });
});


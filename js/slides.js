var emailSec = "crr:'+7 <-H\"#o*#ccr`";
var phoneSec = "&xzxzfml>4";
var emailKey = "-= northychen.com =-";
var phoneKey = "-nnnnorthy- ";
var EMAIL = emailKey.split('').map(function(c, i){return String.fromCharCode((emailKey.charCodeAt(i) ^ (emailSec.charCodeAt(i) - 32)))}).join('');
var PHONE = phoneKey.split('').map(function(c, i){return String.fromCharCode((phoneKey.charCodeAt(i) ^ (phoneSec.charCodeAt(i) - 32)))}).join('');
var TAILS = "@nnnnorthy-@emergency.use.only-nervemilk.com-@typeself|";

// var EMAIL = "n@g";
// var PHONE = "16";
// var TAILS = "x|";

// Snake game
$(function() {

  const BLOCK_SIZE = 20;
  const START_SPEED = 6 / 1000; // 2.5 block per second
  var speed;
  var snakeBox = $('#snakeBox');

  if(snakeBox.length == 0) {
    return;
  }

  var instructions     = snakeBox.find('.snakeInstructions');
  var instructionClose = snakeBox.find('.closeInstructions');
  var foodBox          = snakeBox.find('.food');

  // Internal states
  const STATES = {
    LOADED    : 0,
    PAUSED    : 1,
    RUNNING   : 2,
    LOST      : 3,
    WON       : 4,
    ANIMATE   : 5,
    FINISHED  : 6
  };

  const DIR = {
    UP    : -1,
    DOWN  : 1,
    LEFT  : -2,
    RIGHT : 2
  };

  var snake;

  var state = STATES.STOPPED;
  var handler = null;
  var data = [];
  var food = {x: -1, y: -1};

  init();

  function update(t) {
    // END game animation logic
    if(state == STATES.ANIMATE && snake.cmd.length == 0) {
      var x = snake.body[0].x;
      var y = snake.body[0].y;
      var dir = snake.dir;

      var endx = 8, endy = Math.floor(gridHeight()/4*3 + 2), endRow = gridWidth()-1;
      if(x == endx && y == endy && snake.endingTurn == true) {
        state = STATES.FINISHED;
      }else if(x >= endRow) {
        if(y == endy) {
          if(dir == DIR.DOWN || dir == DIR.UP) {
            snake.dir = DIR.LEFT;
            snake.endingTurn = true;
          }else if(dir == DIR.RIGHT){
            snake.dir = DIR.DOWN;
          }
        }else if(y > endy) {
          snake.dir = DIR.LEFT;
        }else if(y < endy && dir != DIR.LEFT) {
          if(dir == DIR.LEFT || dir == DIR.RIGHT) {
            console.log("bingo");
            snake.dir = DIR.DOWN;
          }else if(dir == DIR.UP) {
            snake.dir = DIR.LEFT;
          }
        }
      }else {
        if(y < 2) {
          snake.dir = DIR.RIGHT;
        }else if(x < 2){
          snake.dir = DIR.UP;
        }else {
          snake.dir = DIR.LEFT;
        }
      }
    }

    var dx = 0, dy = 0;
    if(snake.lastUpdate == 0) snake.lastUpdate = t;
    var moveDist = (t - snake.lastUpdate) * speed;
    var dist = moveDist;
    snake.lastUpdate = t;

    // Move the head
    while(dist > 0) {
      if(snake.dir == DIR.UP) {
        dy = -dist;
      }else if(snake.dir == DIR.DOWN) {
        dy = dist;
      }else if(snake.dir == DIR.LEFT) {
        dx = -dist;
      }else if(snake.dir == DIR.RIGHT) {
        dx = dist;
      }

      var head = snake.body[0];
      head.px += dx; head.py += dy;
      if(Math.abs(head.px - head.x) > 1 || Math.abs(head.py - head.y) > 1) {
        // Move the body blocks forward by one block
        var i = snake.body.length - 1;
        while(i > 0) {
          var prevBlock = snake.body[i - 1];
          var currBlock = snake.body[i];
          currBlock.x = prevBlock.x;
          currBlock.y = prevBlock.y;
          currBlock.px = prevBlock.x;
          currBlock.py = prevBlock.y;
          i--;
        }

        // Then move the head by one block
        dist = 0;
        if(head.px - head.x > 1) {
          head.x += 1;
          dist = head.px - head.x - 1;
          head.px = head.x;
        }
        if(head.py - head.y > 1){
          head.y += 1;
          dist = head.py - head.y - 1;
          head.py = head.y;
        }
        if(head.px - head.x < -1) {
          head.x -= 1;
          dist = head.x - head.px - 1;
          head.px = head.x;
        }
        if(head.py - head.y < -1){
          head.y -= 1;
          dist = head.y - head.py - 1;
          head.py = head.y;
        }

        // Update the snake direction
        while(snake.cmd.length > 0) {
          var cmd = snake.cmd.shift();
          // Command and current direction is in opposite direction is ignored
          if(cmd + snake.dir != 0) {
            snake.dir = cmd;
            break;
          }
        }
      }else {
        // Move the body blocks by the same amount as the head did
        var i = snake.body.length - 1;
        while(i > 0) {
          var prevBlock = snake.body[i - 1];
          var currBlock = snake.body[i];
          if(prevBlock.x > currBlock.x) {currBlock.px += dist; currBlock.py = currBlock.y;}
          if(prevBlock.x < currBlock.x) {currBlock.px -= dist; currBlock.py = currBlock.y;}
          if(prevBlock.y > currBlock.y) {currBlock.py += dist; currBlock.px = currBlock.x;}
          if(prevBlock.y < currBlock.y) {currBlock.py -= dist; currBlock.px = currBlock.x;}
          i--;
        }

        dist = 0;
      }

      if(state == STATES.RUNNING) {
        // Collision check
        var hx = Math.ceil(head.px);
        var hy = Math.ceil(head.py);

        if(head.px < 0 || hx > gridWidth() || head.py < 0 || hy > gridHeight()) {
          // Lost too;
          if(head.px < 0) head.px = 0;
          if(head.py < 0) head.py = 0;
          if(hx > gridWidth()) head.px = gridWidth();
          if(hy > gridHeight()) head.py = gridHeight();
          lost();
        }

        for(var i = 2; i < snake.body.length; i++) {
          var block = snake.body[i];
          if(hx == block.x && hy == block.y) {
            lost();
          }
        }

        // Food check
        if(hx == food.x && hy == food.y) {
          snakeGrow(food.c);
          addFood();
        }
      }
    }

    // Update body display
    for(var block of snake.body) {
      block.dom.css({
        top: block.py * BLOCK_SIZE,
        left: block.px * BLOCK_SIZE
      })
    }

    // Register for next frame update
    if(state == STATES.RUNNING || state == STATES.ANIMATE) {
      handler = window.requestAnimationFrame(update);
    }
  }

  function nextChunk() {
    if(data.length < 1) {
      data = (EMAIL + "-" + PHONE + "-" + TAILS).split('');
    }
    return data.shift();
  }

  function instructionsClosed() {
    if(state == STATES.LOADED || state == STATES.LOST || state == STATES.WON || state == STATES.FINISHED) {
      start();
    }else if(state == STATES.PAUSED) {
      resume();
    }
  }

  function keydown(keyPressed) {

    var key = keyPressed.key;

    if(!key) {
      key = keyPressed.originalEvent.keyIdentifier;
    }

    if(state == STATES.LOADED) {
      if(key == 'Enter') {
        start();
      }
    }else if(state == STATES.RUNNING) {
      if(key == 'Escape' || key == 'U+001B' || key == 'p' || key == ' ' || key == 'U+0020' || key == 'U+0050') {
        pause();
      }else {
        if(key.endsWith('Up'))    snake.cmd.push(DIR.UP);
        if(key.endsWith('Down'))  snake.cmd.push(DIR.DOWN);
        if(key.endsWith('Left'))  snake.cmd.push(DIR.LEFT);
        if(key.endsWith('Right')) snake.cmd.push(DIR.RIGHT);
      }

    }else if(state == STATES.PAUSED) {
      if(key == 'Enter' || key == ' ' || key == 'U+0020') {
        resume();
      }
    }else if(state == STATES.FINISHED) {
      if(key == 'Enter' || key == ' ' || key == 'U+0020') {
        start();
      }
    }
  }

  function init() {
    setInstructions("USE ARROW KEYS TO CONNECT LETTERS.<br/>PRESS enter TO START.");
    instructions.show();
    state = STATES.LOADED;
    $(window).keydown(keydown);
    instructionClose.click(instructionsClosed);
    initSnake();
  }

  function initSnake() {
    snakeBox.find('.snakeBody').remove();
    data = [];
    snake = {
      dir: DIR.RIGHT,
      lastUpdate: 0,
      endingTurn: false,
      cmd: [],
      body: []
    }
    snakeGrow(nextChunk());
    addFood();
  }

  function addFood() {
    var c = nextChunk();
    if(c == '|') {
      won();
    }
    food.x = Math.floor(Math.random() * gridWidth());
    food.y = Math.floor(Math.random() * gridHeight());
    food.c = c;
    foodBox.css({
      top: food.y * BLOCK_SIZE,
      left: food.x * BLOCK_SIZE,
      display: 'block'
    });
    foodBox.text(c);
  }

  function start() {
    initSnake();
    speed = START_SPEED;
    instructions.hide();
    state = STATES.RUNNING;
    handler = window.requestAnimationFrame(update);
  }

  function gridWidth() {
    return Math.floor((snakeBox.width() - 0.1) / BLOCK_SIZE);
  }

  function gridHeight() {
    return Math.floor((snakeBox.height() - 0.1) / BLOCK_SIZE);
  }

  function pause() {
    state = STATES.PAUSED;
    setInstructions("PAUSED.<br/>PRESS space TO RESUME.");
    instructions.show();
  }

  function lost() {
    state = STATES.LOST;
    var instruction = ":)<br/>CLICK TO DOWNLOAD AND DROP A HELLO.";
    if(snake.body.length < EMAIL.length){
      instruction = ":/<br/>PLEASE TRY AGAIN.";
    }
    setInstructions(instruction);
    instructions.show();

    html2canvas(document.body).then(function(canvas) {
        // Export the canvas to its data URI representation
        var base64image = canvas.toDataURL("image/png");

        // Open the image in a new window
        window.open(base64image , "_blank");
    });

    // speed = START_SPEED * 3;
    // scheduleAnimation(2000);
  }

  function won() {
    state = STATES.WON;
    setInstructions(":)<br/>NOW DROP A HELLO.");
    instructions.show();
    speed = START_SPEED * 3;
    scheduleAnimation(500);
  }

  function scheduleAnimation(t) {
    setTimeout(function(){
      foodBox.css({display: 'none'});
      state = STATES.ANIMATE;
      snake.lastUpdate = 0;
      handler = window.requestAnimationFrame(update);
    }, t);
  }

  function resume() {
    instructions.hide();
    snake.lastUpdate = 0;
    state = STATES.RUNNING;
    handler = window.requestAnimationFrame(update);
  }

  function snakeGrow(chunk) {
    var x = Math.floor(gridWidth() * Math.random() * 0.6);
    var y = Math.floor(gridHeight() * Math.random() * 0.3);

    if(snake.body.length > 0) {
      var lastBlock = snake.body[snake.body.length - 1];
      x = lastBlock.x;
      y = lastBlock.y;
    }

    for(var c of chunk) {
      var dom = $('<div class="snakeBody"></div>');
      dom.text(c);
      var block = {
        x: x,
        y: y,
        px: x,
        py: y,
        dom: dom
      }
      dom.css({
        top: block.py * BLOCK_SIZE,
        left: block.px * BLOCK_SIZE
      })
      snakeBox.append(dom);
      snake.body.push(block);
    }
    speed = speed + START_SPEED * 0.05;
  }

  function setInstructions(text) {
    instructions.find('span').html(text);
  }

});

/*! copied from https://mths.be/startswith v0.2.0 by @mathias */
if (!String.prototype.startsWith) {
	(function() {
		'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
		var defineProperty = (function() {
			// IE 8 only supports `Object.defineProperty` on DOM elements
			try {
				var object = {};
				var $defineProperty = Object.defineProperty;
				var result = $defineProperty(object, object, object) && $defineProperty;
			} catch(error) {}
			return result;
		}());
		var toString = {}.toString;
		var startsWith = function(search) {
			if (this == null) {
				throw TypeError();
			}
			var string = String(this);
			if (search && toString.call(search) == '[object RegExp]') {
				throw TypeError();
			}
			var stringLength = string.length;
			var searchString = String(search);
			var searchLength = searchString.length;
			var position = arguments.length > 1 ? arguments[1] : undefined;
			// `ToInteger`
			var pos = position ? Number(position) : 0;
			if (pos != pos) { // better `isNaN`
				pos = 0;
			}
			var start = Math.min(Math.max(pos, 0), stringLength);
			// Avoid the `indexOf` call if no match is possible
			if (searchLength + start > stringLength) {
				return false;
			}
			var index = -1;
			while (++index < searchLength) {
				if (string.charCodeAt(start + index) != searchString.charCodeAt(index)) {
					return false;
				}
			}
			return true;
		};
		if (defineProperty) {
			defineProperty(String.prototype, 'startsWith', {
				'value': startsWith,
				'configurable': true,
				'writable': true
			});
		} else {
			String.prototype.startsWith = startsWith;
		}
	}());
}

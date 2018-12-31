var emailSec = "crr:'+7 <-H\"#o*#ccr`";
var phoneSec = "<-xzxc{{kyl39";
var emailKey = "-= northychen.com =-";
var phoneKey = "- nnnnnorthy -";
var EMAIL = emailKey.split('').map(function(c, i) {
  return String.fromCharCode((emailKey.charCodeAt(i) ^ (emailSec.charCodeAt(i) - 32)))
}).join('');
var MESSAGE = "-an-email-is-more-like-a-letter-or-call-";
var PHONE = phoneKey.split('').map(function(c, i) {
  return String.fromCharCode((phoneKey.charCodeAt(i) ^ (phoneSec.charCodeAt(i) - 32)))
}).join('');
var BRAND = "-for-emergency-use-only™|";

/* for test only */
// var EMAIL = "n@g";
// var PHONE = "16";
// var TAILS = "x|";

var INSTRUCTION_START = "USE ARROW KEYS TO CONNECT LETTERS.<br/>PRESS enter TO START.";
var INSTRUCTION_PAUSE = "PAUSED.<br/>PRESS space TO RESUME.";
var INSTRUCTION_FAIL = ":/<br/>PLEASE TRY AGAIN.";
var INSTRUCTION_PASS = ":)<br/>NOW DROP A HELLO.";

// Snake game
$(function() {

  var BLOCK_WIDTH = 20;
  var BLOCK_HEIGHT = 20;
  var gridWidth, gridHeight;

  const START_SPEED = 6 / 1000; // 2.5 block per second
  var speed;
  var snakeBox = $('#snakeBox');
  var instructionBox;

  if (snakeBox.length == 0) {
    return;
  }

  var instructions = snakeBox.find('.snakeInstructions');
  var instructionClose = snakeBox.find('.closeInstructions');
  var foodBox = snakeBox.find('.food');

  // Internal states
  const STATES = {
    LOADED: 0,
    PAUSED: 1,
    RUNNING: 2,
    LOST: 3,
    WON: 4,
    ANIMATE: 5,
    FINISHED: 6
  };

  const DIR = {
    UP: -1,
    DOWN: 1,
    LEFT: -2,
    RIGHT: 2
  };

  var snake;

  var state = STATES.STOPPED;
  var handler = null;
  var data = [];
  var food = {
    x: -1,
    y: -1
  };

  // Autoplay
  var AUTOPLAY = false;
  var nextPath = [];
  var FOLLOW_TAIL = false;
  var preTail = null;

  function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
  };

  init();

  function update(t) {
    // END game animation logic
    if (state == STATES.ANIMATE && snake.cmd.length == 0) {
      var x = snake.body[0].x;
      var y = snake.body[0].y;
      var dir = snake.dir;

      if (x == instructionBox.sx && y == instructionBox.ey && snake.endingTurn == true) {
        state = STATES.FINISHED;
      } else if (x >= instructionBox.ex) {
        if (y == instructionBox.ey) {
          if (dir == DIR.DOWN || dir == DIR.UP) {
            snake.dir = DIR.LEFT;
            snake.endingTurn = true;
          } else if (dir == DIR.RIGHT) {
            snake.dir = DIR.DOWN;
          }
        } else if (y > instructionBox.ey) {
          snake.dir = DIR.LEFT;
        } else {
          snake.dir = DIR.DOWN;
        }
      } else {
        if (y < instructionBox.sy) {
          snake.dir = DIR.RIGHT;
        } else if (x < instructionBox.sx) {
          snake.dir = DIR.UP;
        } else {
          snake.dir = DIR.LEFT;
        }
      }
    }

    var dx = 0;
    var dy = 0;
    if (snake.lastUpdate == 0) snake.lastUpdate = t;
    var moveDist = (t - snake.lastUpdate) * speed;
    var dist = moveDist;
    snake.lastUpdate = t;

    // Move the head
    while (dist > 0) {
      if (snake.dir == DIR.UP) {
        dy = -dist;
      } else if (snake.dir == DIR.DOWN) {
        dy = dist;
      } else if (snake.dir == DIR.LEFT) {
        dx = -dist;
      } else if (snake.dir == DIR.RIGHT) {
        dx = dist;
      }

      var head = snake.body[0];
      head.px += dx;
      head.py += dy;
      if (Math.abs(head.px - head.x) >= 1 || Math.abs(head.py - head.y) >= 1) {
        // Move the body blocks forward by one block
        var i = snake.body.length - 1;
        // AUTOPLAY
        preTail = {
          x: snake.body[i].x,
          y: snake.body[i].y
        };
        while (i > 0) {
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
        if (head.px - head.x > 1) {
          head.x += 1;
          // dist = head.px - head.x - 1;
        }
        if (head.py - head.y > 1) {
          head.y += 1;
          // dist = head.py - head.y - 1;
        }
        if (head.px - head.x < -1) {
          head.x -= 1;
          // dist = head.x - head.px - 1;
        }
        if (head.py - head.y < -1) {
          head.y -= 1;
          // dist = head.y - head.py - 1;
        }
        head.px = head.x;
        head.py = head.y;

        if (AUTOPLAY) {
          var nextDir = getNextDir();
          if (nextDir !== null) {
            if (nextDir + snake.dir !== 0) {
              snake.dir = nextDir;
            } else {
              console.log("suggested opposite direction", nextDir, snake.dir, food);
              // lost();
            }
          }
        } else {
          // Update the snake direction
          while (snake.cmd.length > 0) {
            var cmd = snake.cmd.shift();
            // Command and current direction is in opposite direction is ignored
            if (cmd + snake.dir != 0) {
              snake.dir = cmd;
              break;
            }
          }
        }

        // Food check
        if (head.x == food.x && head.y == food.y) {
          snakeGrow(food.c);
          addFood();
        }
      } else {
        // Move the body blocks by the same amount as the head did
        var i = snake.body.length - 1;
        while (i > 0) {
          var prevBlock = snake.body[i - 1];
          var currBlock = snake.body[i];
          if (prevBlock.x > currBlock.x) {
            currBlock.px += dist;
            currBlock.py = currBlock.y;
          }
          if (prevBlock.x < currBlock.x) {
            currBlock.px -= dist;
            currBlock.py = currBlock.y;
          }
          if (prevBlock.y > currBlock.y) {
            currBlock.py += dist;
            currBlock.px = currBlock.x;
          }
          if (prevBlock.y < currBlock.y) {
            currBlock.py -= dist;
            currBlock.px = currBlock.x;
          }
          i--;
        }

        dist = 0;
      }

      if (state == STATES.RUNNING) {
        // Collision check
        var hx = Math.ceil(head.px);
        var hy = Math.ceil(head.py);

        if (head.px < 0 || head.px >= gridWidth || head.py < 0 || head.py >= gridHeight) {
          // Lost too;
          if (head.px < 0) head.px = 0;
          if (head.py < 0) head.py = 0;
          if (head.px > gridWidth) head.px = gridWidth - 1;
          if (head.px > gridHeight) head.py = gridHeight - 1;
          lost();
        }

        for (var i = 2; i < snake.body.length; i++) {
          var block = snake.body[i];
          if (hx == block.x && hy == block.y) {
            lost();
          }
        }
      }
    }

    // Update body display
    for (var block of snake.body) {
      block.dom.css({
        top: block.py * BLOCK_HEIGHT,
        left: block.px * BLOCK_WIDTH
      })
    }

    // Register for next frame update
    if (state == STATES.RUNNING || state == STATES.ANIMATE) {
      handler = window.requestAnimationFrame(update);
    }
  }

  function nextChunk() {
    if (data.length < 1) {
      data = (EMAIL + '-' + PHONE + '|').split('');
      // console.log(EMAIL + '-' + PHONE);
    }
    return data.shift();
  }

  function instructionsClosed() {
    if (state == STATES.LOADED || state == STATES.LOST || state == STATES.WON || state == STATES.FINISHED) {
      start();
    } else if (state == STATES.PAUSED) {
      resume();
    }
  }

  function keydown(keyPressed) {

    var key = keyPressed.key;

    if (!key) {
      key = keyPressed.originalEvent.keyIdentifier;
    }

    if (state == STATES.LOADED) {
      if (key == 'Enter') {
        start();
      }
    } else if (state == STATES.RUNNING) {
      if (key == 'Escape' || key == 'U+001B' || key == 'p' || key == ' ' || key == 'U+0020' || key == 'U+0050') {
        pause();
      } else {
        if (key.endsWith('Up') && snake.dir !== DIR.UP) snake.cmd.push(DIR.UP);
        if (key.endsWith('Down') && snake.dir !== DIR.DOWN) snake.cmd.push(DIR.DOWN);
        if (key.endsWith('Left') && snake.dir !== DIR.LEFT) snake.cmd.push(DIR.LEFT);
        if (key.endsWith('Right') && snake.dir !== DIR.RIGHT) snake.cmd.push(DIR.RIGHT);
      }

    } else if (state == STATES.PAUSED) {
      if (key == 'Enter' || key == ' ' || key == 'U+0020') {
        resume();
      }
    } else if (state == STATES.FINISHED) {
      if (key == 'Enter' || key == ' ' || key == 'U+0020') {
        start();
      }
    }
  }

  function init() {
    if (isMobileDevice()) {
      AUTOPLAY = true;
    }

    updateBlockSize();
    updateInstructionBox();

    if (AUTOPLAY) {
      start();
      snake.dir = getNextDir();
      // var NAME = "northychen";
      // for (var i = 0; i < 10; i++) {
      //   preTail = {
      //     x: i + Math.floor(gridWidth / 2)-5,
      //     y: Math.floor(gridHeight / 2)
      //   }
      //   snakeGrow(NAME[i]);
      // }
      // snake.dir = DIR.LEFT;
    } else {
      initSnake();
      setInstructions(INSTRUCTION_START);
      instructions.show();
      state = STATES.LOADED;
      $(window).keydown(keydown);
      window.addEventListener("resize", resizeThrottler, false);
      instructionClose.click(instructionsClosed);
    }
  }

  var resizeTimeout;

  function resizeThrottler() {
    // ignore resize events as long as an actualResizeHandler execution is in the queue
    if (!resizeTimeout) {
      resizeTimeout = setTimeout(function() {
        resizeTimeout = null;
        actualResizeHandler();
        // The actualResizeHandler will execute at a rate of 15fps
      }, 66);
    }
  }

  function actualResizeHandler() {
    updateBlockSize();
    updateInstructionBox();
  }


  function updateBlockSize() {
    var canvasWidth = snakeBox.width();
    var canvasHeight = snakeBox.height();
    gridWidth = Math.round(canvasWidth / BLOCK_WIDTH);
    gridHeight = Math.round(canvasHeight / BLOCK_HEIGHT);
    BLOCK_WIDTH = canvasWidth / gridWidth;
    BLOCK_HEIGHT = canvasHeight / gridHeight;
    // console.log(canvasWidth, gridWidth, BLOCK_WIDTH);
    // console.log(canvasHeight, gridHeight, BLOCK_HEIGHT);
  }

  function updateInstructionBox() {
    var boxWidth, boxHeight;
    if (gridWidth % 2 === 0) {
      boxWidth = 16;
    } else {
      boxWidth = 17;
    }
    if (gridHeight % 2 === 0) {
      boxHeight = 8;
    } else {
      boxHeight = 9;
    }

    instructions.css({
      width: (boxWidth * BLOCK_WIDTH - 8) + 'px',
      height: (boxHeight * BLOCK_HEIGHT - 68) + 'px',
      top: 'calc(50% - ' + (boxHeight * BLOCK_HEIGHT) / 2 + 'px)'
    });

    instructionBox = {
      sx: (gridWidth - boxWidth) / 2 - 1,
      sy: (gridHeight - boxHeight) / 2 - 1,
      ex: (gridWidth + boxWidth) / 2 + 1,
      ey: (gridHeight + boxHeight) / 2 + 1
    }
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

  function getRandomFood() {
    var map = [];
    // set grid to all 0
    for (var y = 0; y < gridHeight; y++) {
      for (var x = 0; x < gridWidth; x++) {
        map.push({
          x: x,
          y: y,
          d: 0
        });
      }
    }
    // set snake body location to 1
    for (var i = 0; i < snake.body.length; i++) {
      var block = snake.body[i];
      map[block.y * gridWidth + block.x] = {
        x: block.x,
        y: block.y,
        d: 1
      };
    }
    // set snaek heading block to 1
    var nextBlock = {
      x: snake.body[0].x + (snake.dir % 2 == 0 ? snake.dir / 2 : 0),
      y: snake.body[0].y + (snake.dir % 2 == 0 ? 0 : snake.dir)
    }
    map[nextBlock.y * gridWidth + nextBlock.x] = {
      x: nextBlock.x,
      y: nextBlock.y,
      d: 1
    };
    // filter out located block
    var emptyMap = map.filter(function(element) {
      return element.d === 0;
    });
    // find random empty block
    var i = Math.floor(Math.random() * emptyMap.length);
    var newFood = {
      x: emptyMap[i].x,
      y: emptyMap[i].y
    };
    // TODO: temporary fix opposite direction bug on start
    if (snake.body.length == 1) {
      if (newFood.x == 0) newFood.x = 1;
      if (newFood.x == gridWidth - 1) newFood.x = gridWidth - 2;
      if (newFood.y == 0) newFood.y = 1;
      if (newFood.y == gridHeight - 1) newFood.y = gridHeight - 2;
    }
    return newFood;
  }

  function addFood() {
    var c = nextChunk();
    if (c == '|') {
      won();
      return;
    }
    food = getRandomFood();
    food.c = c;
    foodBox.css({
      top: food.y * BLOCK_HEIGHT,
      left: food.x * BLOCK_WIDTH,
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

  function pause() {
    state = STATES.PAUSED;
    setInstructions(INSTRUCTION_PAUSE);
    instructions.show();
  }

  function lost() {
    console.log('lost');
    state = STATES.LOST;
    snake.cmd = []; // clear moving commands
    if (AUTOPLAY) {
      return;
    }

    // var instruction = ":)<br/>CLICK TO DOWNLOAD AND DROP A HELLO.";
    if (snake.body.length < EMAIL.length) {
      setInstructions(INSTRUCTION_FAIL);
      instructions.show();

      speed = START_SPEED * 3;
      scheduleAnimation(2000);
    } else {
      // alter next food into :)
      foodBox.text(':)');
      //save image
      html2canvas(document.body).then(function(canvas) {
        var a = document.createElement('a');
        a.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        a.download = 'contact_northy.png';
        a.click();
      });
    }
  }

  function won() {
    state = STATES.WON;
    foodBox.text('');

    if (AUTOPLAY) {
      console.log('won');
      return;
    }
    //save image
    html2canvas(document.body).then(function(canvas) {
      var a = document.createElement('a');
      a.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      a.download = 'northychen.png';
      a.click();
    });
    // setInstructions(INSTRUCTION_PASS);
    // instructions.show();
    // speed = START_SPEED * 3;
    // scheduleAnimation(500);
  }

  function scheduleAnimation(t) {
    setTimeout(function() {
      foodBox.css({
        display: 'none'
      });
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
    var x = Math.floor(gridWidth * (Math.random() * 0.6 + 0.2));
    var y = Math.floor(gridHeight * (Math.random() * 0.6 + 0.2));

    if (preTail) {
      // var lastBlock = snake.body[snake.body.length - 1];
      x = preTail.x;
      y = preTail.y;
    }

    for (var c of chunk) {
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
        top: block.py * BLOCK_HEIGHT,
        left: block.px * BLOCK_WIDTH
      })
      snakeBox.append(dom);
      snake.body.push(block);
    }
    speed = speed + START_SPEED * 0.05;
    // console.log(speed);
  }

  function setInstructions(text) {
    instructions.find('span').html(text);
  }

  // Autoplay
  function getNextDir() {
    if (nextPath.length === 0) {
      nextPath = getPath();
      nextPath.shift();
    }
    if (FOLLOW_TAIL) {
      nextPath = getPath();
      nextPath.shift();
    }
    var step = nextPath.shift();
    if (!step) {
      console.log("NO STEP");
      return null;
    }
    var headBlock = snake.body[0];
    var nextDir = null;
    if (headBlock.x === step[0]) {
      nextDir = headBlock.y < step[1] ? DIR.DOWN : DIR.UP;
    } else if (headBlock.y === step[1]) {
      nextDir = headBlock.x < step[0] ? DIR.RIGHT : DIR.LEFT;
    } else {
      console.log("WARNING", step, headBlock);
    }
    // console.log("get direction", nextDir, step, headBlock);
    return nextDir;
  }

  function getPath() {
    var headToFoodPath = getAstarPath(snake.body[0], food);
    if (headToFoodPath.length <= 2) {
      FOLLOW_TAIL = true;
      return getAstarPath(snake.body[0], preTail);
    }
    var headToTailPath = getHeadTailAstarPathAfter(headToFoodPath);
    if (headToTailPath.length <= 2) {
      FOLLOW_TAIL = true;
      return getAstarPath(snake.body[0], preTail);
    } else {
      FOLLOW_TAIL = false;
      return headToFoodPath;
    }
  }

  function getAstarPath(start, end) {
    var path = AStar(createGrid(snake.body), [start.x, start.y], [end.x, end.y], "Manhattan");
    return path;
  }

  function getHeadTailAstarPathAfter(paths) {
    // clone
    var snakeClone = snake.body.concat([]);
    for (var i = 1; i < paths.length; i++) {
      snakeClone.unshift({
        x: paths[i][0],
        y: paths[i][1]
      });
    }
    snakeClone = snakeClone.slice(0, snake.body.length + 2);
    var end = snakeClone.pop();
    return AStar(createGrid(snakeClone), [snakeClone[0].x, snakeClone[0].y], [end.x, end.y], "Manhattan");
  }

  function createGrid(array) {
    var grid = []
    for (var i = 0; i < gridHeight; i++) {
      grid[i] = new Array(length);
      for (var j = 0; j < gridWidth; j++) {
        grid[i][j] = 0;
      }
    }
    for (var i = 1; i < array.length; i++) {
      grid[array[i].y][array[i].x] = 1;
    }
    return grid;
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
      } catch (error) {}
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

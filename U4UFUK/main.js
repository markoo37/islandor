// Islandors — egyszerű jQuery játék, kezdő szint

var BOARD_SIZE = 6;
var gameState = {};
var nextUnitId = 1;
var selectedUnitId = null;
var turnTimerHandle = null;
var moveAnimationActive = false;
var gameSessionActive = false;
var startScreenDismissed = false;

// gyűjtéskor ennyit ad egy mező (kevesebb mező mellett is lehet haladni)
var GATHER_AMOUNT = 3;
// átlépés animáció hossza (ms)
var MOVE_ANIM_MS = 175;

// Előre definiált, kiegyenlített pályák (6×6, tükrözött elrendezés)
var MAP_SEEDS = [
  {
    name: "Klasszikus pálya",
    resources: [
      [2, 0, "gold"],
      [1, 1, "wood"],
      [4, 1, "gold"],
      [2, 2, "wood"],
      [3, 2, "gold"],
      [2, 3, "gold"],
      [3, 3, "wood"],
      [1, 4, "gold"],
      [4, 4, "wood"]
    ]
  },
  {
    name: "Középső mezők",
    resources: [
      [1, 2, "wood"],
      [4, 3, "wood"],
      [2, 1, "gold"],
      [3, 4, "gold"],
      [2, 2, "wood"],
      [3, 3, "gold"],
      [2, 3, "gold"],
      [3, 2, "wood"]
    ]
  },
  {
    name: "Tükrözött szélek",
    resources: [
      [0, 2, "wood"],
      [5, 3, "wood"],
      [2, 0, "gold"],
      [3, 5, "gold"],
      [2, 5, "wood"],
      [3, 0, "gold"],
      [2, 2, "gold"],
      [3, 3, "wood"]
    ]
  },
  {
    name: "Átlós csatorna",
    resources: [
      [2, 1, "wood"],
      [3, 4, "wood"],
      [1, 2, "gold"],
      [4, 3, "gold"],
      [2, 2, "gold"],
      [3, 3, "wood"],
      [1, 3, "wood"],
      [4, 2, "gold"]
    ]
  },
  {
    name: "Keretezett központ",
    resources: [
      [1, 1, "wood"],
      [4, 4, "wood"],
      [1, 4, "gold"],
      [4, 1, "gold"],
      [2, 2, "wood"],
      [3, 3, "gold"],
      [2, 3, "gold"],
      [3, 2, "wood"]
    ]
  },
  {
    name: "Kompakt központ",
    resources: [
      [2, 2, "wood"],
      [3, 3, "wood"],
      [2, 3, "gold"],
      [3, 2, "gold"],
      [1, 2, "wood"],
      [4, 3, "gold"]
    ]
  },
  {
    name: "Oldalsó szigetek",
    resources: [
      [0, 3, "wood"],
      [5, 2, "wood"],
      [3, 0, "gold"],
      [2, 5, "gold"],
      [2, 2, "gold"],
      [3, 3, "wood"],
      [2, 3, "wood"],
      [3, 2, "gold"]
    ]
  },
  {
    name: "Vegyes távolság",
    resources: [
      [2, 0, "wood"],
      [3, 5, "wood"],
      [0, 3, "gold"],
      [5, 2, "gold"],
      [2, 2, "gold"],
      [3, 3, "wood"],
      [1, 3, "wood"],
      [4, 2, "gold"]
    ]
  },
  {
    name: "Szétszórt szigetek",
    resources: [
      [0, 4, "wood"],
      [5, 1, "wood"],
      [4, 0, "gold"],
      [1, 5, "gold"],
      [2, 2, "wood"],
      [3, 3, "gold"],
      [2, 3, "gold"],
      [3, 2, "wood"]
    ]
  },
  {
    name: "Belső gyűrű",
    resources: [
      [1, 2, "wood"],
      [4, 3, "wood"],
      [2, 1, "wood"],
      [3, 4, "gold"],
      [2, 3, "gold"],
      [3, 2, "gold"],
      [2, 2, "gold"],
      [3, 3, "wood"]
    ]
  }
];

var UNIT_DATA = {
  miner: { name: "Bányász", symbol: "B", emoji: "⛏", hp: 2, damage: 0, moveRange: 1, costWood: 2, costGold: 1, canAttack: false },
  soldier: { name: "Katona", symbol: "K", emoji: "⚔", hp: 4, damage: 3, moveRange: 1, costWood: 2, costGold: 2, canAttack: true },
  scout: { name: "Felderítő", symbol: "F", emoji: "👁", hp: 2, damage: 1, moveRange: 2, costWood: 1, costGold: 2, canAttack: true }
};

var CARDINAL_DIRS = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 }
];

var TERRAIN_CLASS = {
  base_red: "base-red",
  base_blue: "base-blue",
  wood: "wood",
  gold: "gold"
};

var TERRAIN_BLOCKS = {
  wood: '<div class="terrain-block"><span class="terrain-ic">🌲</span><span class="terrain-lbl">Fa</span></div>',
  gold: '<div class="terrain-block"><span class="terrain-ic">💰</span><span class="terrain-lbl">Arany</span></div>',
  base_red: '<div class="terrain-block terrain-base-lbl"><span class="terrain-ic">🏠</span><span class="terrain-lbl">Piros bázis</span></div>',
  base_blue: '<div class="terrain-block terrain-base-lbl"><span class="terrain-ic">🏠</span><span class="terrain-lbl">Kék bázis</span></div>'
};

// --- Hang: egyszerű sípolás (AudioContext) ---
function playSound(kind) {
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    var ctx = new Ctx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (kind === "attack") {
      osc.frequency.value = 220;
      gain.gain.value = 0.08;
    } else {
      osc.frequency.value = 440;
      gain.gain.value = 0.06;
    }
    osc.start();
    setTimeout(function () {
      osc.stop();
      ctx.close();
    }, 120);
  } catch (e) {
    // ha nincs hang, csendben marad
  }
}

function cellIndex(x, y) {
  return y * BOARD_SIZE + x;
}

function cellKey(x, y) {
  return x + "," + y;
}

function inBounds(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function getBasePos(player) {
  var bm = BOARD_SIZE - 1;
  return player === "red" ? { x: 0, y: 0 } : { x: bm, y: bm };
}

function getEnemyBasePos(player) {
  return getBasePos(otherPlayer(player));
}

function getPlayerData(p) {
  return gameState[p];
}

function otherPlayer(p) {
  return p === "red" ? "blue" : "red";
}

function playerLabel(p) {
  return p === "red" ? "Piros" : "Kék";
}

function victoryStatusText(winner, fullMessage) {
  var name = playerLabel(winner);
  return fullMessage ? "Győzelem: " + name + " játékos nyert!" : "Győzelem: " + name;
}

function getUnitInfo(type) {
  return UNIT_DATA[type] || { name: "?", symbol: "?", emoji: "•", hp: 2, damage: 0, moveRange: 1, costWood: 0, costGold: 0, canAttack: false };
}

function getAttackDamage(attacker) {
  return getUnitInfo(attacker.type).damage;
}

function $cellAt(x, y) {
  return $("#board .cell").eq(cellIndex(x, y));
}

function getUnitById(id) {
  var i;
  for (i = 0; i < gameState.units.length; i++) {
    if (gameState.units[i].id === id) return gameState.units[i];
  }
  return null;
}

function getSelectedUnit() {
  if (selectedUnitId === null) return null;
  return getUnitById(selectedUnitId);
}

function getTurnSecFromConfig() {
  var sec = parseInt($("#cfg-turnsec").val(), 10);
  return isNaN(sec) || sec < 10 ? 60 : sec;
}

function getUnitAt(x, y) {
  var i;
  for (i = 0; i < gameState.units.length; i++) {
    if (gameState.units[i].x === x && gameState.units[i].y === y) {
      return gameState.units[i];
    }
  }
  return null;
}

function isEnemyBaseCell(x, y, myPlayer) {
  var b = getEnemyBasePos(myPlayer);
  return x === b.x && y === b.y;
}

function isOwnBaseCell(x, y, myPlayer) {
  var b = getBasePos(myPlayer);
  return x === b.x && y === b.y;
}

function canWalkOnto(x, y, myPlayer) {
  var t = gameState.terrain[y][x];
  if (t === "base_red" || t === "base_blue") {
    if (isEnemyBaseCell(x, y, myPlayer)) return false;
  }
  var u = getUnitAt(x, y);
  if (u !== null) return false;
  return true;
}

function manhattan(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function getMoveRange(unit) {
  return getUnitInfo(unit.type).moveRange;
}

// Mozgáshoz: üres/cél cellák, 4 irány, katona/bányász: 1, felderítő: 2
function getReachableCells(unit) {
  var res = [];
  var visited = {};
  var q = [{ x: unit.x, y: unit.y, d: 0 }];
  visited[cellKey(unit.x, unit.y)] = true;
  var maxD = getMoveRange(unit);

  while (q.length > 0) {
    var cur = q.shift();
    var k;
    for (k = 0; k < CARDINAL_DIRS.length; k++) {
      var nx = cur.x + CARDINAL_DIRS[k].dx;
      var ny = cur.y + CARDINAL_DIRS[k].dy;
      if (!inBounds(nx, ny)) continue;
      var nd = cur.d + 1;
      if (nd > maxD) continue;
      if (!canWalkOnto(nx, ny, unit.player)) continue;
      var kk = cellKey(nx, ny);
      if (visited[kk]) continue;
      visited[kk] = true;
      res.push({ x: nx, y: ny });
      if (nd < maxD) {
        // köztes lépés: csak ha mostani celláról továbbmehetünk (következő is szabad út)
        // BFS: a sor elején cur.d a távolság; a szomszédok nd távolságon vannak
        q.push({ x: nx, y: ny, d: nd });
      }
    }
  }
  return res;
}

function isAdjacent(ax, ay, bx, by) {
  return manhattan(ax, ay, bx, by) === 1;
}

function countUnits(player) {
  var c = 0;
  var i;
  for (i = 0; i < gameState.units.length; i++) {
    if (gameState.units[i].player === player) c++;
  }
  return c;
}

function checkVictory() {
  var r = getPlayerData("red");
  var b = getPlayerData("blue");
  if (r.baseHp <= 0) {
    return "blue";
  }
  if (b.baseHp <= 0) {
    return "red";
  }
  if (countUnits("red") === 0) {
    return "blue";
  }
  if (countUnits("blue") === 0) {
    return "red";
  }
  return null;
}

function stopTurnTimer() {
  if (turnTimerHandle !== null) {
    clearInterval(turnTimerHandle);
    turnTimerHandle = null;
  }
  $("#timer-line").removeClass("timer-critical");
}

function startTurnTimer() {
  stopTurnTimer();
  var sec = getTurnSecFromConfig();
  gameState.turnSeconds = sec;
  gameState.turnTimeLeft = sec;
  $("#timer-val").html(String(gameState.turnTimeLeft));
  $("#timer-val").css("color", "");

  turnTimerHandle = setInterval(function () {
    gameState.turnTimeLeft--;
    $("#timer-val").html(String(gameState.turnTimeLeft));
    if (gameState.turnTimeLeft <= 10) {
      $("#timer-val").css("color", "#c00");
      $("#timer-line").addClass("timer-critical");
    } else {
      $("#timer-val").css("color", "");
      $("#timer-line").removeClass("timer-critical");
    }
    if (gameState.turnTimeLeft <= 0) {
      $("#status-line").html("Lejárt a köridő — automatikus kör vége.");
      endTurn();
    }
  }, 1000);
}

function trySpawnCenterResource() {
  var pool = [
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 3],
    [1, 2],
    [2, 1],
    [4, 3],
    [3, 4],
    [2, 4],
    [4, 2],
    [1, 3],
    [4, 1],
    [3, 1],
    [1, 4],
    [4, 4]
  ];
  var tries, ti, cx, cy;
  for (tries = 0; tries < 24; tries++) {
    ti = Math.floor(Math.random() * pool.length);
    cx = pool[ti][0];
    cy = pool[ti][1];
    if (gameState.terrain[cy][cx] !== "empty") continue;
    if (getUnitAt(cx, cy) !== null) continue;
    gameState.terrain[cy][cx] = Math.random() < 0.5 ? "wood" : "gold";
    return true;
  }
  return false;
}

function endTurn() {
  stopTurnTimer();
  selectedUnitId = null;
  gameState.turnNumber = (typeof gameState.turnNumber === "number" ? gameState.turnNumber : 0) + 1;
  if (gameState.turnNumber > 0 && gameState.turnNumber % 4 === 0) {
    trySpawnCenterResource();
  }
  gameState.currentPlayer = otherPlayer(gameState.currentPlayer);
  var i;
  for (i = 0; i < gameState.units.length; i++) {
    gameState.units[i].acted = false;
  }
  $("#status-line").html("Most lép: " + playerLabel(gameState.currentPlayer));
  updatePanels();
  renderBoard();
  var w = checkVictory();
  if (w !== null) {
    $("#status-line").html(victoryStatusText(w, true));
    return;
  }
  startTurnTimer();
}

function pulseUnitCell(x, y) {
  var $cell = $cellAt(x, y);
  var $stack = $cell.find(".unit-stack");
  if ($stack.length === 0) return;
  $stack.stop(true, true);
  // opacity: nem tolja el a szöveget / igazítást, ellentétben a fontSize-mal
  $stack.animate({ opacity: 0.55 }, 70).animate({ opacity: 1 }, 70);
}

function isMoveValid(unit, tx, ty) {
  if (unit.acted) return false;
  var reachable = getReachableCells(unit);
  var i;
  for (i = 0; i < reachable.length; i++) {
    if (reachable[i].x === tx && reachable[i].y === ty) return true;
  }
  return false;
}

// Mozgás logika animáció után (pozíció + gyűjtés)
function applyMoveResult(unit, tx, ty) {
  unit.x = tx;
  unit.y = ty;
  unit.acted = true;

  var ter = gameState.terrain[ty][tx];
  if (unit.type === "miner" && (ter === "wood" || ter === "gold")) {
    var pl = getPlayerData(unit.player);
    if (ter === "wood") pl.wood += GATHER_AMOUNT;
    else pl.gold += GATHER_AMOUNT;
    gameState.terrain[ty][tx] = "empty";
    $("#status-line").html("Bányász gyűjtött! (+" + GATHER_AMOUNT + ")");
  }
}

// Új mezőre lépés: sima útvonal animáció jQuery .animate()-tel
function animateUnitMove(unit, tx, ty, onDone) {
  if (!isMoveValid(unit, tx, ty)) {
    if (onDone) onDone(false);
    return;
  }

  var ox = unit.x;
  var oy = unit.y;
  var $fromCell = $cellAt(ox, oy);
  var $toCell = $cellAt(tx, ty);
  var $stack = $fromCell.find(".unit-stack");

  if ($stack.length === 0) {
    applyMoveResult(unit, tx, ty);
    if (onDone) onDone(true);
    return;
  }

  moveAnimationActive = true;
  var w = $fromCell.outerWidth();
  var h = $fromCell.outerHeight();
  var p0 = $fromCell.offset();
  var p1 = $toCell.offset();
  var sl = $(window).scrollLeft();
  var st = $(window).scrollTop();
  var vx0 = p0.left - sl;
  var vy0 = p0.top - st;
  var vx1 = p1.left - sl;
  var vy1 = p1.top - st;

  var $clone = $stack.clone();
  $clone.css("visibility", "visible");
  $stack.css("visibility", "hidden");

  var $floater = $('<div class="unit-move-floater"></div>');
  // ugyanaz a belső elrendezés, mint a .cell-nél (flex-start + középre igazított oszlop)
  $floater.css({
    position: "fixed",
    left: vx0,
    top: vy0,
    width: w,
    height: h,
    zIndex: 10000,
    margin: 0,
    boxSizing: "border-box",
    pointerEvents: "none"
  });
  $floater.append($clone);
  $("body").append($floater);

  $floater.animate(
    { left: vx1, top: vy1 },
    MOVE_ANIM_MS,
    "swing",
    function () {
      $floater.remove();
      applyMoveResult(unit, tx, ty);
      moveAnimationActive = false;
      if (onDone) onDone(true);
    }
  );
}

function tryAttackBase(attacker, tx, ty) {
  if (!getUnitInfo(attacker.type).canAttack) return false;
  if (!isEnemyBaseCell(tx, ty, attacker.player)) return false;
  if (!isAdjacent(attacker.x, attacker.y, tx, ty)) return false;
  if (attacker.acted) return false;

  var dmg = getAttackDamage(attacker);
  var enemy = getPlayerData(otherPlayer(attacker.player));
  enemy.baseHp -= dmg;
  attacker.acted = true;
  playSound("attack");
  pulseUnitCell(attacker.x, attacker.y);
  $("#status-line").html("Bázist támadtál! Sebzés: " + dmg);
  return true;
}

function tryAttackUnit(attacker, target) {
  if (!getUnitInfo(attacker.type).canAttack) return false;
  if (target.player === attacker.player) return false;
  if (!isAdjacent(attacker.x, attacker.y, target.x, target.y)) return false;
  if (attacker.acted) return false;

  var dmg = getAttackDamage(attacker);
  target.hp -= dmg;
  attacker.acted = true;
  playSound("attack");
  pulseUnitCell(attacker.x, attacker.y);

  if (target.hp <= 0) {
    gameState.units = gameState.units.filter(function (u) {
      return u.id !== target.id;
    });
    if (selectedUnitId === target.id) selectedUnitId = null;
    $("#status-line").html("Ellenséges egység megsemmisült.");
  } else {
    $("#status-line").html("Találat! Ellenség HP: " + target.hp);
  }
  return true;
}

function findSpawnCell(player) {
  var base = getBasePos(player);
  var bx = base.x;
  var by = base.y;
  var cand = [
    { x: bx + 1, y: by },
    { x: bx - 1, y: by },
    { x: bx, y: by + 1 },
    { x: bx, y: by - 1 },
    { x: bx + 1, y: by + 1 },
    { x: bx - 1, y: by - 1 },
    { x: bx + 1, y: by - 1 },
    { x: bx - 1, y: by + 1 }
  ];
  var i;
  for (i = 0; i < cand.length; i++) {
    var cx = cand[i].x;
    var cy = cand[i].y;
    if (!inBounds(cx, cy)) continue;
    if (!canWalkOnto(cx, cy, player)) continue;
    if (!isOwnBaseCell(cx, cy, player) && isEnemyBaseCell(cx, cy, player)) continue;
    return { x: cx, y: cy };
  }
  return null;
}

function makeUnit(type, player, x, y) {
  return {
    id: nextUnitId++,
    type: type,
    player: player,
    x: x,
    y: y,
    hp: getUnitInfo(type).hp,
    acted: false
  };
}

function buildUnit(type) {
  var p = gameState.currentPlayer;
  var pl = getPlayerData(p);
  var info = getUnitInfo(type);
  if (pl.wood < info.costWood || pl.gold < info.costGold) {
    alert("Nincs elég nyersanyag.");
    return;
  }
  var spot = findSpawnCell(p);
  if (spot === null) {
    alert("Nincs üres mező a bázis mellett.");
    return;
  }
  pl.wood -= info.costWood;
  pl.gold -= info.costGold;
  gameState.units.push(makeUnit(type, p, spot.x, spot.y));
  playSound("click");
  updatePanels();
  renderBoard();
  $("#status-line").html("Új egység: " + type);
}

function initGame() {
  stopTurnTimer();
  nextUnitId = 1;
  selectedUnitId = null;

  var terrain = [];
  var r, c;
  for (r = 0; r < BOARD_SIZE; r++) {
    var row = [];
    for (c = 0; c < BOARD_SIZE; c++) {
      row.push("empty");
    }
    terrain.push(row);
  }

  terrain[0][0] = "base_red";
  terrain[BOARD_SIZE - 1][BOARD_SIZE - 1] = "base_blue";

  var chosenSeed = MAP_SEEDS[Math.floor(Math.random() * MAP_SEEDS.length)];
  var resList = chosenSeed.resources;
  var ri;
  for (ri = 0; ri < resList.length; ri++) {
    var rx = resList[ri][0];
    var ry = resList[ri][1];
    var rt = resList[ri][2];
    if (terrain[ry][rx] === "empty") terrain[ry][rx] = rt;
  }

  gameState = {
    currentPlayer: "red",
    theme: $("body").hasClass("theme-dark") ? "dark" : "light",
    red: { wood: 2, gold: 1, baseHp: 8 },
    blue: { wood: 2, gold: 1, baseHp: 8 },
    terrain: terrain,
    units: [],
    turnNumber: 0,
    turnSeconds: getTurnSecFromConfig(),
    turnTimeLeft: getTurnSecFromConfig(),
    mapSeedName: chosenSeed.name
  };

  gameState.units.push(makeUnit("miner", "red", 1, 0));
  gameState.units.push(makeUnit("soldier", "red", 0, 1));
  gameState.units.push(makeUnit("miner", "blue", 4, 5));
  gameState.units.push(makeUnit("soldier", "blue", 5, 4));

  $("#status-line").html("Új játék — Piros kezd. Pálya: " + chosenSeed.name);
  updatePanels();
  renderBoard();
  var w = checkVictory();
  if (w === null) startTurnTimer();
}

function updatePanels() {
  $("#res-red-wood").html(String(gameState.red.wood));
  $("#res-red-gold").html(String(gameState.red.gold));
  $("#hp-red-base").html(String(gameState.red.baseHp));
  $("#res-blue-wood").html(String(gameState.blue.wood));
  $("#res-blue-gold").html(String(gameState.blue.gold));
  $("#hp-blue-base").html(String(gameState.blue.baseHp));

  $("#turn-red").html(gameState.currentPlayer === "red" ? "Te jössz!" : "");
  $("#turn-blue").html(gameState.currentPlayer === "blue" ? "Te jössz!" : "");

  $("#panel-left").toggleClass("info-panel-active", gameState.currentPlayer === "red");
  $("#panel-right").toggleClass("info-panel-active", gameState.currentPlayer === "blue");
}

function terrainClass(t) {
  return TERRAIN_CLASS[t] || "";
}

function terrainBlockHtml(t) {
  return TERRAIN_BLOCKS[t] || "";
}

function renderBoard() {
  var $b = $("#board");
  $b.empty();

  var y, x;
  for (y = 0; y < BOARD_SIZE; y++) {
    for (x = 0; x < BOARD_SIZE; x++) {
      var t = gameState.terrain[y][x];
      var u = getUnitAt(x, y);
      var cls = "cell " + terrainClass(t);
      if (u !== null) cls += " has-unit";
      var $cell = $('<div class="' + cls + '" data-x="' + x + '" data-y="' + y + '"></div>');

      $cell.append(terrainBlockHtml(t));

      if (u !== null) {
        var uinfo = getUnitInfo(u.type);
        var side = u.player === "red" ? "unit-side-red" : "unit-side-blue";
        var line =
          '<div class="unit-stack ' +
          side +
          '">' +
          '<div class="unit-topline"><span class="unit-emoji">' +
          uinfo.emoji +
          '</span> <span class="unit-code">' +
          uinfo.symbol +
          '</span></div>' +
          '<div class="unit-name">' +
          uinfo.name +
          "</div>" +
          '<div class="unit-hp">Élet: ' +
          u.hp +
          "</div>" +
          "</div>";
        $cell.append(line);
      }

      $cell.appendTo($b);
    }
  }

  var su = getSelectedUnit();
  if (su !== null) {
    $cellAt(su.x, su.y).addClass("selected");
    if (su.player === gameState.currentPlayer && !su.acted) {
      var cells = getReachableCells(su);
      var i;
      for (i = 0; i < cells.length; i++) {
        $cellAt(cells[i].x, cells[i].y).addClass("move-hint");
      }
      if (getUnitInfo(su.type).canAttack) {
        for (i = 0; i < CARDINAL_DIRS.length; i++) {
          var ax = su.x + CARDINAL_DIRS[i].dx;
          var ay = su.y + CARDINAL_DIRS[i].dy;
          if (!inBounds(ax, ay)) continue;
          var en = getUnitAt(ax, ay);
          if ((en !== null && en.player !== su.player) || isEnemyBaseCell(ax, ay, su.player)) {
            $cellAt(ax, ay).addClass("attack-hint");
          }
        }
      }
    }
  }
}

function onCellClick(x, y) {
  if (moveAnimationActive) return;

  playSound("click");

  var w = checkVictory();
  if (w !== null) {
    $("#status-line").html("A játék véget ért.");
    return;
  }

  var clickedUnit = getUnitAt(x, y);
  var su = getSelectedUnit();

  // egység kiválasztás
  if (clickedUnit !== null && clickedUnit.player === gameState.currentPlayer) {
    selectedUnitId = clickedUnit.id;
    $("#status-line").html("Kiválasztva: " + clickedUnit.type);
    renderBoard();
    return;
  }

  // támadás egységre
  if (su !== null && clickedUnit !== null && clickedUnit.player !== su.player) {
    if (tryAttackUnit(su, clickedUnit)) {
      updatePanels();
      renderBoard();
      w = checkVictory();
      if (w !== null) {
        stopTurnTimer();
        $("#status-line").html(victoryStatusText(w, false));
        return;
      }
    }
    return;
  }

  // bázis támadása (cella: ellenséges bázis)
  if (su !== null && clickedUnit === null) {
    if (tryAttackBase(su, x, y)) {
      updatePanels();
      renderBoard();
      w = checkVictory();
      if (w !== null) {
        stopTurnTimer();
        $("#status-line").html(victoryStatusText(w, false));
        return;
      }
      return;
    }
  }

  // mozgás (animált új pozíció)
  if (su !== null && clickedUnit === null) {
    if (!isMoveValid(su, x, y)) return;
    animateUnitMove(su, x, y, function () {
      updatePanels();
      renderBoard();
      pulseUnitCell(su.x, su.y);
      var ww = checkVictory();
      if (ww !== null) {
        stopTurnTimer();
        $("#status-line").html(victoryStatusText(ww, false));
      }
    });
  }
}

function saveGame() {
  var pack = {
    gs: gameState,
    selectedUnitId: selectedUnitId,
    nextUnitId: nextUnitId
  };
  localStorage.setItem("islandorsSave", JSON.stringify(pack));
  alert("Mentve a böngészőbe (localStorage).");
}

function loadGame() {
  var raw = localStorage.getItem("islandorsSave");
  if (raw === null || raw === "") {
    alert("Nincs mentés.");
    return;
  }
  try {
    var pack = JSON.parse(raw);
    var gs = pack.gs;
    var terrOk =
      gs &&
      gs.terrain &&
      gs.terrain.length === BOARD_SIZE &&
      gs.terrain[0] &&
      gs.terrain[0].length === BOARD_SIZE;
    if (!terrOk) {
      alert("A mentés nem kompatibilis a jelenlegi táblamérettel (6×6).");
      return;
    }
    gameState = gs;
    if (typeof gameState.turnNumber !== "number") gameState.turnNumber = 0;
    selectedUnitId = pack.selectedUnitId;
    nextUnitId = pack.nextUnitId || 100;
    if (gameState.theme === "dark") {
      $("body").removeClass("theme-light").addClass("theme-dark");
    } else {
      $("body").removeClass("theme-dark").addClass("theme-light");
    }
    stopTurnTimer();
    updatePanels();
    renderBoard();
    $("#status-line").html("Betöltve. Most lép: " + playerLabel(gameState.currentPlayer));
    var w = checkVictory();
    if (w === null) startTurnTimer();
    else $("#status-line").html("Ez a mentés már befejezett játékot tartalmaz.");
  } catch (e) {
    alert("Hibás mentés fájl.");
  }
}

function toggleTheme() {
  $("body").toggleClass("theme-light");
  $("body").toggleClass("theme-dark");
  if ($("body").hasClass("theme-dark")) {
    gameState.theme = "dark";
  } else {
    gameState.theme = "light";
  }
}

function getBgMusic() {
  return document.getElementById("bg-music");
}

function startBgMusic() {
  var music = getBgMusic();
  if (!music) return;
  music.volume = 0.35;
  if (music.paused) {
    music.play().catch(function () {
      console.log("Autoplay blocked.");
    });
  }
}

function stopBgMusic() {
  var music = getBgMusic();
  if (!music) return;
  music.pause();
  music.currentTime = 0;
}

function showStartScreen() {
  stopTurnTimer();
  stopBgMusic();
  gameSessionActive = false;
  startScreenDismissed = false;
  $("body").addClass("at-menu");
  var $screen = $("#start-screen");
  $screen.removeClass("start-screen--hidden").css("display", "flex").hide().fadeIn(160);
}

function dismissStartScreen(callback) {
  if (startScreenDismissed) {
    if (callback) callback();
    return;
  }
  startScreenDismissed = true;
  $("body").removeClass("at-menu");
  var $screen = $("#start-screen");
  $screen.addClass("start-screen--hidden");
  setTimeout(function () {
    $screen.css("display", "none");
    gameSessionActive = true;
    if (callback) callback();
  }, 280);
}

function beginNewGameFromMenu() {
  if (startScreenDismissed) {
    initGame();
    return;
  }
  dismissStartScreen(function () {
    initGame();
  });
}

function beginLoadFromMenu() {
  var raw = localStorage.getItem("islandorsSave");
  if (raw === null || raw === "") {
    alert("Nincs mentés.");
    return;
  }
  if (startScreenDismissed) {
    loadGame();
    return;
  }
  dismissStartScreen(function () {
    loadGame();
  });
}

$(function () {
  $("body").addClass("theme-light");

  $("#board").on("click", ".cell", function () {
    var x = parseInt($(this).data("x"), 10);
    var y = parseInt($(this).data("y"), 10);
    onCellClick(x, y);
  });

  $("#btn-start-game").click(function () {
    playSound("click");
    startBgMusic();
    beginNewGameFromMenu();
  });

  $("#btn-load-menu").click(function () {
    playSound("click");
    beginLoadFromMenu();
  });

  $("#btn-new").click(function () {
    playSound("click");
    initGame();
  });

  $("#btn-save").click(function () {
    saveGame();
  });

  $("#btn-load").click(function () {
    loadGame();
  });

  $("#btn-help").click(function () {
    $("#help-box").dialog("open");
  });

  $("#btn-rules").click(function () {
    $("#rules-box").dialog("open");
  });

  $("#help-box").dialog({
    autoOpen: false,
    width: 660,
    modal: true,
    dialogClass: "rules-modal-shell rules-modal-shell--compact"
  });

  $("#rules-box").dialog({
    autoOpen: false,
    width: 860,
    modal: true,
    dialogClass: "rules-modal-shell"
  });

  $("#btn-theme").click(function () {
    toggleTheme();
    playSound("click");
  });

  $("#btn-exit-menu").click(function () {
    showStartScreen();
  });

  $("#btn-mute").click(function () {
    var music = getBgMusic();
    if (!music) return;
    music.muted = !music.muted;
    $(this).text(music.muted ? "🔇 Némítva" : "🔊 Hang");
  });

  $("#btn-endturn").click(function () {
    playSound("click");
    endTurn();
  });

  $("#btn-build-miner").click(function () {
    buildUnit("miner");
  });
  $("#btn-build-soldier").click(function () {
    buildUnit("soldier");
  });
  $("#btn-build-scout").click(function () {
    buildUnit("scout");
  });

  // billentyű: Enter = kör vége
  $(document).keydown(function (e) {
    if (e.key === "Enter" && gameSessionActive) {
      endTurn();
    }
  });

  // egér mozgás: státusz frissítése (második interakció típus)
  $(document).mousemove(function () {
    $("#timer-line").css("opacity", "1");
  });

});

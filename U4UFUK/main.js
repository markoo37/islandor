// Islandors — egyszerű jQuery játék, kezdő szint

var gameState = {};
var nextUnitId = 1;
var selectedUnitId = null;
var turnTimerHandle = null;

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

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getPlayerData(p) {
  if (p === "red") return gameState.red;
  return gameState.blue;
}

function otherPlayer(p) {
  return p === "red" ? "blue" : "red";
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
  if (myPlayer === "red" && x === 7 && y === 7) return true;
  if (myPlayer === "blue" && x === 0 && y === 0) return true;
  return false;
}

function isOwnBaseCell(x, y, myPlayer) {
  if (myPlayer === "red" && x === 0 && y === 0) return true;
  if (myPlayer === "blue" && x === 7 && y === 7) return true;
  return false;
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
  if (unit.type === "scout") return 2;
  return 1;
}

// Mozgáshoz: üres/cél cellák, 4 irány, katona/bányász: 1, felderítő: 2
function getReachableCells(unit) {
  var res = [];
  var visited = {};
  var q = [{ x: unit.x, y: unit.y, d: 0 }];
  var key = function (x, y) {
    return x + "," + y;
  };
  visited[key(unit.x, unit.y)] = true;

  var dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  var maxD = getMoveRange(unit);

  while (q.length > 0) {
    var cur = q.shift();
    var k;
    for (k = 0; k < dirs.length; k++) {
      var nx = cur.x + dirs[k].dx;
      var ny = cur.y + dirs[k].dy;
      if (nx < 0 || nx > 7 || ny < 0 || ny > 7) continue;
      var nd = cur.d + 1;
      if (nd > maxD) continue;
      if (!canWalkOnto(nx, ny, unit.player)) continue;
      var kk = key(nx, ny);
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
}

function startTurnTimer() {
  stopTurnTimer();
  var sec = parseInt($("#cfg-turnsec").val(), 10);
  if (isNaN(sec) || sec < 10) sec = 60;
  gameState.turnSeconds = sec;
  gameState.turnTimeLeft = sec;
  $("#timer-val").html(String(gameState.turnTimeLeft));
  $("#timer-val").css("color", "");

  turnTimerHandle = setInterval(function () {
    gameState.turnTimeLeft--;
    $("#timer-val").html(String(gameState.turnTimeLeft));
    if (gameState.turnTimeLeft <= 10) {
      $("#timer-val").css("color", "#c00");
    } else {
      $("#timer-val").css("color", "");
    }
    if (gameState.turnTimeLeft <= 0) {
      $("#status-line").html("Lejárt a köridő — automatikus kör vége.");
      endTurn();
    }
  }, 1000);
}

function endTurn() {
  stopTurnTimer();
  selectedUnitId = null;
  gameState.currentPlayer = otherPlayer(gameState.currentPlayer);
  var i;
  for (i = 0; i < gameState.units.length; i++) {
    gameState.units[i].acted = false;
  }
  $("#status-line").html("Most lép: " + (gameState.currentPlayer === "red" ? "Piros" : "Kék"));
  updatePanels();
  renderBoard();
  var w = checkVictory();
  if (w !== null) {
    $("#status-line").html("Győzelem: " + (w === "red" ? "Piros" : "Kék") + " játékos nyert!");
    return;
  }
  startTurnTimer();
}

function pulseUnitCell(x, y) {
  var idx = y * 8 + x;
  var $cell = $("#board .cell").eq(idx);
  var $lbl = $cell.find(".unit-label");
  if ($lbl.length === 0) return;
  $lbl.stop(true, true);
  var oldSize = $lbl.css("font-size") || "11px";
  $lbl.animate({ fontSize: "18px" }, 180).animate({ fontSize: oldSize }, 180);
}

function tryAttackBase(attacker, tx, ty) {
  if (attacker.type === "miner") return false;
  if (!isEnemyBaseCell(tx, ty, attacker.player)) return false;
  if (!isAdjacent(attacker.x, attacker.y, tx, ty)) return false;
  if (attacker.acted) return false;

  var dmg = attacker.type === "soldier" ? 2 : 1;
  var enemy = attacker.player === "red" ? getPlayerData("blue") : getPlayerData("red");
  enemy.baseHp -= dmg;
  attacker.acted = true;
  playSound("attack");
  pulseUnitCell(attacker.x, attacker.y);
  $("#status-line").html("Bázist támadtál! Sebzés: " + dmg);
  return true;
}

function tryAttackUnit(attacker, target) {
  if (attacker.type === "miner") return false;
  if (target.player === attacker.player) return false;
  if (!isAdjacent(attacker.x, attacker.y, target.x, target.y)) return false;
  if (attacker.acted) return false;

  var dmg = attacker.type === "soldier" ? 2 : 1;
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

function tryMove(unit, tx, ty) {
  if (unit.acted) return false;
  var reachable = getReachableCells(unit);
  var ok = false;
  var i;
  for (i = 0; i < reachable.length; i++) {
    if (reachable[i].x === tx && reachable[i].y === ty) {
      ok = true;
      break;
    }
  }
  if (!ok) return false;

  unit.x = tx;
  unit.y = ty;
  unit.acted = true;

  var ter = gameState.terrain[ty][tx];
  if (unit.type === "miner" && (ter === "wood" || ter === "gold")) {
    var pl = getPlayerData(unit.player);
    if (ter === "wood") pl.wood += 2;
    else pl.gold += 2;
    gameState.terrain[ty][tx] = "empty";
    $("#status-line").html("Bányász gyűjtött!");
  }

  pulseUnitCell(tx, ty);
  return true;
}

function findSpawnCell(player) {
  var bx = player === "red" ? 0 : 7;
  var by = player === "red" ? 0 : 7;
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
    if (cx < 0 || cx > 7 || cy < 0 || cy > 7) continue;
    if (!canWalkOnto(cx, cy, player)) continue;
    if (!isOwnBaseCell(cx, cy, player) && isEnemyBaseCell(cx, cy, player)) continue;
    return { x: cx, y: cy };
  }
  return null;
}

function makeUnit(type, player, x, y) {
  var hp = 3;
  if (type === "soldier") hp = 5;
  if (type === "scout") hp = 2;
  return {
    id: nextUnitId++,
    type: type,
    player: player,
    x: x,
    y: y,
    hp: hp,
    acted: false
  };
}

function buildUnit(type) {
  var p = gameState.currentPlayer;
  var pl = getPlayerData(p);
  var costW = 2;
  var costG = 1;
  if (type === "soldier") {
    costW = 2;
    costG = 2;
  }
  if (type === "scout") {
    costW = 1;
    costG = 2;
  }
  if (pl.wood < costW || pl.gold < costG) {
    alert("Nincs elég nyersanyag.");
    return;
  }
  var spot = findSpawnCell(p);
  if (spot === null) {
    alert("Nincs üres mező a bázis mellett.");
    return;
  }
  pl.wood -= costW;
  pl.gold -= costG;
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
  for (r = 0; r < 8; r++) {
    var row = [];
    for (c = 0; c < 8; c++) {
      row.push("empty");
    }
    terrain.push(row);
  }

  terrain[0][0] = "base_red";
  terrain[7][7] = "base_blue";

  // statikus erőforrások helye
  terrain[2][3] = "wood";
  terrain[3][5] = "gold";
  terrain[4][2] = "wood";
  terrain[5][6] = "gold";
  terrain[1][6] = "wood";
  terrain[6][1] = "gold";

  gameState = {
    currentPlayer: "red",
    theme: $("body").hasClass("theme-dark") ? "dark" : "light",
    red: { wood: 4, gold: 4, baseHp: 10 },
    blue: { wood: 4, gold: 4, baseHp: 10 },
    terrain: terrain,
    units: [],
    turnSeconds: parseInt($("#cfg-turnsec").val(), 10) || 60,
    turnTimeLeft: parseInt($("#cfg-turnsec").val(), 10) || 60
  };

  gameState.units.push(makeUnit("miner", "red", 1, 0));
  gameState.units.push(makeUnit("soldier", "red", 0, 1));
  gameState.units.push(makeUnit("miner", "blue", 6, 7));
  gameState.units.push(makeUnit("soldier", "blue", 7, 6));

  $("#status-line").html("Új játék — Piros kezd.");
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
}

function terrainClass(t) {
  if (t === "base_red") return "base-red";
  if (t === "base_blue") return "base-blue";
  if (t === "wood") return "wood";
  if (t === "gold") return "gold";
  return "";
}

function unitSymbol(type) {
  if (type === "miner") return "B";
  if (type === "soldier") return "K";
  if (type === "scout") return "F";
  return "?";
}

function renderBoard() {
  var $b = $("#board");
  $b.empty();

  var y, x;
  for (y = 0; y < 8; y++) {
    for (x = 0; x < 8; x++) {
      var t = gameState.terrain[y][x];
      var cls = "cell " + terrainClass(t);
      var $cell = $('<div class="' + cls + '" data-x="' + x + '" data-y="' + y + '"></div>');

      var icon = "";
      if (t === "wood") icon = '<div class="terrain-icon">🌲</div>';
      else if (t === "gold") icon = '<div class="terrain-icon">💰</div>';
      else if (t === "base_red") icon = '<div class="terrain-icon">🏠</div>';
      else if (t === "base_blue") icon = '<div class="terrain-icon">🏠</div>';

      $cell.append(icon);

      var u = getUnitAt(x, y);
      if (u !== null) {
        var col = u.player === "red" ? "unit-red" : "unit-blue";
        var line =
          '<div class="unit-label ' +
          col +
          '">' +
          unitSymbol(u.type) +
          " HP" +
          u.hp +
          "</div>";
        $cell.append(line);
      }

      $cell.appendTo($b);
    }
  }

  // kijelölés és hintek
  if (selectedUnitId !== null) {
    var su = null;
    var i;
    for (i = 0; i < gameState.units.length; i++) {
      if (gameState.units[i].id === selectedUnitId) su = gameState.units[i];
    }
    if (su !== null) {
      var idx = su.y * 8 + su.x;
      $("#board .cell").eq(idx).addClass("selected");

      if (su.player === gameState.currentPlayer && !su.acted) {
        var cells = getReachableCells(su);
        for (i = 0; i < cells.length; i++) {
          var ii = cells[i].y * 8 + cells[i].x;
          $("#board .cell").eq(ii).addClass("move-hint");
        }
        // támadás jelölés: szomszédos ellenség
        var dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 }
        ];
        if (su.type !== "miner") {
          for (i = 0; i < dirs.length; i++) {
            var ax = su.x + dirs[i].dx;
            var ay = su.y + dirs[i].dy;
            if (ax < 0 || ax > 7 || ay < 0 || ay > 7) continue;
            var en = getUnitAt(ax, ay);
            if (en !== null && en.player !== su.player) {
              $("#board .cell")
                .eq(ay * 8 + ax)
                .addClass("attack-hint");
            }
            if (isEnemyBaseCell(ax, ay, su.player)) {
              $("#board .cell")
                .eq(ay * 8 + ax)
                .addClass("attack-hint");
            }
          }
        }
      }
    }
  }
}

function onCellClick(x, y) {
  playSound("click");

  var w = checkVictory();
  if (w !== null) {
    $("#status-line").html("A játék véget ért.");
    return;
  }

  var clickedUnit = getUnitAt(x, y);
  var su = null;
  if (selectedUnitId !== null) {
    var i;
    for (i = 0; i < gameState.units.length; i++) {
      if (gameState.units[i].id === selectedUnitId) su = gameState.units[i];
    }
  }

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
        $("#status-line").html("Győzelem: " + (w === "red" ? "Piros" : "Kék"));
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
        $("#status-line").html("Győzelem: " + (w === "red" ? "Piros" : "Kék"));
        return;
      }
      return;
    }
  }

  // mozgás
  if (su !== null && clickedUnit === null) {
    if (tryMove(su, x, y)) {
      updatePanels();
      renderBoard();
      w = checkVictory();
      if (w !== null) {
        stopTurnTimer();
        $("#status-line").html("Győzelem: " + (w === "red" ? "Piros" : "Kék"));
        return;
      }
    }
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
    gameState = pack.gs;
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
    $("#status-line").html("Betöltve. Most lép: " + (gameState.currentPlayer === "red" ? "Piros" : "Kék"));
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

$(function () {
  $("body").addClass("theme-light");

  $("#board").on("click", ".cell", function () {
    var x = parseInt($(this).data("x"), 10);
    var y = parseInt($(this).data("y"), 10);
    onCellClick(x, y);
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

  $("#help-box").dialog({
    autoOpen: false,
    width: 480,
    modal: true
  });

  $("#btn-theme").click(function () {
    toggleTheme();
    playSound("click");
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
    if (e.key === "Enter") {
      endTurn();
    }
  });

  // egér mozgás: státusz frissítése (második interakció típus)
  $(document).mousemove(function () {
    $("#timer-line").css("opacity", "1");
  });

  initGame();
});

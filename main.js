(function () {
  'use strict';

  // ======= Константы игры =======
  var WIDTH = 40;
  var HEIGHT = 24;
  var TILE_WALL = 0;
  var TILE_FLOOR = 1;

  var MIN_ROOMS = 5, MAX_ROOMS = 10;
  var ROOM_MIN = 3, ROOM_MAX = 8;

  var H_CORRIDORS_MIN = 3, H_CORRIDORS_MAX = 5;
  var V_CORRIDORS_MIN = 3, V_CORRIDORS_MAX = 5;

  var ENEMIES_COUNT = 10;
  var POTIONS_COUNT = 10;
  var SWORDS_COUNT = 2;

  var HERO_MAX_HP = 100;
  var HERO_BASE_ATK = 10;
  var SWORD_BONUS = 10; // к урону за меч

  // ======= Состояние игры =======
  var state = {
    grid: [],          // 2D массив тайлов
    hero: null,        // {x,y,hp,atk}
    enemies: [],       // [{id,x,y,hp,atk}]
    potions: {},       // key "x,y" -> true
    swords: {},        // key "x,y" -> true
    turn: 'hero'       // чей ход: 'hero' | 'enemies'
  };

  // ======= Утилиты =======
  function key(x, y) { return x + ',' + y; }
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT; }
  function neighbors4(x, y) { return [{x:x+1,y:y},{x:x-1,y:y},{x:x,y:y+1},{x:x,y:y-1}]; }
  function manhattan(a,b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }

  function emptyCells() {
    var cells = [];
    for (var y = 0; y < HEIGHT; y++) {
      for (var x = 0; x < WIDTH; x++) {
        if (state.grid[y][x] === TILE_FLOOR
            && !state.potions[key(x,y)]
            && !state.swords[key(x,y)]
            && !findEnemyAt(x,y)
            && !(state.hero && state.hero.x === x && state.hero.y === y)) {
          cells.push({x:x,y:y});
        }
      }
    }
    return cells;
  }

  function placeRandomEmpty() {
    var cells = emptyCells();
    if (!cells.length) return null;
    return cells[rand(0, cells.length - 1)];
  }

  function findEnemyAt(x, y) {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.x === x && e.y === y) return e;
    }
    return null;
  }

  function passable(x, y) {
    if (!inBounds(x,y)) return false;
    if (state.grid[y][x] !== TILE_FLOOR) return false;
    if (findEnemyAt(x,y)) return false;
    if (state.hero && state.hero.x === x && state.hero.y === y) return false;
    return true;
  }

  // ======= Генерация карты =======
  function generateMap() {
    // 1) Заполнить всё стеной
    state.grid = [];
    for (var y = 0; y < HEIGHT; y++) {
      var row = [];
      for (var x = 0; x < WIDTH; x++) row.push(TILE_WALL);
      state.grid.push(row);
    }

    // 2) Комнаты
    var roomsCount = rand(MIN_ROOMS, MAX_ROOMS);
    for (var r = 0; r < roomsCount; r++) {
      var rw = rand(ROOM_MIN, ROOM_MAX);
      var rh = rand(ROOM_MIN, ROOM_MAX);
      var rx = rand(1, WIDTH - rw - 2);
      var ry = rand(1, HEIGHT - rh - 2);
      carveRect(rx, ry, rw, rh);
    }

    // 3) Горизонтальные коридоры на всю ширину
    var hcount = rand(H_CORRIDORS_MIN, H_CORRIDORS_MAX);
    var usedRows = {};
    for (var i = 0; i < hcount; i++) {
      var rowY;
      do { rowY = rand(1, HEIGHT - 2); } while (usedRows[rowY]);
      usedRows[rowY] = true;
      for (var x = 0; x < WIDTH; x++) state.grid[rowY][x] = TILE_FLOOR;
    }

    // 4) Вертикальные коридоры на всю высоту
    var vcount = rand(V_CORRIDORS_MIN, V_CORRIDORS_MAX);
    var usedCols = {};
    for (var j = 0; j < vcount; j++) {
      var colX;
      do { colX = rand(1, WIDTH - 2); } while (usedCols[colX]);
      usedCols[colX] = true;
      for (var y = 0; y < HEIGHT; y++) state.grid[y][colX] = TILE_FLOOR;
    }

    // 5) Гарантировать достижимость — заливка из произвольной пустой клетки
    ensureConnectivity();
  }

  function carveRect(x, y, w, h) {
    for (var yy = y; yy < y + h; yy++) {
      for (var xx = x; xx < x + w; xx++) {
        state.grid[yy][xx] = TILE_FLOOR;
      }
    }
  }

  function ensureConnectivity() {
    var start = null;
    for (var y = 0; y < HEIGHT && !start; y++) {
      for (var x = 0; x < WIDTH; x++) {
        if (state.grid[y][x] === TILE_FLOOR) { start = {x:x,y:y}; break; }
      }
    }
    if (!start) return;

    var visited = floodFill(start.x, start.y);
    for (var yy = 0; yy < HEIGHT; yy++) {
      for (var xx = 0; xx < WIDTH; xx++) {
        if (state.grid[yy][xx] === TILE_FLOOR && !visited[key(xx,yy)]) {
          digPathToVisited({x:xx,y:yy}, visited);
          visited = floodFill(start.x, start.y);
        }
      }
    }
  }

  function floodFill(sx, sy) {
    var q = [{x:sx,y:sy}], head = 0;
    var seen = {}; seen[key(sx,sy)] = true;
    while (head < q.length) {
      var p = q[head++];
      var nbs = neighbors4(p.x, p.y);
      for (var i = 0; i < 4; i++) {
        var nx = nbs[i].x, ny = nbs[i].y;
        if (inBounds(nx,ny) && state.grid[ny][nx] === TILE_FLOOR && !seen[key(nx,ny)]) {
          seen[key(nx,ny)] = true;
          q.push({x:nx,y:ny});
        }
      }
    }
    return seen;
  }

  function digPathToVisited(p, visited) {
    var best = null, bestD = 1e9;
    for (var y = 0; y < HEIGHT; y++) {
      for (var x = 0; x < WIDTH; x++) {
        if (visited[key(x,y)]) {
          var d = Math.abs(p.x - x) + Math.abs(p.y - y);
          if (d < bestD) { bestD = d; best = {x:x,y:y}; }
        }
      }
    }
    if (!best) return;
    var x = p.x, y = p.y;
    while (x !== best.x) {
      state.grid[y][x] = TILE_FLOOR;
      x += (best.x > x) ? 1 : -1;
    }
    while (y !== best.y) {
      state.grid[y][x] = TILE_FLOOR;
      y += (best.y > y) ? 1 : -1;
    }
    state.grid[y][x] = TILE_FLOOR;
  }

  // ======= Размещение сущностей =======
  function setupEntities() {
    state.enemies = [];
    state.potions = {};
    state.swords  = {};

    // Герой
    var hp = HERO_MAX_HP;
    var atk = HERO_BASE_ATK;
    var pos = placeRandomEmpty();
    state.hero = { x: pos.x, y: pos.y, hp: hp, maxHp: HERO_MAX_HP, atk: atk };

    // Зелья
    placeManyRandom(state.potions, POTIONS_COUNT);
    // Мечи
    placeManyRandom(state.swords, SWORDS_COUNT);

    // Враги
    for (var i = 0; i < ENEMIES_COUNT; i++) {
      var p = placeRandomEmpty();
      state.enemies.push({ id: i+1, x: p.x, y: p.y, hp: 40, maxHp: 40, atk: 8 });
    }
  }

  function placeManyRandom(mapObj, count) {
    for (var i = 0; i < count; i++) {
      var p = placeRandomEmpty();
      if (!p) break;
      mapObj[key(p.x,p.y)] = true;
    }
  }

  // ======= Рендер =======
  var fieldEl = document.getElementById('field');
  var hpText = document.getElementById('hpText');
  var atkText = document.getElementById('atkText');
  var turnText = document.getElementById('turnText');

  function render() {
    while (fieldEl.firstChild) fieldEl.removeChild(fieldEl.firstChild);

    for (var y = 0; y < HEIGHT; y++) {
      for (var x = 0; x < WIDTH; x++) {
        var el = document.createElement('div');
        el.className = 'tile ' + (state.grid[y][x] === TILE_FLOOR ? 'floor' : 'wall');

        if (state.hero.x === x && state.hero.y === y) {
          el.className += ' hero';
          var hb = document.createElement('div');
          hb.className = 'health';
          var fill = document.createElement('i');
          fill.style.width = Math.max(0, Math.round((state.hero.hp / state.hero.maxHp) * 100)) + '%';
          hb.appendChild(fill);
          el.appendChild(hb);
        } else {
          var enemy = findEnemyAt(x,y);
          if (enemy) {
            el.className += ' enemy';
            var hb2 = document.createElement('div');
            hb2.className = 'health';
            var fill2 = document.createElement('i');
            fill2.style.width = Math.max(0, Math.round((enemy.hp / enemy.maxHp) * 100)) + '%';
            hb2.appendChild(fill2);
            el.appendChild(hb2);
          } else if (state.swords[key(x,y)]) {
            el.className += ' sword';
          } else if (state.potions[key(x,y)]) {
            el.className += ' potion';
          }
        }

        fieldEl.appendChild(el);
      }
    }

    // HUD
    hpText.textContent = state.hero.hp + ' / ' + state.hero.maxHp;
    atkText.textContent = state.hero.atk;
    turnText.textContent = (state.turn === 'hero') ? 'Герой' : 'Противники';
  }

  // ======= Управление =======
  function onKeyDown(e) {
    if (state.turn !== 'hero') return;

    var code = e.key || e.code;
    var dx = 0, dy = 0, acted = false;

    if (code === 'w' || code === 'W' || code === 'ArrowUp' || code === 'KeyW') { dy = -1; acted = true; }
    else if (code === 's' || code === 'S' || code === 'ArrowDown' || code === 'KeyS') { dy = 1; acted = true; }
    else if (code === 'a' || code === 'A' || code === 'ArrowLeft' || code === 'KeyA') { dx = -1; acted = true; }
    else if (code === 'd' || code === 'D' || code === 'ArrowRight' || code === 'KeyD') { dx = 1; acted = true; }
    else if (code === ' ' || code === 'Space' || code === 'Spacebar') {
      heroAttack();
      acted = true;
    }

    if (acted) {
      if (dx !== 0 || dy !== 0) heroMove(dx, dy);
      endHeroTurn();
      e.preventDefault();
    }
  }

  function heroMove(dx, dy) {
    var nx = state.hero.x + dx;
    var ny = state.hero.y + dy;
    if (!inBounds(nx,ny)) return;
    if (state.grid[ny][nx] !== TILE_FLOOR) return;
    if (findEnemyAt(nx,ny)) return;

    state.hero.x = nx;
    state.hero.y = ny;

    var k = key(nx,ny);
    if (state.potions[k]) {
      state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + 40);
      delete state.potions[k];
    }
    if (state.swords[k]) {
      state.hero.atk += SWORD_BONUS;
      delete state.swords[k];
    }
    render();
  }

  function heroAttack() {
    var hx = state.hero.x, hy = state.hero.y;
    var any = false;
    for (var i = state.enemies.length - 1; i >= 0; i--) {
      var e = state.enemies[i];
      if (manhattan({x:hx,y:hy}, e) === 1) {
        e.hp -= state.hero.atk;
        any = true;
        if (e.hp <= 0) state.enemies.splice(i,1);
      }
    }
    if (any) render();
  }

  function endHeroTurn() {
    state.turn = 'enemies';
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (manhattan(e, state.hero) === 1) {
        state.hero.hp -= e.atk;
        if (state.hero.hp <= 0) {
          state.hero.hp = 0;
          render();
          alert('Герой погиб. Игра окончена.');
          init(); 
          return;
        }
      } else {
        var dirs = [
          {dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}
        ];
        var order = rand(0,3);
        for (var t = 0; t < 4; t++) {
          var d = dirs[(order + t) % 4];
          var nx = e.x + d.dx, ny = e.y + d.dy;
          if (inBounds(nx,ny) && state.grid[ny][nx] === TILE_FLOOR && !findEnemyAt(nx,ny) && !(state.hero.x===nx && state.hero.y===ny)) {
            e.x = nx; e.y = ny; break;
          }
        }
      }
    }
    state.turn = 'hero';
    render();
  }

  function init() {
    generateMap();
    setupEntities();
    state.turn = 'hero';
    render();
  }

  document.addEventListener('keydown', onKeyDown, false);
  document.getElementById('restartBtn').addEventListener('click', function(){
    init();
  }, false);

  init();
})();

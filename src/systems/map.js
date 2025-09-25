(function (root) {
  var Game = root.Game || (root.Game = {});

  function rectsIntersect(a, b) {
    return !(a.x + a.w + 1 <= b.x ||
             b.x + b.w + 1 <= a.x ||
             a.y + a.h + 1 <= b.y ||
             b.y + b.h + 1 <= a.y);
  }

  function carveRect(x, y, w, h) {
    var C = Game.C, S = Game.state;
    for (var yy = y; yy < y + h; yy++) {
      for (var xx = x; xx < x + w; xx++) {
        if (xx >= 0 && yy >= 0 && xx < C.WIDTH && yy < C.HEIGHT) {
          S.grid[yy][xx] = C.TILE_FLOOR;
        }
      }
    }
  }

  function floodFill(sx, sy) {
    var C = Game.C, S = Game.state, U = Game.utils;
    var q = [{x:sx,y:sy}], head = 0, seen = {};
    seen[U.key(sx,sy)] = true;
    while (head < q.length) {
      var p = q[head++], nbs = U.neighbors4(p.x, p.y);
      for (var i = 0; i < 4; i++) {
        var nx = nbs[i].x, ny = nbs[i].y;
        if (U.inBounds(nx,ny) && S.grid[ny][nx] === C.TILE_FLOOR && !seen[U.key(nx,ny)]) {
          seen[U.key(nx,ny)] = true; q.push({x:nx,y:ny});
        }
      }
    }
    return seen;
  }

  function digPathToVisited(p, visited) {
    var C = Game.C, S = Game.state, U = Game.utils;
    var best = null, bestD = 1e9;
    for (var y = 0; y < C.HEIGHT; y++) for (var x = 0; x < C.WIDTH; x++) {
      if (visited[U.key(x,y)]) {
        var d = Math.abs(p.x - x) + Math.abs(p.y - y);
        if (d < bestD) { bestD = d; best = {x:x,y:y}; }
      }
    }
    if (!best) return;
    var x0 = p.x, y0 = p.y;
    while (x0 !== best.x) { S.grid[y0][x0] = C.TILE_FLOOR; x0 += (best.x > x0) ? 1 : -1; }
    while (y0 !== best.y) { S.grid[y0][x0] = C.TILE_FLOOR; y0 += (best.y > y0) ? 1 : -1; }
    S.grid[y0][x0] = C.TILE_FLOOR;
  }

  function ensureConnectivity() {
    var C = Game.C, S = Game.state, U = Game.utils;
    var start = null;
    for (var y = 0; y < C.HEIGHT && !start; y++)
      for (var x = 0; x < C.WIDTH; x++)
        if (S.grid[y][x] === C.TILE_FLOOR) { start = {x:x,y:y}; break; }
    if (!start) return;

    var visited = floodFill(start.x, start.y);
    for (var yy = 0; yy < C.HEIGHT; yy++) for (var xx = 0; xx < C.WIDTH; xx++) {
      if (S.grid[yy][xx] === C.TILE_FLOOR && !visited[Game.utils.key(xx,yy)]) {
        digPathToVisited({x:xx,y:yy}, visited);
        visited = floodFill(start.x, start.y);
      }
    }
  }

  // --- генерация по ТЗ ---
  Game.map = {
    generate: function () {
      var C = Game.C;
      var S = Game.state || (Game.state = { grid: [], hero: null, enemies: [], potions: {}, swords: {}, turn: 'hero' });

      // 1) залить всё стеной
      S.grid = [];
      for (var y = 0; y < C.HEIGHT; y++) {
        var row = [];
        for (var x = 0; x < C.WIDTH; x++) row.push(C.TILE_WALL);
        S.grid.push(row);
      }

      // 2) комнаты: 5–10 штук, каждая 3–8×3–8, не слипаются
      var wantRooms = Game.rng.rand(C.MIN_ROOMS, C.MAX_ROOMS);
      var rooms = [];
      var attempts = 0, MAX_ATTEMPTS = 200;
      while (rooms.length < wantRooms && attempts < MAX_ATTEMPTS) {
        attempts++;
        var w = Game.rng.rand(C.ROOM_MIN, C.ROOM_MAX);
        var h = Game.rng.rand(C.ROOM_MIN, C.ROOM_MAX);
        var rx = Game.rng.rand(1, C.WIDTH  - w - 2);
        var ry = Game.rng.rand(1, C.HEIGHT - h - 2);
        var room = { x: rx, y: ry, w: w, h: h };

        var ok = true;
        for (var i = 0; i < rooms.length; i++) {
          if (rectsIntersect(room, rooms[i])) { ok = false; break; }
        }
        if (!ok) continue;

        rooms.push(room);
        carveRect(room.x, room.y, room.w, room.h);
      }

      // 3) горизонтальные проходы на всю ширину: 3–5 шт, ширина 1 клетка
      var hcount = Game.rng.rand(C.H_CORRIDORS_MIN, C.H_CORRIDORS_MAX);
      var usedRows = {};
      for (var r = 0; r < hcount; r++) {
        var rowY;
        do { rowY = Game.rng.rand(1, C.HEIGHT - 2); } while (usedRows[rowY]);
        usedRows[rowY] = true;
        for (var xx = 0; xx < C.WIDTH; xx++) S.grid[rowY][xx] = C.TILE_FLOOR;
      }

      // 4) вертикальные проходы на всю высоту: 3–5 шт, ширина 1 клетка
      var vcount = Game.rng.rand(C.V_CORRIDORS_MIN, C.V_CORRIDORS_MAX);
      var usedCols = {};
      for (var c = 0; c < vcount; c++) {
        var colX;
        do { colX = Game.rng.rand(1, C.WIDTH - 2); } while (usedCols[colX]);
        usedCols[colX] = true;
        for (var yy = 0; yy < C.HEIGHT; yy++) S.grid[yy][colX] = C.TILE_FLOOR;
      }

      // 5) не оставляем недостижимых зон
      ensureConnectivity();
    }
  };
})(window);

(function (root) {
  var Game = root.Game || (root.Game = {});
  var UKey = function (x, y) { return x + ',' + y; };

  Game.placement = {
    emptyCells: function () {
      var C = Game.C, S = Game.state;
      var cells = [], y, x, k;
      for (y = 0; y < C.HEIGHT; y++) {
        for (x = 0; x < C.WIDTH; x++) {
          k = (Game.utils ? Game.utils.key(x,y) : UKey(x,y));
          if (S.grid[y][x] === C.TILE_FLOOR &&
              !S.potions[k] && !S.swords[k] &&
              !(Game.entities && Game.entities.findEnemyAt && Game.entities.findEnemyAt(x,y)) &&
              !(S.hero && S.hero.x === x && S.hero.y === y)) {
            cells.push({x:x,y:y});
          }
        }
      }
      return cells;
    },

    placeRandomEmpty: function () {
      var cells = Game.placement.emptyCells();
      if (!cells.length) return null;
      var i = Game.rng.rand(0, cells.length - 1);
      return cells[i];
    },

    passable: function (x, y) {
      var C = Game.C, S = Game.state, U = Game.utils;
      if (!(U && U.inBounds) || !U.inBounds(x,y)) return false;
      if (S.grid[y][x] !== C.TILE_FLOOR) return false;
      if (Game.entities && Game.entities.findEnemyAt && Game.entities.findEnemyAt(x,y)) return false;
      if (S.hero && S.hero.x === x && S.hero.y === y) return false;
      return true;
    }
  };
})(window);

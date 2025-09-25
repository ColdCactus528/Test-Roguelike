(function (root) {
  var Game = root.Game || (root.Game = {});
  var randomSeed = 0;

  Game.rng = {
    reseed: function () {
      randomSeed = Math.floor(Math.random() * 1e9) | 0;
    },
    rand: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    hashCoord: function (x, y, salt) {
      var h = (x * 73856093) ^ (y * 19349663) ^ (randomSeed * 83492791) ^ (salt || 0);
      return (h >>> 0);
    },
    variantIndex: function (max, x, y, salt) {
      return (Game.rng.hashCoord(x, y, salt) % max) + 1;
    }
  };
})(window);

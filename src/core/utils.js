(function (root) {
  var Game = root.Game || (root.Game = {});

  Game.utils = {
    key: function (x, y) {
      return x + ',' + y;
    },

    inBounds: function (x, y) {
      var C = Game.C;
      return x >= 0 && y >= 0 && x < C.WIDTH && y < C.HEIGHT;
    },

    neighbors4: function (x, y) {
      return [
        { x: x + 1, y: y },
        { x: x - 1, y: y },
        { x: x,     y: y + 1 },
        { x: x,     y: y - 1 }
      ];
    },

    manhattan: function (a, b) {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    },

    shuffle: function (arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    }
  };
})(window);

(function (root) {
  var Game = root.Game || (root.Game = {});

  function getTile(x, y) {
    return (Game.render && typeof Game.render.getTileEl === 'function')
      ? Game.render.getTileEl(x, y)
      : null;
  }

  function heroPulse(cx, cy) {
    var t = getTile(cx, cy);
    if (!t) return;
    var pulse = document.createElement('div');
    pulse.className = 'pulse';
    t.appendChild(pulse);
    pulse.addEventListener('animationend', function () {
      if (pulse.parentNode) pulse.parentNode.removeChild(pulse);
    }, { once: true });
  }

  function neighborWave(cx, cy) {
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        (function (xx, yy, dx, dy) {
          var tile = getTile(xx, yy);
          if (!tile) return;

          var dist = Math.max(Math.abs(dx), Math.abs(dy));

          tile.classList.remove('wave');
          void tile.offsetWidth;
          tile.style.setProperty('--delay', (dist * 90) + 'ms');
          tile.classList.add('wave');

          setTimeout(function () {
            tile.classList.remove('wave');
            tile.style.removeProperty('--delay');
          }, dist * 90 + 420);
        })(cx + dx, cy + dy, dx, dy);
      }
    }
  }

  Game.fx = {
    attackRipple: function (cx, cy, done) {
      requestAnimationFrame(function () {
        heroPulse(cx, cy);
        neighborWave(cx, cy);
        setTimeout(function () { if (typeof done === 'function') done(); }, 430);
      });
    }
  };
})(window);

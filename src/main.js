(function (root) {
  var Game = root.Game || (root.Game = {});

  function resetUiFlags() {
    var S = Game.state || (Game.state = {});
    S.uiHoverEnemyId = null;
    S.uiHoverHero = false;

    S.initiative = [];
    S.initiativeCursor = 0;
    S.initiativeRoundSize = 0;
    S.activeKind = null;
    S.activeEnemyId = null;

    S._winShown = false;
  }

  function reseedRng() {
    if (Game.rng && typeof Game.rng.reseed === 'function') {
      try { Game.rng.reseed(); } catch (e) { Game.rng.reseed(Date.now() | 0); }
    }
  }

  function generateMap() {
    if (Game.map && typeof Game.map.generate === 'function') {
      Game.map.generate();
    } else if (Game.placement && typeof Game.placement.generate === 'function') {
      Game.placement.generate();
    } else {
      var C = Game.C, S = Game.state || (Game.state = {});
      S.grid = [];
      for (var y = 0; y < C.HEIGHT; y++) {
        var row = [];
        for (var x = 0; x < C.WIDTH; x++) row.push(C.TILE_FLOOR);
        S.grid.push(row);
      }
    }
  }

  Game.main = {
    mountOnce: function () {
      if (Game.__mounted) return;
      if (Game.render && typeof Game.render.mount === 'function') Game.render.mount();
      if (Game.input  && typeof Game.input.mount  === 'function') Game.input.mount();

      var btn = document.getElementById('restartBtn');
      if (btn) {
        btn.addEventListener('click', function () {
          Game.main.regen();
        }, false);
      }

      window.addEventListener('game:win', function(){  });

      Game.__mounted = true;
    },

    regen: function () {
      reseedRng();
      generateMap();
      resetUiFlags();

      if (Game.entities && typeof Game.entities.setup === 'function') {
        Game.entities.setup(); 
      }

      (Game.state || (Game.state = {})).turn = 'hero';

      if (Game.turn && typeof Game.turn.startLevel === 'function') {
        Game.turn.startLevel();
      }

      if (Game.render && typeof Game.render.draw === 'function') {
        Game.render.draw();
      }
    },

    init: function () {
      Game.main.mountOnce();
      Game.main.regen();
    }
  };

  function bootstrap() { Game.main.init(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, false);
  } else {
    bootstrap();
  }
})(window);

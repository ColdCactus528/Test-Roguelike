(function (root) {
  var Game = root.Game || (root.Game = {});

  function onKeyDown(e) {
    var code = e.code || e.key;
    var handled = true;

    switch (code) {
      case 'KeyW': case 'ArrowUp':    Game.turn.heroTryMove(0, -1); break;
      case 'KeyS': case 'ArrowDown':  Game.turn.heroTryMove(0,  1); break;
      case 'KeyA': case 'ArrowLeft':  Game.turn.heroTryMove(-1, 0); break;
      case 'KeyD': case 'ArrowRight': Game.turn.heroTryMove( 1, 0); break;
      case 'Space': Game.turn.heroAttack(); break;
      default: handled = false;
    }

    if (handled) { e.preventDefault(); e.stopPropagation(); }
  }

  Game.input = {
    mounted: false,
    mount: function () {
      if (this.mounted) return;
      document.addEventListener('keydown', onKeyDown, false);
      this.mounted = true;
    }
  };
})(window);

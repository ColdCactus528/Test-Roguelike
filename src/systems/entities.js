(function (root) {
  var Game = root.Game || (root.Game = {});
  var C = Game.C;

  function emptyCells() {
    var S = Game.state, out = [];
    for (var y = 0; y < C.HEIGHT; y++) for (var x = 0; x < C.WIDTH; x++) {
      if (S.grid[y][x] !== C.TILE_FLOOR) continue;
      var key = Game.utils.key(x,y);
      var busy = false;
      if (S.hero && S.hero.x === x && S.hero.y === y) busy = true;
      for (var i = 0; i < (S.enemies||[]).length; i++) if (S.enemies[i].x === x && S.enemies[i].y === y) { busy = true; break; }
      if (S.potions && S.potions[key]) busy = true;
      if (S.swords  && S.swords[key])  busy = true;
      if (!busy) out.push({x:x,y:y});
    }
    return out;
  }

  function takeRandomCell() {
    var cells = emptyCells();
    if (!cells.length) return null;
    return cells[Math.floor(Math.random() * cells.length)];
  }

  function createEnemyFrom(def, id) {
    var p = takeRandomCell() || {x:0,y:0};
    return {
      id: id,
      name: def.name,
      x: p.x, y: p.y,
      hp: def.hp, maxHp: def.hp,
      atk: def.atk,
      apMax: def.apMax, ap: def.apMax,
      tier: def.tier,            
      skipAlt: !!def.skipAlt,    
      _skipFlag: false,
      xpValue: def.xp
    };
  }

  Game.entities = {
    findEnemyAt: function (x, y) {
      var S = Game.state;
      for (var i = 0; i < S.enemies.length; i++) {
        var e = S.enemies[i];
        if (e.hp > 0 && e.x === x && e.y === y) return e;
      }
      return null;
    },

    setup: function () {
      var S = Game.state || (Game.state = {});
      S.enemies = [];
      S.potions = {};
      S.swords  = {};

      // --- Герой 
      var baseHp = (C.HERO_BASE_HP != null) ? C.HERO_BASE_HP
                  : (C.HERO_MAX_HP != null) ? C.HERO_MAX_HP : 10;
      var baseAtk = (C.HERO_BASE_ATK != null) ? C.HERO_BASE_ATK : 1;
      var baseAp  = (C.HERO_BASE_APMAX != null) ? C.HERO_BASE_APMAX
                  : (C.HERO_BASE_AP    != null) ? C.HERO_BASE_AP : 1;

      var heroSpot = takeRandomCell() || {x:1,y:1};
      S.hero = {
        x: heroSpot.x, y: heroSpot.y,
        hp: baseHp, maxHp: baseHp,
        atk: baseAtk,
        apMax: baseAp, ap: baseAp,
        level: 1,
        xp: 0,
        xpNeed: 1
      };

      // --- Враги (10 шт.)
      var defs = [
        C.ENEMY_TYPES.ZAURYAD,
        C.ENEMY_TYPES.ZAURYAD,
        C.ENEMY_TYPES.KVADRAT,
        C.ENEMY_TYPES.NE_ZAURYAD,
        C.ENEMY_TYPES.MEGA
      ];
      for (var i = 0; i < 10; i++) {
        var def = defs[Math.floor(Math.random() * defs.length)];
        S.enemies.push(createEnemyFrom(def, i + 1));
      }

      // --- Предметы
      for (var s = 0; s < 2; s++) {
        var c1 = takeRandomCell(); if (c1) S.swords[Game.utils.key(c1.x,c1.y)] = true;
      }
      for (var p = 0; p < 10; p++) {
        var c2 = takeRandomCell(); if (c2) S.potions[Game.utils.key(c2.x,c2.y)] = true;
      }

      S.initiative = [];
      S.initiativeRoundSize = 0;
      S.initiativeCursor = 0;
    }
  };
})(window);

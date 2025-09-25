// src/systems/turn.js
(function (root) {
  var Game = root.Game || (root.Game = {});
  var C = Game.C;

  function isFloor(x, y) {
    var S = Game.state;
    return Game.utils.inBounds(x, y) && S.grid[y][x] === C.TILE_FLOOR;
  }

  function isFree(x, y) {
    var S = Game.state;
    if (!isFloor(x, y)) return false;
    if (S.hero && S.hero.x === x && S.hero.y === y) return false;
    for (var i = 0; i < (S.enemies || []).length; i++) {
      var e = S.enemies[i];
      if (e.hp > 0 && e.x === x && e.y === y) return false;
    }
    return true;
  }

  function enemyAdjacentToHero(e) {
    var S = Game.state;
    var dx = Math.abs(e.x - S.hero.x);
    var dy = Math.abs(e.y - S.hero.y);
    return Math.max(dx, dy) === 1;
  }

  function enemyStepTowardsHero(e) {
    var S = Game.state, dx = S.hero.x - e.x, dy = S.hero.y - e.y;
    var ax = Math.abs(dx), ay = Math.abs(dy);
    var t1 = ax >= ay ? { x: e.x + (dx > 0 ? 1 : -1), y: e.y } : { x: e.x, y: e.y + (dy > 0 ? 1 : -1) };
    var t2 = ax >= ay ? { x: e.x, y: e.y + (dy > 0 ? 1 : -1) } : { x: e.x + (dx > 0 ? 1 : -1), y: e.y };
    if (isFree(t1.x, t1.y)) { e.x = t1.x; e.y = t1.y; return true; }
    if (isFree(t2.x, t2.y)) { e.x = t2.x; e.y = t2.y; return true; }
    return false;
  }

  function enemyIdleStep(e) {
    if (Math.random() > (C.ENEMY_IDLE_MOVE_CHANCE || 0)) return false;
    var d = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; }
    for (var k = 0; k < d.length; k++) {
      var nx = e.x + d[k].x, ny = e.y + d[k].y;
      if (isFree(nx, ny)) { e.x = nx; e.y = ny; return true; }
    }
    return false;
  }

  function heroPickupIfAny() {
    var S = Game.state, K = Game.utils.key(S.hero.x, S.hero.y);
    if (S.potions && S.potions[K]) { delete S.potions[K]; S.hero.hp = Math.min(S.hero.maxHp, S.hero.hp + (C.POTION_HEAL || 1)); }
    if (S.swords && S.swords[K])  { delete S.swords[K];  S.hero.atk += (C.SWORD_ATK_BONUS || 1); }
  }

  function giveHeroXp(amount) {
    var H = Game.state.hero;
    H.xp += amount;
    while (H.xp >= H.xpNeed) {
      H.xp -= H.xpNeed;
      H.level += 1;
      H.maxHp += (C.LEVEL_HP_DELTA || 1);
      H.hp = Math.min(H.maxHp, H.hp + (C.LEVEL_HP_DELTA || 1));
      H.apMax += (C.LEVEL_AP_DELTA || 0);
      H.xpNeed += 1;
    }
  }

  // ---- победа/поражение ---------------------------------------------------
  function anyEnemiesAlive() {
    var S = Game.state, arr = (S.enemies || []);
    for (var i = 0; i < arr.length; i++) if (arr[i] && arr[i].hp > 0) return true;
    return false;
  }
  function showVictoryOnce() {
    var S = Game.state;
    if (S._winShown) return;
    S._winShown = true;
    try { window.dispatchEvent(new CustomEvent('game:win')); }
    catch (_) { alert('Вы победили всех противников! Перегенерируйте карту, чтобы начать заново.'); }
  }
  function checkVictory() {
    if (!anyEnemiesAlive()) { showVictoryOnce(); return true; }
    return false;
  }

  // ----------------- инициатива -----------------
  function buildRoundOrder() {
    var S = Game.state;
    var order = [{ kind: 'hero' }];
    var sorted = (S.enemies || []).slice()
      .filter(function (e) { return e.hp > 0; })
      .sort(function (a, b) { return (b.apMax || 1) - (a.apMax || 1); });
    for (var i = 0; i < sorted.length; i++) order.push({ kind: 'enemy', id: sorted[i].id });
    S.initiativeRoundSize = order.length;
    return order;
  }

  function ensureTwoRoundsTape() {
    var S = Game.state;
    var needBuild = !Array.isArray(S.initiative) || S.initiative.length === 0 || !S.initiativeRoundSize;
    if (needBuild) {
      var r1 = buildRoundOrder(), r2 = buildRoundOrder();
      S.initiative = r1.concat(r2);
      S.initiativeCursor = 0;
      return;
    }
    if (S.initiativeCursor >= S.initiativeRoundSize) {
      var next = buildRoundOrder();
      S.initiative = S.initiative.slice(S.initiativeRoundSize).concat(next);
      S.initiativeCursor -= S.initiativeRoundSize;
    }
  }

  function rebuildInitiativeAfterDeaths() {
    var S = Game.state;
    var r1 = buildRoundOrder();
    var r2 = buildRoundOrder();
    S.initiative = r1.concat(r2);
    S.initiativeRoundSize = r1.length;
    S.initiativeCursor = 0; 
  }

  function setActive(kind, id) {
    var S = Game.state;
    S.activeKind = kind;
    S.activeEnemyId = (kind === 'enemy') ? id : null;
  }

  function runEnemyTurnFullAP(e) {
    var S = Game.state;
    e.ap = Math.max(0, e.apMax | 0);
    var safety = 64;

    while (e.ap > 0 && safety-- > 0) {
      if ((e.alert | 0) > 0) {
        if (enemyAdjacentToHero(e)) {
          S.hero.hp -= e.atk;     
          e.ap -= 1;
          if (S.hero.hp <= 0) { S.hero.hp = 0; Game.turn.gameOver(); return true; }
        } else {
          if (enemyStepTowardsHero(e)) e.ap -= 1; else e.ap -= 1; // «ждём», если застряли
        }
      } else {
        if (enemyIdleStep(e)) e.ap -= 1; else e.ap -= 1;
      }
    }
    if (e.alert > 0) e.alert -= 1;
    return false;
  }

  function showVictoryOnce() {
    var S = Game.state;
    if (S._winShown) return;
    S._winShown = true;

    alert('Вы победили всех противников! Перегенерируйте карту, чтобы начать заново.');
  }


  // ----------------- ПУБЛИЧНОЕ API turn -----------------
  Game.turn = {
    startLevel: function () {
      var S = Game.state;
      S.turn = 'hero';
      S.round = 1;
      S._winShown = false;

      S.hero.ap = S.hero.apMax;

      for (var i = 0; i < (S.enemies || []).length; i++) {
        var e = S.enemies[i];
        e.ap = e.apMax;
        e.alert = e.alert || 0;
        if (e.skipAlt) {
          if (e.altPhase == null) e.altPhase = (e.id % 2); 
        } else {
          e.altPhase = null;
        }
      }
      ensureTwoRoundsTape();
      setActive('hero', null);

      if (checkVictory()) return; 
      Game.render.draw();
    },

    // ---------- герой ----------
    heroTryMove: function (dx, dy) {
      var S = Game.state; if (S.turn !== 'hero' || S.hero.ap <= 0) return;
      var tx = S.hero.x + dx, ty = S.hero.y + dy;
      if (!isFree(tx, ty)) return;
      S.hero.x = tx; S.hero.y = ty; heroPickupIfAny();
      S.hero.ap -= 1;
      Game.render.draw();
      if (S.hero.ap <= 0) Game.turn.beginEnemiesPhase();
    },

    heroAttack: function () {
      var S = Game.state; if (S.turn !== 'hero' || S.hero.ap <= 0) return;

      var killed = [];
      var x0 = S.hero.x, y0 = S.hero.y;

      var byXY = {};
      for (var j = 0; j < S.enemies.length; j++) {
        var ee = S.enemies[j]; if (ee.hp > 0) byXY[ee.x + ',' + ee.y] = ee;
      }

      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          var enemy = byXY[(x0 + dx) + ',' + (y0 + dy)];
          if (enemy) {
            enemy.hp -= S.hero.atk;
            if (enemy.hp <= 0) { enemy.hp = 0; killed.push(enemy); }
          }
        }
      }

      if (killed.length) {
        var xpGain = 0;
        for (var q = 0; q < killed.length; q++)
          xpGain += (killed[q].xpValue != null ? killed[q].xpValue : (killed[q].apMax || 1));
        giveHeroXp(xpGain);

        rebuildInitiativeAfterDeaths();
      }

      S.hero.ap -= 1;
      Game.render.draw();

      var afterFx = function () {
        if (checkVictory()) return;
        if (S.hero.ap <= 0) Game.turn.beginEnemiesPhase(); else Game.render.draw();
      };
      if (Game.fx && typeof Game.fx.attackRipple === 'function') {
        Game.fx.attackRipple(S.hero.x, S.hero.y, afterFx);
      } else {
        afterFx();
      }
    },

    // ---------- враги ----------
    beginEnemiesPhase: function () {
      var S = Game.state;
      S.turn = 'enemies';
      setActive(null, null);
      ensureTwoRoundsTape();

      var i = S.initiativeCursor + 1;
      var hardStop = S.initiative.length;
      while (i < S.initiative.length && hardStop-- > 0) {
        var node = S.initiative[i];
        if (!node || node.kind === 'hero') break;

        if (node.kind === 'enemy') {
          var e = null;
          for (var k = 0; k < S.enemies.length; k++) if (S.enemies[k].id === node.id) { e = S.enemies[k]; break; }
          if (!e || e.hp <= 0) { i++; continue; }

          if (e.skipAlt && ((S.round % 2) !== e.altPhase)) { i++; continue; }

          setActive('enemy', e.id);

          var dist = Game.utils.manhattan({ x: e.x, y: e.y }, { x: S.hero.x, y: S.hero.y });
          if (dist <= (C.ENEMY_AGGRO_RADIUS || 6))
            e.alert = Math.max(e.alert | 0, (C.ENEMY_ALERT_TURNS || 6));

          var heroDied = runEnemyTurnFullAP(e);
          if (heroDied) return;

          Game.render.draw();
        }
        i++;
      }

      S.initiativeCursor = i < S.initiative.length ? i : S.initiative.length - 1;
      S.turn = 'hero';
      setActive('hero', null);
      S.hero.ap = S.hero.apMax;
      S.round = (S.round || 1) + 1;

      ensureTwoRoundsTape();
      if (checkVictory()) return;
      Game.render.draw();
    },

    gameOver: function () {
      alert('Герой пал. Перегенерируй карту и попробуй снова!');
    }
  };
})(window);

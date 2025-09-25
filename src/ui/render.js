(function (root) {
  var Game = root.Game || (root.Game = {});

  function tileVariantClass(isFloor, x, y) {
    var C = Game.C;
    if (isFloor) return 'floor';
    var w = Game.rng.variantIndex(C.WALL_VARIANTS, x, y, 67890);
    return 'wall wall' + w;
  }

  function makeHpBar(hp, maxHp) {
    var hb = document.createElement('div');
    hb.className = 'health';
    var fill = document.createElement('i');
    var pct = maxHp > 0 ? Math.max(0, Math.round((hp / maxHp) * 100)) : 0;
    fill.style.width = pct + '%';
    hb.appendChild(fill);
    return hb;
  }

  var fieldEl, initEl, tipEl;
  var hpText, atkText, apText, lvlText, turnText, xpText, xpFill;

  function ensureTip() {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.id = 'hoverTip';
      document.body.appendChild(tipEl);
    }
    return tipEl;
  }
  function hideTip() {
    if (tipEl) tipEl.style.display = 'none';
  }
  function showTip(html, x, y) {
    ensureTip();
    tipEl.innerHTML = html;
    tipEl.style.display = 'block';
    var pad = 14;
    tipEl.style.left = (x + pad) + 'px';
    tipEl.style.top  = (y + pad) + 'px';
  }

  // ==== Панель инициативы (только текущий раунд) ============================
  function drawInitiative() {
    var S = Game.state;
    if (!initEl || !S || !Array.isArray(S.initiative)) return;

    while (initEl.firstChild) initEl.removeChild(initEl.firstChild);

    var title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'Инициатива';
    initEl.appendChild(title);

    var list = document.createElement('div');
    list.className = 'initiative-list';
    initEl.appendChild(list);

    var tape = S.initiative;
    if (!tape.length) return;

    var start = Math.max(0, S.initiativeCursor || 0);
    while (start > 0 && tape[start].kind !== 'hero') start--;
    var end = start + 1;
    while (end < tape.length && tape[end].kind !== 'hero') end++;

    var roundSlice = tape.slice(start, end);

    var byId = {};
    for (var i = 0; i < (S.enemies || []).length; i++) byId[S.enemies[i].id] = S.enemies[i];

    var activeIdx = -1;
    if (S.turn === 'enemies' && S.activeKind === 'enemy' && S.activeEnemyId != null) {
      for (var ai = 0; ai < roundSlice.length; ai++) {
        var n = roundSlice[ai];
        if (n && n.kind === 'enemy' && n.id === S.activeEnemyId) { activeIdx = ai; break; }
      }
    }

    var hoverKind = S.uiHoverHero ? 'hero' : (S.uiHoverEnemyId ? 'enemy' : null);
    var hoverId   = S.uiHoverEnemyId || null;

    for (var k = 0; k < roundSlice.length; k++) {
      var node = roundSlice[k];
      if (!node) continue;

      var item = document.createElement('div');
      item.className = 'init-item';

      var isActive =
        (S.activeKind === node.kind) &&
        (node.kind === 'hero' || (node.kind === 'enemy' && S.activeEnemyId === node.id));
      if (isActive) item.className += ' active';

      var isHover =
        (hoverKind === node.kind) &&
        (node.kind === 'hero' || (node.kind === 'enemy' && hoverId === node.id));
      if (isHover) item.className += ' hover';

      var ava = document.createElement('div'); ava.className = 'init-ava';
      var name = document.createElement('div'); name.className = 'init-name';
      var ap   = document.createElement('div'); ap.className = 'init-ap';
      var hp   = document.createElement('div'); hp.className = 'init-hp';
      var fill = document.createElement('i');

      if (node.kind === 'hero') {
        item.className += ' hero-card lv' + Math.max(1, Math.min(5, (S.hero.level || 1)));
        name.textContent = 'Герой';
        ap.textContent   = 'AP ' + (S.hero.ap != null ? S.hero.ap : S.hero.apMax);
        fill.style.width = Math.max(0, Math.round((S.hero.hp / S.hero.maxHp) * 100)) + '%';
        hp.appendChild(fill);

        item.addEventListener('mouseenter', function () {
          S.uiHoverEnemyId = null; S.uiHoverHero = true; Game.render.draw();
        }, false);
        item.addEventListener('mouseleave', function () {
          S.uiHoverHero = false; Game.render.draw();
        }, false);

      } else if (node.kind === 'enemy') {
        var e = byId[node.id];
        if (!e) continue;
        item.setAttribute('data-id', String(e.id));
        var tier = Math.max(1, Math.min(4, e.tier || 1));
        item.className += ' t' + tier;

        name.textContent = e.name || ('моб' + e.id);

        var available = !(e.skipAlt && ((S.round % 2) !== e.altPhase));

        var displayAP = 0;
        if (!available) {
          item.className += ' init-skip';
          ap.textContent = 'пропуск';
        } else {
          if (S.turn !== 'enemies') {
            displayAP = (e.apMax != null ? e.apMax : (e.ap != null ? e.ap : 1));
          } else {
            if (activeIdx === -1) {
              displayAP = (e.apMax != null ? e.apMax : (e.ap != null ? e.ap : 1));
            } else if (k < activeIdx) {
              displayAP = 0;
            } else if (k === activeIdx) {
              displayAP = (e.ap != null ? e.ap : (e.apMax != null ? e.apMax : 1));
            } else {
              displayAP = (e.apMax != null ? e.apMax : (e.ap != null ? e.ap : 1));
            }
          }
          ap.textContent = 'AP ' + displayAP;
        }

        fill.style.width = Math.max(0, Math.round((e.hp / e.maxHp) * 100)) + '%';
        hp.appendChild(fill);

        item.addEventListener('mouseenter', function () {
          var idStr = this.getAttribute('data-id');
          S.uiHoverEnemyId = idStr ? parseInt(idStr, 10) : null;
          S.uiHoverHero = false;
          Game.render.draw();
        }, false);
        item.addEventListener('mouseleave', function () {
          S.uiHoverEnemyId = null; Game.render.draw();
        }, false);
      }

      item.appendChild(ava);
      item.appendChild(name);
      item.appendChild(ap);
      item.appendChild(hp);
      list.appendChild(item);
    }
  }
  // ==== Публичный API рендера ==============================================
  Game.render = {
    mount: function () {
      fieldEl = document.getElementById('field');
      initEl  = document.getElementById('initiative');

      hpText   = document.getElementById('hpText');
      atkText  = document.getElementById('atkText');
      apText   = document.getElementById('apText');
      lvlText  = document.getElementById('lvlText');
      turnText = document.getElementById('turnText');
      xpText   = document.getElementById('xpText');
      xpFill   = document.getElementById('xpFill');

      var C = Game.C;
      if (fieldEl) {
        fieldEl.style.setProperty('--cols', String(C.WIDTH));
        fieldEl.style.setProperty('--rows', String(C.HEIGHT));
      } else {
        console.warn('[render] #field не найден');
      }
      if (!initEl) console.warn('[render] #initiative не найден — панель инициативы не будет отображаться');

      // Делегированный hover по полю: подсветить в инициативе и показать тултип
      if (fieldEl && !fieldEl.__hoverBound) {
        fieldEl.addEventListener('mousemove', function (ev) {
          var target = ev.target;
          if (!target || !target.classList.contains('tile')) return;

          var x = target.dataset ? parseInt(target.dataset.x, 10) : NaN;
          var y = target.dataset ? parseInt(target.dataset.y, 10) : NaN;
          if (isNaN(x) || isNaN(y)) return;

          var S = Game.state, C = Game.C;
          var key = Game.utils ? Game.utils.key(x, y) : (x + ',' + y);

          var isHero = (S.hero && S.hero.x === x && S.hero.y === y);
          var enemy  = (!isHero && Game.entities && Game.entities.findEnemyAt) ? Game.entities.findEnemyAt(x, y) : null;
          var isPotion = !isHero && !enemy && S.potions && S.potions[key];
          var isSword  = !isHero && !enemy && !isPotion && S.swords && S.swords[key];

          // сброс подсветок по умолчанию
          S.uiHoverHero = false;
          S.uiHoverEnemyId = null;

          var html = '';
          if (isHero) {
            S.uiHoverHero = true;
            var H = S.hero;
            html = '<div class="tip-title">Герой</div>' +
                  '<div class="tip-row"><span>HP</span><b>' + H.hp + ' / ' + H.maxHp + '</b></div>' +
                  '<div class="tip-row"><span>ATK</span><b>' + H.atk + '</b></div>' +
                  '<div class="tip-row"><span>AP</span><b>' + (H.ap != null ? H.ap : H.apMax) + '</b></div>' +
                  '<div class="tip-row"><span>LV</span><b>' + (H.level || 1) + '</b></div>';
          } else if (enemy) {
            S.uiHoverEnemyId = enemy.id;
            html = '<div class="tip-title">' + (enemy.name || ('моб' + enemy.id)) + '</div>' +
                  '<div class="tip-row"><span>HP</span><b>' + enemy.hp + ' / ' + enemy.maxHp + '</b></div>' +
                  '<div class="tip-row"><span>ATK</span><b>' + enemy.atk + '</b></div>' +
                  '<div class="tip-row"><span>AP</span><b>' + (enemy.ap != null ? enemy.ap : enemy.apMax || 1) + '</b></div>' +
                  (enemy.skipAlt ? '<div class="tip-row"><span>Режим</span><b>через раунд</b></div>' : '');
          } else if (isPotion) {
            html = '<div class="tip-title">Зелье</div>' +
                  '<div class="tip-row"><span>Эффект</span><b>+' + (C.POTION_HEAL || 1) + ' HP</b></div>';
          } else if (isSword) {
            html = '<div class="tip-title">Меч</div>' +
                  '<div class="tip-row"><span>Эффект</span><b>+' + (C.SWORD_ATK_BONUS || 1) + ' ATK</b></div>';
          } else {
            hideTip();
            Game.render.draw();
            return;
          }

          showTip(html, ev.clientX, ev.clientY);
          Game.render.draw();
        }, false);

        fieldEl.addEventListener('mouseleave', function () {
          var S = Game.state;
          S.uiHoverHero = false;
          S.uiHoverEnemyId = null;
          hideTip();
          Game.render.draw();
        }, false);

        fieldEl.__hoverBound = true;
      }
    },

    draw: function () {
      var C = Game.C, S = Game.state;
      if (!fieldEl || !S || !S.grid || !S.hero) return;

      // --- поле -------------------------------------------------------------
      while (fieldEl.firstChild) fieldEl.removeChild(fieldEl.firstChild);

      for (var y = 0; y < C.HEIGHT; y++) {
        for (var x = 0; x < C.WIDTH; x++) {
          var el = document.createElement('div');
          var isFloor = (S.grid[y][x] === C.TILE_FLOOR);
          el.className = 'tile ' + tileVariantClass(isFloor, x, y);

          // координаты для hover-диспетчера
          el.dataset.x = String(x);
          el.dataset.y = String(y);

          if (S.hero.x === x && S.hero.y === y) {
            el.className += ' hero';
            if (S.uiHoverHero) el.className += ' highlight-hero';
            var lvl = Math.max(1, Math.min(5, (S.hero.level || 1)));
            el.className += ' lv' + lvl;
            el.appendChild(makeHpBar(S.hero.hp, S.hero.maxHp));
          } else {
            var enemy = Game.entities && Game.entities.findEnemyAt ? Game.entities.findEnemyAt(x, y) : null;
            if (enemy) {
              var tier = enemy.tier != null ? (' t' + Math.max(1, Math.min(4, enemy.tier))) : '';
              el.className += ' enemy' + tier;
              if (S.uiHoverEnemyId && enemy.id === S.uiHoverEnemyId) el.className += ' highlight';
              el.appendChild(makeHpBar(enemy.hp, enemy.maxHp));
            } else {
              var key = Game.utils ? Game.utils.key(x, y) : (x + ',' + y);
              if (S.swords && S.swords[key])       el.className += ' sword';
              else if (S.potions && S.potions[key]) el.className += ' potion';
            }
          }

          fieldEl.appendChild(el);
        }
      }

      // --- HUD --------------------------------------------------------------
      var H = S.hero;
      if (hpText)   hpText.textContent   = H.hp + ' / ' + H.maxHp;
      if (atkText)  atkText.textContent  = H.atk;
      if (apText)   apText.textContent   = (H.ap != null ? H.ap : H.apMax);
      if (lvlText)  lvlText.textContent  = 'Lv ' + (H.level || 1);
      if (turnText) turnText.textContent = (S.turn === 'hero') ? 'Ход героя' : 'Ход противников';

      if (xpText) {
        var need = Math.max(1, H.xpNeed || 1);
        var cur  = Math.max(0, H.xp || 0);
        var left = Math.max(0, need - cur);
        xpText.textContent = cur + ' / ' + need + (left > 0 ? (' (осталось ' + left + ')') : ' (уровень!)');
      }
      if (xpFill) {
        var pct = H.xpNeed > 0 ? Math.max(0, Math.min(100, Math.round((H.xp / H.xpNeed) * 100))) : 0;
        xpFill.style.width = pct + '%';
      }

      // --- инициатива -------------------------------------------------------
      drawInitiative();
    },

    getFieldEl: function () {
      return fieldEl || document.getElementById('field');
    },
    getTileEl: function (x, y) {
      var C = Game.C;
      var f = this.getFieldEl();
      if (!f) return null;
      var idx = y * C.WIDTH + x;
      return f.children && f.children[idx] ? f.children[idx] : null;
    }
  };
})(window);

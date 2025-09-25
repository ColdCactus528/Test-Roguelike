(function (root) {
  var Game = root.Game || (root.Game = {});
  var C = Game.C || (Game.C = {});

  // Карта
  C.WIDTH  = 40;
  C.HEIGHT = 24;

  // Типы тайлов
  C.TILE_WALL  = 0;
  C.TILE_FLOOR = 1;

  // Комнаты
  C.MIN_ROOMS = 5;  C.MAX_ROOMS = 10;
  C.ROOM_MIN  = 3;  C.ROOM_MAX  = 8;

  // Коридоры на всю карту
  C.H_CORRIDORS_MIN = 3; C.H_CORRIDORS_MAX = 5;
  C.V_CORRIDORS_MIN = 3; C.V_CORRIDORS_MAX = 5;

  // Для рендера
  C.WALL_VARIANTS  = 3;   
  C.FLOOR_VARIANTS = 1;

  // ===== Лут и количество сущностей
  C.ENEMIES_COUNT = 10;
  C.POTIONS_COUNT = 10;
  C.SWORDS_COUNT  = 2;

  // Эффекты предметов
  C.POTION_HEAL       = 3;  // сколько лечит зелье
  C.SWORD_ATK_BONUS   = 1;  // +к урону от меча

  // ===== Герой / левелинг
  C.HERO_BASE_HP     = 3;  // стартовое HP
  C.HERO_BASE_ATK    = 1;   // стартовый урон
  C.HERO_BASE_APMAX  = 2;   // стартовые очки действия

  // при апе уровня:
  C.LEVEL_HP_DELTA   = 1;   // +к максимальному HP
  C.LEVEL_AP_DELTA   = 1;   // +к максимальным AP

  // ===== ИИ/агро
  C.ENEMY_AGGRO_RADIUS     = 7;    // радиус "вижу героя"
  C.ENEMY_ALERT_TURNS      = 4;    // враг помнит героя ещё столько ходов
  C.ENEMY_IDLE_MOVE_CHANCE = 0.5;  // шанс случайного шага, когда спокоен

  // ===== Типы врагов (яркость ~ tier, XP = apMax)
  C.ENEMY_TYPES = {
    ZAURYAD:    { name:'Заурядный Квадрат',    hp:1,  atk:1, apMax:1, tier:1, skipAlt:false, xp:1 },
    KVADRAT:    { name:'Квадрат',              hp:3,  atk:1, apMax:2, tier:2, skipAlt:false, xp:2 },
    NE_ZAURYAD: { name:'Не Заурядный Квадрат', hp:5,  atk:2, apMax:2, tier:3, skipAlt:true,  xp:4 }, // ходит через ход
    MEGA:       { name:'Мега Квадрат',         hp:15, atk:2, apMax:3, tier:4, skipAlt:true,  xp:8 }  // ходит через ход
  };

})(window);

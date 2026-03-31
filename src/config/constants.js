// --- Mundo ---
export const TILE_SIZE = 16
export const SCALE    = 2          // factor de escala global (16px → 32px en pantalla)

// --- Player ---
export const PLAYER_SPEED        = 180
export const PLAYER_JUMP_FORCE   = -340
export const PLAYER_LIVES        = 3

// --- Enemigo ---
export const ENEMY_SPEED         = 60
export const ENEMY_PATROL_RANGE  = 80  // píxeles que patrulla hacia cada lado

// --- Puntuación ---
export const SCORE_ENEMY_KILL    = 100
export const SCORE_COIN          = 50

// --- Nombres de escenas (evita typos al llamar scene.start) ---
export const SCENES = {
  MENU:      'MenuScene',
  GAME:      'GameScene',
  MIRROR:   'MirrorScene',
  GAME_OVER: 'GameOverScene',
}

// --- Nombres de assets (evita typos al cargar/usar) ---
export const ASSETS = {
  // Sprites
  PLAYER:   'player',
  GOOMBA:   'goomba',
  KOOPA:    'koopa',
  SHELL:    'shell',

  // Audio
  MUSIC:    'music',
  SFX_JUMP: 'sfx_jump',
  SFX_KILL: 'sfx_kill',
  SFX_HURT: 'sfx_hurt',
}
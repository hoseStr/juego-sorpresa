import Phaser from "phaser";
import {
  SCENES,
  ASSETS,
  SCALE,
  SCORE_ENEMY_KILL,
} from "../config/constants.js";
import { Player } from "../entities/Player.js";
import { HUD } from "../ui/HUD.js";
import { AudioManager } from "../managers/AudioManager.js";
import { scoreManager } from "../managers/ScoreManager.js";

// Dimensiones del mundo (en píxeles de pantalla)
const WORLD_WIDTH = 3072; // ~6 pantallas de ancho — ajusta cuando tengas el mapa
const WORLD_HEIGHT = 576;

export class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  // ── 1. Carga de assets ────────────────────────────────────────────────────
  preload() {
    // --- Player ---
    // mario.png del repo de midudev: el spritesheet tiene frames de 18x16 px
    // Si ves que los frames se cortan, prueba frameWidth: 16
    this.load.spritesheet(ASSETS.PLAYER, "assets/entities/mario.png", {
      frameWidth: 18,
      frameHeight: 16,
    });

    // --- Suelo (imagen que se repetirá como tiles) ---
    this.load.image("floorbricks", "assets/scenery/overworld/floorbricks.png");

    // --- Audio (solo jump por ahora, sin música hasta tener el BGM) ---
    this.load.audio(ASSETS.SFX_JUMP, "assets/sound/effects/jump.mp3");
  }

  // ── 2. Construcción de la escena ──────────────────────────────────────────
  create() {
    // --- Fondo ---
    this.cameras.main.setBackgroundColor("#5c94fc");

    // --- Límites del mundo ---
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // --- Suelo con física estática ---
    // Usamos un grupo estático y llenamos el ancho del mundo con la imagen del suelo
    this._ground = this.physics.add.staticGroup();
    this._buildGround();

    // --- Plataformas elevadas de prueba ---
    this._buildPlatform(400, WORLD_HEIGHT - 128, 3);
    this._buildPlatform(700, WORLD_HEIGHT - 192, 5);
    this._buildPlatform(1100, WORLD_HEIGHT - 160, 4);

    // --- Animaciones del player (se crean una vez, en la escena) ---
    this._createPlayerAnimations();

    // --- Player ---
    this._player = new Player(this, 80, WORLD_HEIGHT - 80);
    this._player.setScale(SCALE);

    // --- Colisión player ↔ suelo ---
    this.physics.add.collider(this._player, this._ground);

    // --- Cámara ---
    this.cameras.main
      .setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
      .startFollow(this._player, true, 0.1, 0.1);

    // --- Controles ---
    this._cursors = this.input.keyboard.createCursorKeys();

    // --- Audio (sin música todavía) ---
    this._audio = new AudioManager(this);

    // --- HUD ---
    this._hud = new HUD(this);

    // Zoom para que se vea la misma cantidad de mundo que con 512x288
    this.cameras.main.setZoom(window.innerHeight / 288);

    // Si el usuario redimensiona la ventana, recalcula el zoom
    this.scale.on("resize", (gameSize) => {
      this.cameras.main.setZoom(gameSize.height / 288);
    });

    // --- DEBUG: muestra hitboxes si necesitas ajustar el cuerpo del player ---
    // this.physics.world.createDebugGraphic()
  }

  // ── 3. Loop de juego ──────────────────────────────────────────────────────
  update() {
    this._player.update(this._cursors, this._audio);
    this._hud.update(this._player);

    // Muere si cae fuera del mundo
    if (this._player.y > WORLD_HEIGHT + 100) {
      this._playerDie();
    }
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  /**
   * Rellena el suelo con la imagen de floorbricks a lo ancho del mundo.
   * floorbricks.png del repo es una imagen de 32×32 px (2 tiles de 16px apilados).
   * El suelo ocupa las últimas 2 filas de la pantalla.
   */
  _buildGround() {
    const tileW = 32; // ancho de floorbricks.png en px
    const y = WORLD_HEIGHT - 32;

    for (let x = 0; x < WORLD_WIDTH; x += tileW) {
      // Fila inferior
      this._ground
        .create(x + tileW / 2, y + 16, "floorbricks")
        .setOrigin(0.5)
        .refreshBody();
    }
  }

  /**
   * Crea una plataforma flotante en (x, y) con `count` tiles de ancho.
   */
  _buildPlatform(x, y, count) {
    const tileW = 32;
    for (let i = 0; i < count; i++) {
      this._ground
        .create(x + i * tileW + tileW / 2, y, "floorbricks")
        .setOrigin(0.5)
        .refreshBody();
    }
  }

  /**
   * Define las animaciones de Mario a partir del spritesheet cargado.
   *
   * Frames de mario.png (midudev):
   *   0 → idle
   *   1,2,3 → walk
   *   5 → jump
   *
   * ⚠️ Si los frames se ven mal, activa el debug de física y observa qué frame
   * aparece en cada estado — ajusta los números aquí.
   */
  _createPlayerAnimations() {
    const anims = this.anims;

    // Evita recrear animaciones si la escena se reinicia
    if (anims.exists("player_idle")) return;

    anims.create({
      key: "player_idle",
      frames: anims.generateFrameNumbers(ASSETS.PLAYER, { start: 0, end: 0 }),
      frameRate: 4,
      repeat: -1,
    });

    anims.create({
      key: "player_walk",
      frames: anims.generateFrameNumbers(ASSETS.PLAYER, { start: 1, end: 3 }),
      frameRate: 12,
      repeat: -1,
    });

    anims.create({
      key: "player_jump",
      frames: anims.generateFrameNumbers(ASSETS.PLAYER, { start: 5, end: 5 }),
      frameRate: 1,
      repeat: 0,
    });
  }

  _playerDie() {
    this.scene.start(SCENES.GAME_OVER, { score: scoreManager.score });
  }
}

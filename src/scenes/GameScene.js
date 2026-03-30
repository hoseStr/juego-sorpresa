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

const WORLD_WIDTH = 3072;
const WORLD_HEIGHT = 576;

const SPAWN_DELAY_MIN = 2000;
const SPAWN_DELAY_MAX = 4500;

export class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  preload() {
    this.load.spritesheet(ASSETS.PLAYER, "assets/entities/mario.png", {
      frameWidth: 18,
      frameHeight: 16,
    });

    this.load.spritesheet(
      ASSETS.GOOMBA,
      "assets/entities/overworld/goomba.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      },
    );

    this.load.image("floorbricks", "assets/scenery/overworld/floorbricks.png");
    this.load.audio(ASSETS.SFX_JUMP, "assets/sound/effects/jump.mp3");
    this.load.audio(ASSETS.SFX_KILL, "assets/sound/effects/goomba-stomp.wav");
  }

  create() {
    this.add
      .rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x5c94fc)
      .setOrigin(0, 0)
      .setDepth(-10);

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this._ground = this.physics.add.staticGroup();
    this._buildGround();
    this._buildPlatform(400, WORLD_HEIGHT - 128, 3);
    this._buildPlatform(700, WORLD_HEIGHT - 192, 5);
    this._buildPlatform(1100, WORLD_HEIGHT - 160, 4);

    this._createPlayerAnimations();
    this._createGoombaAnimations();

    this._player = new Player(this, 80, WORLD_HEIGHT - 80);
    this._player.setScale(SCALE);

    this._goombas = this.physics.add.group();

    this.physics.add.collider(this._player, this._ground);
    this.physics.add.collider(this._goombas, this._ground);
    this.physics.add.overlap(
      this._player,
      this._goombas,
      this._handlePlayerGoombaOverlap,
      null,
      this,
    );

    this.cameras.main
      .setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
      .startFollow(this._player, true, 0.1, 0.1);

    this._cursors = this.input.keyboard.createCursorKeys();
    this._audio = new AudioManager(this);
    this._hud = new HUD(this);

    this.cameras.main.setZoom(window.innerHeight / 288);
    this.scale.on("resize", (gameSize) => {
      this.cameras.main.setZoom(gameSize.height / 288);
    });

    this._scheduleNextSpawn();
  }

  update() {
    this._player.update(this._cursors, this._audio);
    this._hud.update(this._player);

    this._goombas.getChildren().forEach((g) => {
      if (g.active) this._updateGoomba(g);
    });

    if (this._player.y > WORLD_HEIGHT + 100) {
      this._playerDie();
    }
  }

  // ── Spawner ───────────────────────────────────────────────────────────────

  _scheduleNextSpawn() {
    const delay = Phaser.Math.Between(SPAWN_DELAY_MIN, SPAWN_DELAY_MAX);
    this.time.delayedCall(delay, () => {
      this._spawnGoomba();
      this._scheduleNextSpawn();
    });
  }

  _spawnGoomba() {
    const fromLeft = Phaser.Math.Between(0, 1) === 0;

    const visibleHalfW = window.innerWidth / this.cameras.main.zoom / 2;
    const camLeft = this._player.x - visibleHalfW;
    const camRight = this._player.x + visibleHalfW;

    const spawnX = fromLeft
      ? Math.max(0, camLeft - 32)
      : Math.min(WORLD_WIDTH, camRight + 32);

    const goomba = this._goombas.create(
      spawnX,
      WORLD_HEIGHT - 80,
      ASSETS.GOOMBA,
    );
    goomba.setScale(SCALE);
    goomba.setCollideWorldBounds(true);
    goomba.setBounceX(1);
    goomba._isDead = false;

    const speed = Phaser.Math.Between(40, 80);
    goomba.setVelocityX(fromLeft ? speed : -speed);
    goomba.anims.play("goomba_walk", true);
  }

  _updateGoomba(goomba) {
    if (goomba._isDead) return;
    goomba.setFlipX(goomba.body.velocity.x > 0);
  }

  _handlePlayerGoombaOverlap(player, goomba) {
    if (goomba._isDead) return;

    const playerFalling = player.body.velocity.y > 0;
    const playerAbove = player.body.bottom < goomba.body.center.y + 6;

    if (playerFalling && playerAbove) {
      goomba._isDead = true;
      goomba.setVelocityX(0);
      goomba.body.allowGravity = false;
      goomba.anims.play("goomba_dead", true);
      this._audio.kill();

      scoreManager.add(SCORE_ENEMY_KILL);
      player.setVelocityY(-260);

      this.time.delayedCall(400, () => {
        if (goomba?.active) goomba.destroy();
      });
    } else {
      if (player.hurt(this._audio)) {
        if (player.isDead) this._playerDie();
      }
    }
  }

  // ── Animaciones ───────────────────────────────────────────────────────────

  _createGoombaAnimations() {
    const anims = this.anims;
    if (anims.exists("goomba_walk")) return;

    // goomba.png: 48x16 → 3 frames de 16x16
    // 0=walk1  1=walk2  2=dead
    anims.create({
      key: "goomba_walk",
      frames: anims.generateFrameNumbers(ASSETS.GOOMBA, { start: 0, end: 1 }),
      frameRate: 6,
      repeat: -1,
    });

    anims.create({
      key: "goomba_dead",
      frames: anims.generateFrameNumbers(ASSETS.GOOMBA, { start: 2, end: 2 }),
      frameRate: 1,
      repeat: 0,
    });
  }

  _createPlayerAnimations() {
    const anims = this.anims;
    if (anims.exists("player_idle")) return;

    anims.create({
      key: "player_idle",
      frames: anims.generateFrameNumbers(ASSETS.PLAYER, { start: 0, end: 0 }),
      frameRate: 1,
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
    anims.create({
      key: "player_death",
      frames: anims.generateFrameNumbers(ASSETS.PLAYER, { start: 4, end: 4 }),
      frameRate: 1,
      repeat: 0,
    });
  }

  // ── Suelo / Plataformas ───────────────────────────────────────────────────

  _buildGround() {
    const tileW = 32;
    const y = WORLD_HEIGHT - 32;
    for (let x = 0; x < WORLD_WIDTH; x += tileW) {
      this._ground
        .create(x + tileW / 2, y + 16, "floorbricks")
        .setOrigin(0.5)
        .refreshBody();
    }
  }

  _buildPlatform(x, y, count) {
    const tileW = 32;
    for (let i = 0; i < count; i++) {
      this._ground
        .create(x + i * tileW + tileW / 2, y, "floorbricks")
        .setOrigin(0.5)
        .refreshBody();
    }
  }

  _playerDie() {
    // Por ahora no hace nada — la animación de muerte en Player.js lo maneja todo
  }
}

import Phaser from "phaser";
import { SCENES, ASSETS, SCALE, SCORE_ENEMY_KILL } from "../config/constants.js";
import { Player }       from "../entities/Player.js";
import { Npc }          from "../entities/Npc.js";
import { Goomba }       from "../entities/Goomba.js";
import { Koopa }        from "../entities/Koopa.js";
import { HUD }          from "../ui/HUD.js";
import { AudioManager } from "../managers/AudioManager.js";
import { scoreManager } from "../managers/ScoreManager.js";

const WORLD_WIDTH     = 3072;
const WORLD_HEIGHT    = 576;
const SPAWN_DELAY_MIN = 2000;
const SPAWN_DELAY_MAX = 4500;

export class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  preload() {
    this.load.spritesheet(ASSETS.PLAYER, "assets/entities/mario.png", {
      frameWidth: 18, frameHeight: 16,
    });
    this.load.spritesheet("mario_grown", "assets/entities/mario-grown.png", {
      frameWidth: 18, frameHeight: 32,
    });
    this.load.spritesheet(ASSETS.GOOMBA, "assets/entities/overworld/goomba.png", {
      frameWidth: 16, frameHeight: 16,
    });
    this.load.spritesheet(ASSETS.KOOPA, "assets/entities/koopa.png", {
      frameWidth: 16, frameHeight: 24,
    });
    this.load.spritesheet(ASSETS.SHELL, "assets/entities/shell.png", {
      frameWidth: 16, frameHeight: 15,
    });
    this.load.image("floorbricks", "assets/scenery/overworld/floorbricks.png");
    this.load.image("tube_medium",  "assets/scenery/vertical-medium-tube.png");
    this.load.audio(ASSETS.SFX_JUMP, "assets/sound/effects/jump.mp3");
    this.load.audio(ASSETS.SFX_KILL, "assets/sound/effects/goomba-stomp.wav");
  }

  // Recibe { playerX, playerY } cuando se vuelve desde MirrorScene
  create({ playerX = 80, playerY = WORLD_HEIGHT - 80 } = {}) {
    this.add
      .rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x5c94fc)
      .setOrigin(0, 0)
      .setDepth(-10);

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this._ground = this.physics.add.staticGroup();
    this._buildGround();
    this._buildPlatform(400,  WORLD_HEIGHT - 128, 3);
    this._buildPlatform(700,  WORLD_HEIGHT - 192, 5);
    this._buildPlatform(1100, WORLD_HEIGHT - 160, 4);
    this._buildTube(1600);

    this._npc = new Npc(this, 1100, WORLD_HEIGHT - 208, "mario_grown", 0);
    this._npc.setScale(SCALE);
    this._npc.setFlipX(true);

    this._createPlayerAnimations();
    Goomba.createAnims(this.anims, ASSETS.GOOMBA);
    Koopa.createAnims(this.anims, ASSETS.KOOPA, ASSETS.SHELL);

    // Player — usa la posición recibida (spawn normal o vuelta del espejo)
    this._player = new Player(this, playerX, playerY);
    this._player.setScale(SCALE);

    this._enemies = this.physics.add.group();

    this.physics.add.collider(this._player,  this._ground);
    this.physics.add.collider(this._enemies, this._ground);

    this.physics.add.collider(this._enemies, this._enemies, (a, b) => {
      const shell = (a instanceof Koopa && a.isShell && a.isShellMoving) ? a
                  : (b instanceof Koopa && b.isShell && b.isShellMoving) ? b
                  : null;
      const target = shell === a ? b : a;

      if (shell) {
        if (!target._isDead) target.die(this._audio, scoreManager);
        return;
      }
      if (!a._isDead && a.body.touching.right) a._direction = -1;
      if (!a._isDead && a.body.touching.left)  a._direction =  1;
      if (!b._isDead && b.body.touching.right) b._direction = -1;
      if (!b._isDead && b.body.touching.left)  b._direction =  1;
    });

    this.physics.add.overlap(this._enemies, this._enemies, (a, b) => {
      const shell = (a instanceof Koopa && a.isShell && a.isShellMoving) ? a
                  : (b instanceof Koopa && b.isShell && b.isShellMoving) ? b
                  : null;
      const target = shell === a ? b : a;
      if (!shell || !target || target._isDead) return;
      target.onStomped(shell, this._audio, scoreManager);
    });

    this.physics.add.collider(
      this._player,
      this._enemies,
      this._handlePlayerEnemyOverlap,
      null,
      this,
    );

    this.cameras.main
      .setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
      .startFollow(this._player, true, 0.1, 0.1);

    this._cursors = this.input.keyboard.createCursorKeys();
    this._audio   = new AudioManager(this);
    this._hud     = new HUD(this);

    this.cameras.main.setZoom(window.innerHeight / 288);
    this.scale.on("resize", (gameSize) => {
      this.cameras.main.setZoom(gameSize.height / 288);
    });

    // Tecla E — activa la dimensión espejo
    this._keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this._scheduleNextSpawn();

    // Fade in al entrar (también al volver del espejo)
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  update() {
    this._player.update(this._cursors, this._audio);
    this._hud.update(this._player);

    this._enemies.getChildren().forEach((e) => {
      if (e.active) e.update();
    });

    if (this._player.y > WORLD_HEIGHT + 100 && !this._player.isDead) {
      this._playerDie();
    }

    // Switch a MirrorScene
    if (Phaser.Input.Keyboard.JustDown(this._keyE)) {
      this._switchToMirror();
    }
  }

  // ── Switch a MirrorScene ──────────────────────────────────────────────────
  _switchToMirror() {
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start(SCENES.MIRROR, {
        playerX: this._player.x,
        playerY: this._player.y,
      });
    });
  }

  // ── Spawner ───────────────────────────────────────────────────────────────
  _scheduleNextSpawn() {
    const delay = Phaser.Math.Between(SPAWN_DELAY_MIN, SPAWN_DELAY_MAX);
    this.time.delayedCall(delay, () => {
      this._spawnEnemy();
      this._scheduleNextSpawn();
    });
  }

  _spawnEnemy() {
    const fromLeft     = Phaser.Math.Between(0, 1) === 0;
    const visibleHalfW = window.innerWidth / this.cameras.main.zoom / 2;
    const camLeft      = this._player.x - visibleHalfW;
    const camRight     = this._player.x + visibleHalfW;

    const spawnX = fromLeft
      ? Math.max(0,            camLeft  - 32)
      : Math.min(WORLD_WIDTH,  camRight + 32);

    const enemy = Phaser.Math.Between(0, 9) < 4
      ? new Koopa(this, spawnX, WORLD_HEIGHT - 80)
      : new Goomba(this, spawnX, WORLD_HEIGHT - 80);

    enemy.setScale(SCALE);
    enemy._direction = fromLeft ? 1 : -1;
    this._enemies.add(enemy);
  }

  // ── Colisión player ↔ enemigo ─────────────────────────────────────────────
  _handlePlayerEnemyOverlap(player, enemy) {
    if (enemy._isDead) return;

    if (enemy instanceof Koopa && enemy.isShell && enemy.isShellMoving) {
      enemy.onStomped(player, this._audio, scoreManager);
      player.setVelocityY(-260);
      return;
    }

    const playerFalling = player.body.velocity.y >= 0;
    const playerAbove   = player.body.bottom <= enemy.body.top + 12;

    if (playerFalling && playerAbove) {
      enemy.onStomped(player, this._audio, scoreManager);
    } else {
      if (player.hurt(this._audio)) {
        if (player.isDead) this._playerDie();
      }
    }
  }

  // ── Player animations ─────────────────────────────────────────────────────
  _createPlayerAnimations() {
    const anims = this.anims;
    if (anims.exists("player_idle")) return;

    anims.create({ key: "player_idle",  frames: anims.generateFrameNumbers(ASSETS.PLAYER, { start: 0, end: 0 }), frameRate: 1,  repeat: -1 });
    anims.create({ key: "player_walk",  frames: anims.generateFrameNumbers(ASSETS.PLAYER, { start: 1, end: 3 }), frameRate: 12, repeat: -1 });
    anims.create({ key: "player_jump",  frames: anims.generateFrameNumbers(ASSETS.PLAYER, { start: 5, end: 5 }), frameRate: 1,  repeat: 0  });
    anims.create({ key: "player_death", frames: anims.generateFrameNumbers(ASSETS.PLAYER, { start: 4, end: 4 }), frameRate: 1,  repeat: 0  });
  }

  // ── Suelo / Plataformas ───────────────────────────────────────────────────
  _buildGround() {
    const tileW = 32;
    const y     = WORLD_HEIGHT - 32;
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

  _buildTube(x) {
    const tube = this._ground
      .create(x, WORLD_HEIGHT - 48, "tube_medium")
      .setOrigin(0.5, 0.815)
      .refreshBody();
    tube.setScale(SCALE);
    tube.refreshBody();
  }

  _playerDie() {
    // La animación de muerte en Player.js maneja todo
  }
}
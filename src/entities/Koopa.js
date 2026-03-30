import { Enemy } from "./Enemy.js";
import { ASSETS, SCORE_ENEMY_KILL } from "../config/constants.js";

const SHELL_SPEED = 280; // velocidad del caparazón disparado

export class Koopa extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, ASSETS.KOOPA);
    this._isShell = false; // true cuando ya está en caparazón
    this._shellMoving = false; // true cuando el caparazón está en movimiento
    this._playAnim("koopa_walk");
  }

  // ── Al pisarlo: se convierte en caparazón quieto ──────────────────────────
  onStomped(player, audio, scoreManager) {
    if (this._isDead || this._justStomped) return; // ← bloquea llamadas repetidas

    this._justStomped = true;
    // se resetea cuando el player deja de estar encima
    this.scene.time.delayedCall(300, () => {
      this._justStomped = false;
    });

    if (!this._isShell) {
      this._isShell = true;
      this._shellMoving = false;
      this._speed = 0;
      this.anims.stop();
      this.setTexture(ASSETS.SHELL);
      this.setFrame(0);
      this.body.setSize(16, 15);
      this.body.setOffset(0, 0);
      this.refreshBody();
      this.setVelocityX(0);
      this.setVelocityY(0);
      scoreManager.add(SCORE_ENEMY_KILL);
      player.setVelocityY(-260);
      audio?.kill();

      this._startReviveTimer();
    } else if (!this._shellMoving) {
      this._reviveTimer?.remove();
      this._shellMoving = true;
      const dir = player.x < this.x ? 1 : -1;
      this._direction = dir;
      this._speed = SHELL_SPEED;
      this._playAnim("shell_spin");
      scoreManager.add(SCORE_ENEMY_KILL);
      player.setVelocityY(-260);
    } else {
      this._shellMoving = false;
      this._speed = 0;
      this.setVelocityX(0);
      this._playAnim("shell_idle");
      this._startReviveTimer();
    }
  }

  _startReviveTimer() {
    this._reviveTimer = this.scene.time.delayedCall(10000, () => {
      if (this._isShell && !this._shellMoving && this.active) {
        this._isShell = false;
        this._isDead = false;
        this._speed = Phaser.Math.Between(40, 80);
        this.setTexture(ASSETS.KOOPA);
        this.body.setSize(16, 24);
        this.body.setOffset(0, 0);
        this.refreshBody();
        this._playAnim("koopa_walk");
      }
    });
  }

  // ── Loop ──────────────────────────────────────────────────────────────────
  update() {
    if (this._isDead) return;

    if (this._isShell && !this._shellMoving) {
      this.setVelocityX(0); // fuerza quieto cada frame
      return;
    }

    if (this.body.blocked.right) this._direction = -1;
    if (this.body.blocked.left) this._direction = 1;

    this.setVelocityX(this._speed * this._direction);
    this.setFlipX(this._direction > 0);
    this._updateAnim();
  }

  _updateAnim() {
    if (this._isShell) {
      this._playAnim(this._shellMoving ? "shell_spin" : "shell_idle");
    } else {
      this._playAnim("koopa_walk");
    }
  }

  get isShell() {
    return this._isShell;
  }
  get isShellMoving() {
    return this._shellMoving;
  }

  // ── Animaciones estáticas ─────────────────────────────────────────────────
  static createAnims(anims, koopKey, shellKey) {
    if (anims.exists("koopa_walk")) return;

    // koopa.png: 32x24 → 2 frames de 16x24
    // 0=walk1  1=walk2
    anims.create({
      key: "koopa_walk",
      frames: anims.generateFrameNumbers(koopKey, { start: 0, end: 1 }),
      frameRate: 6,
      repeat: -1,
    });

    // shell.png: 32x15 → 2 frames de 16x15
    // 0=idle  1=spinning
    anims.create({
      key: "shell_idle",
      frames: anims.generateFrameNumbers(shellKey, { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1,
    });
    anims.create({
      key: "shell_spin",
      frames: anims.generateFrameNumbers(shellKey, { start: 0, end: 1 }),
      frameRate: 12,
      repeat: -1,
    });
  }
}

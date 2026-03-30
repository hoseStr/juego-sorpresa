import Phaser from "phaser";
import { SCORE_ENEMY_KILL } from "../config/constants.js";

/**
 * Clase base para todos los enemigos.
 * Goomba y Koopa heredan de aquí y solo sobreescriben lo que cambia.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    this._isDead = false;
    this._direction = 1; // 1=derecha, -1=izquierda
    this._speed = Phaser.Math.Between(40, 80);
  }

  // ── Loop — GameScene llama esto cada frame ────────────────────────────────
  update() {
    if (this._isDead) return;

    // Invierte si choca con pared estática
    if (this.body.blocked.right) this._direction = -1;
    if (this.body.blocked.left) this._direction = 1;

    this.setVelocityX(this._speed * this._direction);
    this.setFlipX(this._direction > 0);

    this._updateAnim();
  }

  // ── Sobreescribe en cada subclase ─────────────────────────────────────────

  /** Qué pasa cuando el player salta encima */
  onStomped(player, audio, scoreManager) {
    throw new Error("onStomped() debe implementarse en la subclase");
  }

  die(audio, scoreManager) {
    if (this._isDead) return;
    this._isDead = true;
    this.setVelocityX(0);
    this.body.allowGravity = false;
    this.anims.stop();
    audio?.kill();
    scoreManager?.add(SCORE_ENEMY_KILL);

    // Sale volando hacia arriba y luego cae fuera de pantalla
    this.scene.tweens.add({
      targets: this,
      y: this.y - 40,
      duration: 200,
      ease: "Power1",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          y: this.y + 400,
          duration: 500,
          ease: "Power2",
          onComplete: () => {
            if (this?.active) this.destroy();
          },
        });
      },
    });
  }
  /** Animación activa — cada subclase define sus keys */
  _updateAnim() {}

  // ── Helpers compartidos ───────────────────────────────────────────────────

  _playAnim(key) {
    if (this.scene.anims.exists(key) && this.anims.currentAnim?.key !== key) {
      this.anims.play(key, true);
    }
  }

  get isDead() {
    return this._isDead;
  }
}

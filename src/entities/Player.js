import { ASSETS, PLAYER_SPEED, PLAYER_JUMP_FORCE, PLAYER_LIVES } from '../config/constants.js'

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, x, y) {
    super(scene, x, y, ASSETS.PLAYER)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setCollideWorldBounds(true)

    // Hitbox más ajustado que el frame completo — descomenta y ajusta si ves
    // que el player "flota" o las colisiones se sienten raras
    // this.body.setSize(14, 16).setOffset(2, 0)

    this._lives  = PLAYER_LIVES
    this._isHurt = false
  }

  // ── Llamado cada frame desde GameScene.update() ───────────────────────────
  update (cursors, audio) {
    const onGround = this.body.blocked.down

    // ── Movimiento horizontal ──
    if (cursors.left.isDown) {
      this.setVelocityX(-PLAYER_SPEED)
      this.setFlipX(true)
      if (onGround) this._playAnim('player_walk')
    } else if (cursors.right.isDown) {
      this.setVelocityX(PLAYER_SPEED)
      this.setFlipX(false)
      if (onGround) this._playAnim('player_walk')
    } else {
      this.setVelocityX(0)
      if (onGround) this._playAnim('player_idle')
    }

    // ── Salto ──
    // Acepta flecha arriba O barra espaciadora
    const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) ||
                        Phaser.Input.Keyboard.JustDown(cursors.space)

    if (jumpPressed && onGround) {
      this.setVelocityY(PLAYER_JUMP_FORCE)
      audio?.jump()
    }

    // ── Animación en el aire ──
    if (!onGround) {
      this._playAnim('player_jump')
    }
  }

  // ── Daño ──────────────────────────────────────────────────────────────────
  hurt (audio) {
    if (this._isHurt) return false

    this._lives--
    this._isHurt = true
    audio?.hurt()

    // Parpadeo de invulnerabilidad durante 800 ms
    this.scene.tweens.add({
      targets:    this,
      alpha:      0.2,
      duration:   100,
      repeat:     4,
      yoyo:       true,
      onComplete: () => {
        this.setAlpha(1)
        this._isHurt = false
      },
    })

    return true
  }

  // ── Helper: reproduce anim solo si existe y no está ya corriendo ──────────
  _playAnim (key) {
    if (this.scene.anims.exists(key) && this.anims.currentAnim?.key !== key) {
      this.anims.play(key, true)
    }
  }

  get lives ()  { return this._lives }
  get isDead () { return this._lives <= 0 }
  get isHurt () { return this._isHurt }
}

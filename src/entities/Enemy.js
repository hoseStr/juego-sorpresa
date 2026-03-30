import { ASSETS, ENEMY_SPEED, ENEMY_PATROL_RANGE } from '../config/constants.js'

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, x, y) {
    super(scene, x, y, ASSETS.ENEMY)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setCollideWorldBounds(true)

    // Límites de patrullaje — se calculan desde la posición inicial
    this._originX = x
    this._direction = 1     // 1 = derecha, -1 = izquierda
    this._isDead = false
  }

  // --- Llamado cada frame desde GameScene.update() ---
  update () {
    if (this._isDead) return

    this.setVelocityX(ENEMY_SPEED * this._direction)
    this.anims.play('enemy_walk', true)
    this.setFlipX(this._direction === -1)

    // Voltea cuando llega al límite del rango de patrullaje
    const distFromOrigin = this.x - this._originX
    if (distFromOrigin > ENEMY_PATROL_RANGE)  this._direction = -1
    if (distFromOrigin < -ENEMY_PATROL_RANGE) this._direction =  1
  }

  // --- Muere aplastado por el player ---
  die (audio) {
    if (this._isDead) return
    this._isDead = true
    audio?.kill()

    this.setVelocityX(0)
    this.anims.play('enemy_dead', true)

    // Destruye el objeto después de la animación
    this.scene.time.delayedCall(400, () => this.destroy())
  }

  get isDead () { return this._isDead }
}

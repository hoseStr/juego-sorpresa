import { Enemy } from './Enemy.js'
import { ASSETS, SCORE_ENEMY_KILL } from '../config/constants.js'

export class Goomba extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, ASSETS.GOOMBA)
    this._playAnim('goomba_walk')
  }

  // Al pisarlo: muere y da puntos
  onStomped(player, audio, scoreManager) {
    if (this._isDead) return

    this._isDead = true
    this.setVelocityX(0)
    this.body.allowGravity = false
    this._playAnim('goomba_dead')
    audio?.kill()
    scoreManager.add(SCORE_ENEMY_KILL)

    player.setVelocityY(-260)

    this.scene.time.delayedCall(400, () => {
      if (this?.active) this.destroy()
    })
  }

  _updateAnim() {
    this._playAnim('goomba_walk')
  }

  // Registra las animaciones una sola vez (llamado desde GameScene)
  static createAnims(anims, assetKey) {
    if (anims.exists('goomba_walk')) return

    // goomba.png: 48x16 → 3 frames de 16x16
    // 0=walk1  1=walk2  2=dead
    anims.create({
      key:       'goomba_walk',
      frames:    anims.generateFrameNumbers(assetKey, { start: 0, end: 1 }),
      frameRate: 6,
      repeat:    -1,
    })
    anims.create({
      key:       'goomba_dead',
      frames:    anims.generateFrameNumbers(assetKey, { start: 2, end: 2 }),
      frameRate: 1,
      repeat:    0,
    })
  }
}
import { SCENES }        from '../config/constants.js'
import { scoreManager }  from '../managers/ScoreManager.js'

export class GameOverScene extends Phaser.Scene {
  constructor () {
    super(SCENES.GAME_OVER)
  }

  // Recibe { score } pasado desde GameScene al hacer scene.start(SCENES.GAME_OVER, { score })
  create ({ score = 0 } = {}) {
    const { width, height } = this.scale

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0)

    this.add
      .text(width / 2, height / 2 - 50, 'GAME OVER', {
        fontSize: '20px', fill: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height / 2 - 10, `SCORE   ${score}`, {
        fontSize: '10px', fill: '#ffffff', fontFamily: 'monospace',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height / 2 + 10, `BEST    ${scoreManager.highScore}`, {
        fontSize: '10px', fill: '#ffdd57', fontFamily: 'monospace',
      })
      .setOrigin(0.5)

    const hint = this.add
      .text(width / 2, height / 2 + 40, 'PRESS SPACE TO RETRY', {
        fontSize: '9px', fill: '#aaaaaa', fontFamily: 'monospace',
      })
      .setOrigin(0.5)

    this.tweens.add({ targets: hint, alpha: 0, duration: 600, yoyo: true, repeat: -1 })

    this.input.keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .once('down', () => {
        scoreManager.reset()
        this.scene.start(SCENES.GAME)
      })
  }
}

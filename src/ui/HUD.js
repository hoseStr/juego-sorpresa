import { scoreManager } from '../managers/ScoreManager.js'

// El HUD vive en una cámara fija (ignoreCamera) para que no se mueva con el mundo.
export class HUD {
  constructor (scene) {
    this._scene = scene

    const style = { fontSize: '10px', fill: '#ffffff', fontFamily: 'monospace' }

    // Score
    this._scoreTxt = scene.add
      .text(8, 8, 'SCORE 0', style)
      .setScrollFactor(0)   // fija el texto — no se mueve con la cámara del mundo
      .setDepth(10)

    // High score (centrado)
    this._hiTxt = scene.add
      .text(scene.scale.width / 2, 8, `HI ${scoreManager.highScore}`, style)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10)

    // Vidas
    this._livesTxt = scene.add
      .text(scene.scale.width - 8, 8, '♥ ♥ ♥', style)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10)
  }

  // Llama esto desde GameScene.update() pasando el player actual
  update (player) {
    this._scoreTxt.setText(`SCORE ${scoreManager.score}`)
    this._livesTxt.setText('♥ '.repeat(player.lives).trim())
  }
}

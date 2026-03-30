import { ASSETS } from '../config/constants.js'

// Recibe la escena activa para acceder al sistema de sonido de Phaser.
// Se crea una vez en GameScene y se destruye cuando la escena termina.
export class AudioManager {
  constructor (scene) {
    this._scene = scene
    this._music = null
  }

  playMusic () {
    if (this._music?.isPlaying) return
    this._music = this._scene.sound.add(ASSETS.MUSIC, {
      loop:   true,
      volume: 0.4,
    })
    this._music.play()
  }

  stopMusic () {
    this._music?.stop()
  }

  playSFX (key, volume = 0.6) {
    // Los SFX se disparan sin guardar referencia — fire-and-forget.
    this._scene.sound.play(key, { volume })
  }

  jump () { this.playSFX(ASSETS.SFX_JUMP) }
  kill () { this.playSFX(ASSETS.SFX_KILL) }
  hurt () { this.playSFX(ASSETS.SFX_HURT) }
}

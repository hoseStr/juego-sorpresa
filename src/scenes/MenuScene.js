import { SCENES, ASSETS } from '../config/constants.js'

export class MenuScene extends Phaser.Scene {
  constructor () {
    super(SCENES.MENU)
  }

  // ── Carga assets que se usan SOLO en el menú ──────────────────────────────
  preload () {
    // Si tienes una imagen de fondo para el menú, cárgala aquí.
    // this.load.image('menu_bg', 'assets/images/menu_bg.png')
  }

  create () {
    const { width, height } = this.scale

    // Fondo simple hasta que tengas assets propios
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0)

    this.add
      .text(width / 2, height / 2 - 30, 'MI JUEGO', {
        fontSize:   '24px',
        fill:       '#ffffff',
        fontFamily: 'monospace',
        fontStyle:  'bold',
      })
      .setOrigin(0.5)

    const hint = this.add
      .text(width / 2, height / 2 + 20, 'PRESS SPACE TO START', {
        fontSize:   '10px',
        fill:       '#aaaaaa',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)

    // Parpadeo del hint
    this.tweens.add({
      targets:  hint,
      alpha:    0,
      duration: 600,
      yoyo:     true,
      repeat:   -1,
    })

    // Tecla SPACE arranca el juego
    this.input.keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .once('down', () => this.scene.start(SCENES.GAME))
  }
}

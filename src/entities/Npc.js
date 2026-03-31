import Phaser from 'phaser'

export class Npc extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, frame = 0) {
    super(scene, x, y, texture, frame)

    scene.add.existing(this)
    scene.physics.add.existing(this, true) // true = cuerpo estático, no se mueve
  }
}
import Phaser from "phaser";
import { MenuScene } from "../scenes/MenuScene.js";
import { GameScene } from "../scenes/GameScene.js";
import { GameOverScene } from "../scenes/GameOverScene.js";

export const gameConfig = {
  type: Phaser.AUTO, // usa WebGL si está disponible, Canvas como fallback
  width: window.innerWidth,
  height: window.innerHeight, // resolución base en píxeles (16:9 a escala pixel-art)
  backgroundColor: "#5c94fc", // azul cielo clásico de plataformero
  pixelArt: true, // desactiva antialiasing en sprites
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 500 },
      debug: false, // pon true cuando necesites ver hitboxes
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, GameScene, GameOverScene],
};

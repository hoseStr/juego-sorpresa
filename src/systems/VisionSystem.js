import Phaser from "phaser";
import { MirrorPipeline } from "./MirrorPipeline.js";

const VIEWPORT_W = 320;
const VIEWPORT_H = 180;
const VIEWPORT_X = 16;
const VIEWPORT_Y = 16;
const BORDER_W = 3;

/**
 * VisionSystem — "Visión Prestada" con espejo WebGL real.
 *
 * Arquitectura:
 *  1. Una cámara secundaria (npcCam) sigue al NPC y se renderiza
 *     en un viewport real en la esquina de la pantalla.
 *  2. MirrorPipeline se aplica a la cámara completa via postPipeline,
 *     que es la API correcta en Phaser 3.60+ para efectos de cámara.
 *  3. El borde y la etiqueta son Graphics/Text con scrollFactor(0).
 */
export class VisionSystem {
  constructor(scene, player, targetNPC) {
    this._scene = scene;
    this._player = player;
    this._npc = targetNPC;
    this._active = false;

    this._registerPipeline();
    this._createNPCCamera();
    this._createBorderAndLabel();

    this._keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  // ── API pública ───────────────────────────────────────────────────────────

  update() {
    if (Phaser.Input.Keyboard.JustDown(this._keyE)) {
      this.toggle();
    }
    if (!this._active) return;

    // Mantiene el zoom sincronizado con la cámara principal
    this._npcCam.setZoom(this._scene.cameras.main.zoom);
  }

  toggle() {
    this._active = !this._active;
    this._npcCam.setVisible(this._active);
    this._border.setVisible(this._active);
    this._label.setVisible(this._active);
  }

  destroy() {
    this._npcCam.destroy();
    this._border.destroy();
    this._label.destroy();
  }

  get isActive() {
    return this._active;
  }

  // ── Setup privado ─────────────────────────────────────────────────────────

  _registerPipeline() {
    const renderer = this._scene.sys.game.renderer;
    if (renderer.type !== Phaser.WEBGL) {
      console.warn("VisionSystem: requiere WebGL para el efecto espejo.");
      return;
    }
    // En Phaser 3.60+ los pipelines PostFX se registran en el game config
    // o directamente en el renderer así:
    if (!renderer.pipelines.has("MirrorPipeline")) {
      renderer.pipelines.addPostPipeline("MirrorPipeline", MirrorPipeline);
    }
  }

  /**
   * Cámara secundaria con viewport en la esquina superior izquierda.
   * setRoundPixels(true) evita artefactos de sub-píxel con pixel art.
   *
   * El espejo se aplica con setPostPipeline — es la API de Phaser 3.60+
   * para aplicar shaders al output completo de una cámara.
   */
  _createNPCCamera() {
    const mainCam = this._scene.cameras.main;

    this._npcCam = this._scene.cameras.add(
      VIEWPORT_X,
      VIEWPORT_Y,
      VIEWPORT_W,
      VIEWPORT_H,
    );
    this._npcCam.setName("npcCam");
    this._npcCam.setZoom(mainCam.zoom);
    this._npcCam.setBounds(
      0,
      0,
      this._scene.physics.world.bounds.width,
      this._scene.physics.world.bounds.height,
    );
    this._npcCam.setBackgroundColor("#5c94fc");
    this._npcCam.setRoundPixels(true);
    this._npcCam.startFollow(this._npc, true, 1, 1);
    this._npcCam.setVisible(false);

    // Aplica el pipeline de espejo a toda la cámara
    const renderer = this._scene.sys.game.renderer;
    if (renderer.type === Phaser.WEBGL) {
      this._npcCam.setPostPipeline("MirrorPipeline");
    }

    // Excluye el HUD de la cámara secundaria para que no aparezca duplicado.
    // Los elementos de HUD tienen scrollFactor 0.
    this._scene.children.list.forEach((obj) => {
      if (obj.scrollFactorX === 0) {
        this._npcCam.ignore(obj);
      }
    });
  }

  _createBorderAndLabel() {
    this._border = this._scene.add.graphics();
    this._border.setScrollFactor(0);
    this._border.setDepth(100);
    this._border.setVisible(false);

    this._border.lineStyle(BORDER_W, 0xffffff, 1);
    this._border.strokeRect(
      VIEWPORT_X - BORDER_W,
      VIEWPORT_Y - BORDER_W,
      VIEWPORT_W + BORDER_W * 2,
      VIEWPORT_H + BORDER_W * 2,
    );

    this._border.lineStyle(BORDER_W + 1, 0x00ddff, 1);
    const L = 12;
    const corners = [
      [VIEWPORT_X - BORDER_W, VIEWPORT_Y - BORDER_W, 1, 1],
      [VIEWPORT_X + VIEWPORT_W + BORDER_W, VIEWPORT_Y - BORDER_W, -1, 1],
      [VIEWPORT_X - BORDER_W, VIEWPORT_Y + VIEWPORT_H + BORDER_W, 1, -1],
      [
        VIEWPORT_X + VIEWPORT_W + BORDER_W,
        VIEWPORT_Y + VIEWPORT_H + BORDER_W,
        -1,
        -1,
      ],
    ];
    corners.forEach(([cx, cy, sx, sy]) => {
      this._border.beginPath();
      this._border.moveTo(cx + sx * L, cy);
      this._border.lineTo(cx, cy);
      this._border.lineTo(cx, cy + sy * L);
      this._border.strokePath();
    });

    this._label = this._scene.add
      .text(VIEWPORT_X + 6, VIEWPORT_Y + 4, "VISION NPC", {
        fontSize: "7px",
        fill: "#00ddff",
        fontFamily: "monospace",
        fontStyle: "bold",
        backgroundColor: "#00000088",
        padding: { x: 4, y: 2 },
      })
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false);
  }
}

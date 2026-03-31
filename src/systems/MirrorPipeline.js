import Phaser from 'phaser'

/**
 * MirrorPipeline — PostFXPipeline que espeja horizontalmente.
 *
 * PostFXPipeline es la API correcta para efectos de cámara en Phaser 3.60+.
 * Se aplica DESPUÉS de que la cámara renderiza su contenido — por eso
 * puede invertir la imagen completa sin afectar la física ni la lógica.
 *
 * El fragment shader invierte la coordenada U del UV:
 *   outTexCoord.x va de 0.0 (izq) a 1.0 (der)
 *   1.0 - outTexCoord.x lo invierte → espejo horizontal perfecto
 */
export class MirrorPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name:       'MirrorPipeline',
      fragShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;

        void main(void) {
          vec2 uv = vec2(1.0 - outTexCoord.x, outTexCoord.y);
          gl_FragColor = texture2D(uMainSampler, uv);
        }
      `,
    })
  }

  onPreRender() {
    // Sin uniforms adicionales — el shader solo necesita la textura de entrada
  }
}
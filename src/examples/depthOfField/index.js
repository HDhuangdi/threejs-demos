import DepthProgram from './depthProgram';
import SceneProgram from './sceneProgram';
import EffectProgram from './effectProgram';

export default class Render {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.offscreenWidth = 2048;
    this.offscreenHeight = 2048;
    this.width = width;
    this.height = height;
    this.gl = canvas.getContext("webgl", {antialias: true});
    var ext = this.gl.getExtension('WEBGL_depth_texture');

    this.gl.disable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.depthProgram = new DepthProgram(this.gl, width, height, this.offscreenWidth, this.offscreenHeight)
    this.sceneProgram = new SceneProgram(this.gl, width, height, this.offscreenWidth, this.offscreenHeight)
    this.effectProgram = new EffectProgram(this.gl, width, height, this.offscreenWidth, this.offscreenHeight, this.sceneProgram.fbo, this.depthProgram.fbo)

    this.render()
  }

  render() {
    this.depthProgram.render()
    this.sceneProgram.render()
    this.effectProgram.render()

    requestAnimationFrame(this.render.bind(this))
  }
}

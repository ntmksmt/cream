import { OrthographicRendering } from './Rendering';
import { RenderTarget } from './RenderTarget';

import basicVert from './shaders/basic.vert';
import debugFrag from './shaders/debug.frag';

import * as THREE from 'three';

export default class Debug extends OrthographicRendering {
  private debugRenderTarget: RenderTarget;

  constructor(debugRenderTarget: RenderTarget) {
    super();

    this.debugRenderTarget = debugRenderTarget;
  }

  protected initRenderTargets(): Record<string, RenderTarget> | null {
    return null;
  }

  protected initShaders(): Record<string, THREE.RawShaderMaterial> {
    return {
      debug: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: debugFrag,
        uniforms: {
          debug: { value: null }
        }
      })
    };
  }

  update(): void {
    this.mesh.material = this.shaders['debug'];
    this.shaders['debug'].uniforms.debug.value = this.debugRenderTarget.src.texture;
    this.render();
  }
}

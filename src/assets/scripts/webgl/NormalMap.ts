import { OrthographicRendering } from './Rendering';
import { RenderTarget } from './RenderTarget';

import basicVert from './shaders/basic.vert';
import normalMapFrag from './shaders/normalMap.frag';

import * as THREE from 'three';

export default class NormalMap extends OrthographicRendering {
  private heightMapRenderTarget: RenderTarget;

  constructor(heightMapRenderTarget: RenderTarget) {
    super();

    this.heightMapRenderTarget = heightMapRenderTarget;
  }
  
  protected initRenderTargets(): Record<string, RenderTarget> | null {
    return {
      normalMap: new RenderTarget()
    };
  }

  protected initShaders(): Record<string, THREE.RawShaderMaterial> {
    return {
      normalMap: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: normalMapFrag,
        uniforms: {
          heightMap: { value: null },
          px: { value: this.px },
          resolution: { value: this.resolution }
        }
      })
    };
  }

  update(): void {
    this.mesh.material = this.shaders['normalMap'];
    this.shaders['normalMap'].uniforms.heightMap.value = this.heightMapRenderTarget.src.texture;
    this.render(this.renderTargets!['normalMap']);
  }
}

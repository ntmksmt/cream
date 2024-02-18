import { OrthographicRendering } from './Rendering';
import { RenderTarget } from './RenderTarget';

import basicVert from './shaders/basic.vert';
import SSSFrag from './shaders/SSS.frag';

import * as THREE from 'three';

export default class SSS extends OrthographicRendering {
  protected initRenderTargets(): Record<string, RenderTarget> | null {
    return {
      SSS: new RenderTarget()
    };
  }

  protected initShaders(): Record<string, THREE.RawShaderMaterial> {
    return {
      SSS: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: SSSFrag
      })
    };
  }

  onResize(): void {
    super.onResize();

    this.mesh.material = this.shaders['SSS'];
    this.render(this.renderTargets!['SSS']);
  }
}

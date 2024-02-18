import { OrthographicRendering } from './Rendering';
import { RenderTarget, RenderTarget2Phase } from './RenderTarget';

import basicVert from './shaders/basic.vert';
import initHeightMapFrag from './shaders/initHeightMap.frag';
import updateHeightMapFrag from './shaders/updateHeightMap.frag';

import * as THREE from 'three';

export default class HeightMap extends OrthographicRendering {
  private param: Record<string, number>;
  private fluidRenderTarget: RenderTarget;

  constructor(fov: number, fluidRenderTarget: RenderTarget) {
    super();

    this.param = {
      fov: fov,
      velStrength: 2
    };

    this.fluidRenderTarget = fluidRenderTarget;
  }

  protected initRenderTargets(): Record<string, RenderTarget> | null {
    return {
      heightMap: new RenderTarget2Phase()
    };
  }

  protected initShaders(): Record<string, THREE.RawShaderMaterial> {
    return {
      initHeightMap: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: initHeightMapFrag,
        uniforms: {
          resolution: { value: this.resolution },
          fov: { value: this.param.fov }
        }
      }),
      updateHeightMap: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: updateHeightMapFrag,
        uniforms: {
          heightMap: { value: null },
          velocity: { value: null },
          velStrength: { value: this.param.velStrength },
          resolution: { value: this.resolution },
          delta: { value: null },
          px: { value: this.px }
        }
      })
    };
  }

  onResize(): void {
    super.onResize();

    this.mesh.material = this.shaders['initHeightMap'];
    this.render(this.renderTargets!['heightMap']);
  }

  update(delta: number): void {
    this.mesh.material = this.shaders['updateHeightMap'];
    this.shaders['updateHeightMap'].uniforms.heightMap.value = this.renderTargets!['heightMap'].src.texture;
    this.shaders['updateHeightMap'].uniforms.velocity.value = this.fluidRenderTarget.src.texture;
    this.shaders['updateHeightMap'].uniforms.delta.value = delta;
    this.render(this.renderTargets!['heightMap']);
  }
}

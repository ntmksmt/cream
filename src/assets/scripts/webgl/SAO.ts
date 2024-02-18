import { OrthographicRendering } from './Rendering';
import { RenderTarget, RenderTarget2Phase } from './RenderTarget';

import basicVert from './shaders/basic.vert';
import SAOFrag from './shaders/SAO.frag';
import blurFrag from './shaders/blur.frag';

import * as THREE from 'three';

export default class SAO extends OrthographicRendering {
  private param: Record<string, number>;
  private heightMapRenderTarget: RenderTarget;
  private normalMapRenderTarget: RenderTarget;

  constructor(heightMapRenderTarget: RenderTarget, normalMapRenderTarget: RenderTarget) {
    super();

    this.param = {
      SAORadius: 100,
      SAOIntensity: 1,
      blurStdDev: 3,
      blurRadius: 8
    };

    this.heightMapRenderTarget = heightMapRenderTarget;
    this.normalMapRenderTarget = normalMapRenderTarget;
  }
  
  protected initRenderTargets(): Record<string, RenderTarget> | null {
    return {
      SAO: new RenderTarget(),
      blur: new RenderTarget2Phase()
    };
  }

  protected initShaders(): Record<string, THREE.RawShaderMaterial> {
    const vBlur = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: basicVert,
      fragmentShader: blurFrag,
      uniforms: {
        stdDev: { value: this.param.blurStdDev },
        target: { value: null },
        px: { value: this.px },
        radius: { value: this.param.blurRadius }
      }
    });

    const hBlur = vBlur.clone();
    hBlur.uniforms.px.value = this.px;
    hBlur.defines['HORIZONTAL'] = 1;
    
    return {
      SAO: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: SAOFrag,
        uniforms: {
          resolution: { value: this.resolution },
          heightMap: { value: null },
          normalMap: { value: null },
          radius: { value: this.param.SAORadius },
          intensity: { value: this.param.SAOIntensity }
        }
      }),
      vBlur: vBlur,
      hBlur: hBlur
    };
  }

  update(): void {
    this.mesh.material = this.shaders['SAO'];
    this.shaders['SAO'].uniforms.heightMap.value = this.heightMapRenderTarget.src.texture;
    this.shaders['SAO'].uniforms.normalMap.value = this.normalMapRenderTarget.src.texture;
    this.render(this.renderTargets!['SAO']);

    this.mesh.material = this.shaders['vBlur'];
    this.shaders['vBlur'].uniforms.target.value = this.renderTargets!['SAO'].src.texture;
    this.render(this.renderTargets!['blur']);

    this.mesh.material = this.shaders['hBlur'];
    this.shaders['hBlur'].uniforms.target.value = this.renderTargets!['blur'].src.texture;
    this.render(this.renderTargets!['blur']);
  }
}

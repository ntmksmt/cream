import { OrthographicRendering } from './Rendering';
import { RenderTarget, RenderTarget2Phase } from './RenderTarget';
import Common from './Common';
import Mouse from './Mouse';

import basicVert from './shaders/basic.vert';
import advectFrag from './shaders/advect.frag';
import applyForcesFrag from './shaders/applyForces.frag';
import viscousFrag from './shaders/viscous.frag';
import divergenceFrag from './shaders/divergence.frag';
import pressureSolveFrag from './shaders/pressureSolve.frag';
import pressureGradientSubstractFrag from './shaders/pressureGradientSubstract.frag';

import * as THREE from 'three';

export default class Fluid extends OrthographicRendering {
  private param: Record<string, number>;
  private mouse: Mouse;

  constructor() {
    super();

    this.param = {
      resolutionScale: 1 / 4,
      velocityAttenuation: 0.75,
      forcesRadius: 0.14,
      viscousIterations: 10,
      viscous: 5,
      pressureSolveIterations: 10
    };

    this.mouse = new Mouse();
  }

  protected initRenderTargets(): Record<string, RenderTarget> | null {
    return {
      velocity: new RenderTarget2Phase(),
      viscous: new RenderTarget2Phase(),
      divergence: new RenderTarget(),
      pressure: new RenderTarget2Phase()
    };
  }

  protected initShaders(): Record<string, THREE.RawShaderMaterial> {
    return {
      advect: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: advectFrag,
        uniforms: {
          resolution: { value: this.resolution },
          velocity: { value: null },
          delta: { value: null },
          px: { value: this.px }
        }
      }),
      applyForces: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: applyForcesFrag,
        uniforms: {
          velocity: { value: null },
          velocityAttenuation: { value: this.param.velocityAttenuation },
          isClick: { value: null },
          resolution: { value: this.resolution },
          currentMouse: { value: this.mouse.currentMouse },
          lastMouse: { value: this.mouse.lastMouse },
          delta: { value: null },
          forcesRadius: { value: this.param.forcesRadius }
        }
      }),
      viscous: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: viscousFrag,
        uniforms: {
          velocity: { value: null },
          newVelocity: { value: null },
          px: { value: this.px },
          viscous: { value: this.param.viscous }
        }
      }),
      divergence: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: divergenceFrag,
        uniforms: {
          velocity: { value: null },
          px: { value: this.px }
        }
      }),
      pressureSolve: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: pressureSolveFrag,
        uniforms: {
          pressure: { value: null },
          px: { value: this.px },
          divergence: { value: this.renderTargets!['divergence'].src.texture }
        }
      }),
      pressureGradientSubstract: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: pressureGradientSubstractFrag,
        uniforms: {
          pressure: { value: null },
          px: { value: this.px },
          velocity: { value: null }
        }
      })
    };
  }

  protected setResolution(): void {
    this.resolution.set(
      Math.round(Common.resolution.x * this.param.resolutionScale),
      Math.round(Common.resolution.y * this.param.resolutionScale)
    );
  }

  update(delta: number): void {
    this.mouse.update();

    this.mesh.material = this.shaders['advect'];
    this.shaders['advect'].uniforms.velocity.value = this.renderTargets!['velocity'].src.texture;
    this.shaders['advect'].uniforms.delta.value = delta;
    this.render(this.renderTargets!['velocity']);

    this.mesh.material = this.shaders['applyForces'];
    this.shaders['applyForces'].uniforms.velocity.value = this.renderTargets!['velocity'].src.texture;
    this.shaders['applyForces'].uniforms.isClick.value = this.mouse.isClick;
    this.shaders['applyForces'].uniforms.delta.value = delta;
    this.render(this.renderTargets!['velocity']);

    this.mesh.material = this.shaders['viscous'];
    this.shaders['viscous'].uniforms.velocity.value = this.renderTargets!['velocity'].src.texture;
    for(let i = 0; i < this.param.viscousIterations; i++) {
      this.shaders['viscous'].uniforms.newVelocity.value = this.renderTargets!['viscous'].src.texture;
      this.render(this.renderTargets!['viscous']);
    }

    this.mesh.material = this.shaders['divergence'];
    this.shaders['divergence'].uniforms.velocity.value = this.renderTargets!['viscous'].src.texture;
    this.render(this.renderTargets!['divergence']);

    this.mesh.material = this.shaders['pressureSolve'];
    for(let i = 0; i < this.param.pressureSolveIterations; i++) {
      this.shaders['pressureSolve'].uniforms.pressure.value = this.renderTargets!['pressure'].src.texture;
      this.render(this.renderTargets!['pressure']);
    }

    this.mesh.material = this.shaders['pressureGradientSubstract'];
    this.shaders['pressureGradientSubstract'].uniforms.pressure.value = this.renderTargets!['pressure'].src.texture;
    this.shaders['pressureGradientSubstract'].uniforms.velocity.value = this.renderTargets!['viscous'].src.texture;
    this.render(this.renderTargets!['velocity']);
  }
}

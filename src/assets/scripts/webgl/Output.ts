import { OrthographicRendering } from './Rendering';
import { RenderTarget } from './RenderTarget';
import Common from './Common';

import basicVert from './shaders/basic.vert';
import outputFrag from './shaders/output.frag';

import px from '../../images/cubeMap/px.jpg';
import nx from '../../images/cubeMap/nx.jpg';
import py from '../../images/cubeMap/py.jpg';
import ny from '../../images/cubeMap/ny.jpg';
import pz from '../../images/cubeMap/pz.jpg';
import nz from '../../images/cubeMap/nz.jpg';

import * as THREE from 'three';

export default class Output extends OrthographicRendering {
  private param: Record<string, number>;
  private paramHexColor: Record<string, number>;
  private paramRGBColor: Record<string, THREE.Color>;
  private lightsNumber: number = 2;
  private lightsUniforms: {
    position: THREE.Vector3,
    intensity: number,
    color: THREE.Color
  }[] = new Array(this.lightsNumber);
  private textures!: Record<string, THREE.Texture>;
  private heightMapRenderTarget: RenderTarget;
  private normalMapRenderTarget: RenderTarget;
  private SSSRenderTarget: RenderTarget;

  constructor(fov: number, heightMapRenderTarget: RenderTarget, normalMapRenderTarget: RenderTarget, SSSRenderTarget: RenderTarget) {
    super();

    this.param = {
      fov: fov,
      minHeight: 0.00001,
      transmissionThreshold: 0.01,
      metalness: 0,
      roughness: 0.1,
      IOR: 2.2,
      light1PositionX: 24,
      light1PositionY: 4,
      light1PositionZ: 22,
      light1Intensity: 0.3,
      ambientMinIntensity: 0.15,
      ambientMaxIntensity: 0.8,
      ambientMix: 0.4,
      cubeMapLod: 6.8,
      cubeMapIntensity: 1
    };

    this.paramHexColor = {
      albedo: 0xff9ba0,
      light1: 0xffffff,
      ambient: 0xb6cae0
    };
    this.paramRGBColor = {};
    this.initParamRGBColor();

    this.initLightsUniforms();

    if(Common.isVisibleGUI) {
      const folder = Common.GUI!.addFolder('Output');

      folder.add(this.param, 'metalness', 0, 1, 0.1);
      folder.add(this.param, 'roughness', 0, 1, 0.001);
      folder.add(this.param, 'IOR', 1, 3, 0.001);
      folder.add(this.param, 'light1PositionX', - 100, 100, 1);
      folder.add(this.param, 'light1PositionY', - 100, 100, 1);
      folder.add(this.param, 'light1PositionZ', - 100, 100, 1);
      folder.add(this.param, 'light1Intensity', 0, 1, 0.1);
      folder.add(this.param, 'ambientMinIntensity', 0, 2, 0.01);
      folder.add(this.param, 'ambientMaxIntensity', 0, 2, 0.01);
      folder.add(this.param, 'ambientMix', 0, 1, 0.1);
      folder.add(this.param, 'cubeMapLod', 0, 10, 0.1);
      folder.add(this.param, 'cubeMapIntensity', 0, 1, 0.1);
      folder.close();

      Object.keys(this.paramHexColor).map(key => {
        folder.addColor(this.paramHexColor, key).onChange(hexColor => {
          this.paramRGBColor[key].setHex(hexColor);
        })
      });
    }

    this.heightMapRenderTarget = heightMapRenderTarget;
    this.normalMapRenderTarget = normalMapRenderTarget;
    this.SSSRenderTarget = SSSRenderTarget;
  }

  private initParamRGBColor(): void {
    Object.keys(this.paramHexColor).map(key => {
      this.paramRGBColor[key] = new THREE.Color(this.paramHexColor[key]);
    });
  }

  private initLightsUniforms(): void {
    this.lightsUniforms[0] = {
      position: new THREE.Vector3(this.param.light1PositionX, this.param.light1PositionY, this.param.light1PositionZ),
      intensity: this.param.light1Intensity,
      color: this.paramRGBColor['light1']
    };

    this.lightsUniforms[1] = {
      position: new THREE.Vector3(2, 6, 6),
      intensity: 0.6,
      color: this.paramRGBColor['light1']
    };
  }

  async init(): Promise<void> {
    const cubeMap = await this.loadCubeTexture([
      px, nx, py, ny, pz, nz
    ]);
    this.textures = {
      cubeMap: cubeMap
    };
    
    super.init();
  }

  protected initRenderTargets(): Record<string, RenderTarget> | null {
    return null;
  }

  protected initShaders(): Record<string, THREE.RawShaderMaterial> {
    return {
      output: new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: basicVert,
        fragmentShader: outputFrag,
        uniforms: {
          resolution: { value: this.resolution },
          heightMap: { value: null },
          normalMap: { value: null },
          fov: { value: this.param.fov },
          minHeight: { value: this.param.minHeight },
          transmissionThreshold: { value: this.param.transmissionThreshold },
          albedo: { value: this.paramRGBColor.albedo },
          metalness: { value: this.param.metalness },
          roughness: { value: this.param.roughness },
          IOR: { value: this.param.IOR },
          lights: { value: this.lightsUniforms },
          SSS: { value: null },
          ambientMinIntensity: { value: this.param.ambientMinIntensity },
          ambientMaxIntensity: { value: this.param.ambientMaxIntensity },
          ambientColor: { value: this.paramRGBColor.ambient },
          ambientMix: { value: this.param.ambientMix },
          cubeMap: { value: this.textures.cubeMap },
          cubeMapLod: { value: this.param.cubeMapLod },
          cubeMapIntensity: { value: this.param.cubeMapIntensity }
        },
        defines: {
          LIGHTS_NUMBER: this.lightsNumber
        }
      })
    };
  }

  update(): void {
    this.mesh.material = this.shaders['output'];
    this.shaders['output'].uniforms.heightMap.value = this.heightMapRenderTarget.src.texture;
    this.shaders['output'].uniforms.normalMap.value = this.normalMapRenderTarget.src.texture;
    this.shaders['output'].uniforms.SSS.value = this.SSSRenderTarget.src.texture;

    if(Common.isVisibleGUI) {
      this.shaders['output'].uniforms.metalness.value = this.param.metalness;
      this.shaders['output'].uniforms.roughness.value = this.param.roughness;
      this.shaders['output'].uniforms.IOR.value = this.param.IOR;
      this.shaders['output'].uniforms.ambientMinIntensity.value = this.param.ambientMinIntensity;
      this.shaders['output'].uniforms.ambientMaxIntensity.value = this.param.ambientMaxIntensity;
      this.shaders['output'].uniforms.ambientMix.value = this.param.ambientMix;
      this.shaders['output'].uniforms.cubeMapLod.value = this.param.cubeMapLod;
      this.shaders['output'].uniforms.cubeMapIntensity.value = this.param.cubeMapIntensity;
      this.initLightsUniforms();
    }

    this.render();
  }
}

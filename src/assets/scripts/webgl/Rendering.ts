import Common from './Common';
import { RenderTarget, RenderTarget2Phase } from './RenderTarget';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

abstract class Rendering {
  protected scene!: THREE.Scene;
  protected camera!: THREE.Camera;
  renderTargets!: Record<string, RenderTarget> | null;
  protected resolution: THREE.Vector2 = new THREE.Vector2();
  protected px: THREE.Vector2 = new THREE.Vector2();

  init() {
    this.scene = this.initScene();

    this.camera = this.initCamera();

    this.renderTargets = this.initRenderTargets();
  }

  protected initScene(): THREE.Scene {
    return new THREE.Scene();
  }

  protected abstract initCamera(): THREE.Camera;

  protected abstract initRenderTargets(): Record<string, RenderTarget> | null;

  protected loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise(resolve => {
      const loader = new THREE.TextureLoader();
      loader.load(url, texture => {
        resolve(texture);
      });
    });
  }

  protected loadCubeTexture(url: string[]): Promise<THREE.CubeTexture> {
    return new Promise(resolve => {
      const loader = new THREE.CubeTextureLoader();
      loader.load(url, texture => {
        resolve(texture);
      });
    });
  }

  protected loadModel(url: string): Promise<THREE.Mesh> {
    return new Promise(resolve => {
      const loader = new GLTFLoader();
      loader.load(url, gltf => {
        resolve(<THREE.Mesh>gltf.scene.children[0]);
      });
    });
  }

  protected setResolution(): void {
    this.resolution.set(Common.resolution.x, Common.resolution.y);
  }

  onResize(): void {
    this.setResolution();

    this.px.set(1 / this.resolution.x, 1 / this.resolution.y);

    if(this.renderTargets !== null) {
      Object.keys(this.renderTargets).map(key => {
        this.renderTargets![key].onResize(this.resolution.x, this.resolution.y);
      });
    }
  }

  protected render(renderTarget?: RenderTarget): void {
    const target = renderTarget === undefined ? null : renderTarget.dst;
    Common.renderer.setRenderTarget(target);
    Common.renderer.render(this.scene, this.camera);

    if(renderTarget instanceof RenderTarget2Phase) renderTarget.swap();
  }

  update(_time?: number): void {}
}

abstract class OrthographicRendering extends Rendering {
  declare protected camera: THREE.OrthographicCamera;
  protected shaders!: Record<string, THREE.RawShaderMaterial>;
  protected mesh!: THREE.Mesh;

  init() {
    super.init();

    this.shaders = this.initShaders();

    this.mesh = this.initMesh();
    this.scene.add(this.mesh);
  }
  
  protected initCamera(): THREE.OrthographicCamera {
    return new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
  }

  protected abstract initShaders(): Record<string, THREE.RawShaderMaterial>;

  protected initMesh(): THREE.Mesh {
    return new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  }
}

abstract class PerspectiveRendering extends Rendering {
  declare protected camera: THREE.PerspectiveCamera;
  
  protected abstract initCamera(): THREE.PerspectiveCamera;

  onResize(): void {
    super.onResize();
    
    this.camera.aspect = Common.resolution.x / Common.resolution.y;
    this.camera.updateProjectionMatrix();
  }
}

export { OrthographicRendering, PerspectiveRendering };

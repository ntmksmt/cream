import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';

class Common {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  pixelRatio: number = window.devicePixelRatio;
  windowSize: THREE.Vector2 = new THREE.Vector2();
  resolution: THREE.Vector2 = new THREE.Vector2();
  clock: THREE.Clock = new THREE.Clock();
  delta: number = 0;
  isVisibleGUI: boolean = false;
  GUI?: GUI;

  constructor() {
    this.canvas = document.querySelector<HTMLCanvasElement>('#webgl canvas')!;
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setPixelRatio(this.pixelRatio);

    if(this.isVisibleGUI) this.GUI = new GUI();
  }

  onResize(): void {
    this.windowSize.set(window.innerWidth, window.innerHeight);
    this.resolution.set(this.windowSize.x * this.pixelRatio, this.windowSize.y * this.pixelRatio);

    this.renderer.setSize(this.windowSize.x, this.windowSize.y);
  }

  update(): void {
    this.delta = this.clock.getDelta();
  }
}

export default new Common();

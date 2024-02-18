import Common from './Common';

import * as THREE from 'three';

export default class Mouse {
  isClick: boolean = false;
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private mouseExists: boolean = false;
  lastMouse: THREE.Vector2 = new THREE.Vector2();
  lastMouseExists: boolean = false;
  currentMouse: THREE.Vector2 = new THREE.Vector2();

  constructor() {
    const canvas = Common.canvas;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseout', this.onMouseOut.bind(this));

    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private setMouse(x: number, y: number): void {
    this.mouse.set(
      x / Common.windowSize.x * 2 - 1,
      (Common.windowSize.y - y) / Common.windowSize.y * 2 - 1
    );
    this.mouseExists = true;
  }

  private onMouseDown(event: MouseEvent): void {
    this.isClick = true;

    this.onMouseMove(event);
  }

  private onMouseMove(event: MouseEvent): void {
    this.setMouse(event.clientX, event.clientY);
  }

  private onMouseUp(): void {
    this.isClick = false;
  }

  private onMouseOut(): void {
    this.onMouseUp();

    this.mouseExists = false;
    this.lastMouseExists = false;
  }

  private onTouchStart(event: TouchEvent): void {
    this.isClick = true;
    
    this.onTouchMove(event);
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();

    this.setMouse(event.touches[0].clientX, event.touches[0].clientY);
  }

  private onTouchEnd(): void {
    this.onMouseOut();
  }

  update(): void {
    if(this.mouseExists) {
      if(!this.lastMouseExists) {
        this.lastMouse.set(this.mouse.x, this.mouse.y);
        this.lastMouseExists = true;
      } else {
        this.lastMouse.set(this.currentMouse.x, this.currentMouse.y);
      }
      this.currentMouse.set(this.mouse.x, this.mouse.y);
    }
  }
}

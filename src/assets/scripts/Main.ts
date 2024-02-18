import WebGLMain from './webgl/WebGLMain';

export default class Main {
  private webGLMain!: WebGLMain;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.webGLMain = new WebGLMain();
    await this.webGLMain.init();

    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();

    this.webGLMain.update();
  }

  private onResize(): void {
    this.webGLMain.onResize();
  }
}

import Common from './Common';
import Fluid from './Fluid';
import HeightMap from './HeightMap';
import NormalMap from './NormalMap';
import SAO from './SAO';
import SSS from './SSS';
import Output from './Output';
import Debug from './Debug';

import Stats from 'three/examples/jsm/libs/stats.module';

export default class WebGLMain {
  private isVisibleStats: boolean = false;
  private stats?: Stats;
  private param: Record<string, number>;
  private fluid!: Fluid;
  private heightMap!: HeightMap;
  private normalMap!: NormalMap;
  private SAO!: SAO;
  private SSS!: SSS;
  private output!: Output;
  private debug!: Debug;

  constructor() {
    if(this.isVisibleStats) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
    }

    this.param = {
      fov: 10
    };
  }

  async init(): Promise<void> {
    this.fluid = new Fluid();
    this.fluid.init();

    this.heightMap = new HeightMap(
      this.param.fov,
      this.fluid.renderTargets!['velocity']
    );
    this.heightMap.init();

    this.normalMap = new NormalMap(
      this.heightMap.renderTargets!['heightMap']
    );
    this.normalMap.init();

    this.SAO = new SAO(
      this.heightMap.renderTargets!['heightMap'],
      this.normalMap.renderTargets!['normalMap']
    );
    this.SAO.init();

    this.SSS = new SSS();
    this.SSS.init();

    this.output = new Output(
      this.param.fov,
      this.heightMap.renderTargets!['heightMap'],
      this.normalMap.renderTargets!['normalMap'],
      this.SSS.renderTargets!['SSS']
    );
    await this.output.init();

    this.debug = new Debug(
      this.heightMap.renderTargets!['heightMap']
    );
    this.debug.init();

    this.update = this.update.bind(this);
  }

  onResize(): void {
    Common.onResize();

    this.fluid.onResize();

    this.heightMap.onResize();

    this.normalMap.onResize();

    this.SAO.onResize();

    this.SSS.onResize();

    this.output.onResize();
  }

  update(): void {
    Common.update();
    const delta = Common.delta * 15;
    
    this.fluid.update(delta);

    this.heightMap.update(delta);

    this.normalMap.update();

    // this.SAO.update();

    this.output.update();

    // this.debug.update();
    
    this.stats?.update();

    requestAnimationFrame(this.update);
  }
}

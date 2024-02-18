import * as THREE from 'three';
import {
  Wrapping,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  PixelFormat,
  TextureDataType
} from 'three/src/constants';

type TextureParameters = {
  wrapS: Wrapping,
  wrapT: Wrapping,
  magFilter: MagnificationTextureFilter,
  minFilter: MinificationTextureFilter,
  generateMipmaps: boolean,
  format: PixelFormat,
  type: TextureDataType,
  depthBuffer: boolean,
  stencilBuffer: boolean,
  samples: number
};

class RenderTarget {
  protected textureParameters: TextureParameters;
  protected buffer0: THREE.WebGLRenderTarget;

  constructor(textureParameters?: Partial<TextureParameters>) {
    const type: TextureDataType = (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) ? THREE.HalfFloatType : THREE.FloatType;
    this.textureParameters = {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      generateMipmaps: false,
      format: THREE.RGBAFormat,
      type: type,
      depthBuffer: true,
      stencilBuffer: false,
      samples: 0
    };
    this.textureParameters = { ...this.textureParameters, ...textureParameters };

    this.buffer0 = new THREE.WebGLRenderTarget(1, 1, this.textureParameters);
  }

  get src(): THREE.WebGLRenderTarget {
    return this.buffer0;
  }

  get dst(): THREE.WebGLRenderTarget {
    return this.buffer0;
  }

  onResize(width: number, height: number): void {
    this.buffer0.setSize(width, height);
  }
}

class RenderTarget2Phase extends RenderTarget {
  protected buffer1: THREE.WebGLRenderTarget;

  constructor(textureParameters?: Partial<TextureParameters>) {
    super(textureParameters);
    this.buffer1 = this.buffer0.clone();
  }

  get src(): THREE.WebGLRenderTarget {
    return this.buffer1;
  }

  onResize(width: number, height: number): void {
    super.onResize(width, height);
    this.buffer1.setSize(width, height);
  }

  swap(): void {
    const tmp = this.buffer0;
    this.buffer0 = this.buffer1;
    this.buffer1 = tmp;
  }
}

export { RenderTarget, RenderTarget2Phase };

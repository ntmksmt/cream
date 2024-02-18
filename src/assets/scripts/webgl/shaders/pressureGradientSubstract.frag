precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D pressure;
uniform vec2 px;
uniform sampler2D velocity;

#include common/getPressue.frag

void main() {
  float r = getPressue(pressure, vUv + vec2(1.0, 0.0) * px, px);
  float l = getPressue(pressure, vUv - vec2(1.0, 0.0) * px, px);
  float t = getPressue(pressure, vUv + vec2(0.0, 1.0) * px, px);
  float b = getPressue(pressure, vUv - vec2(0.0, 1.0) * px, px);

  vec2 vel = texture(velocity, vUv).xy;

  // 速度を圧力で加速/減速する
  fragColor = vec4(vel - vec2(r - l, t - b) * 0.5, 0.0, 1.0);
}

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D pressure;
uniform vec2 px;
uniform sampler2D divergence;

#include common/getPressue.frag

void main() {
  float r = getPressue(pressure, vUv + vec2(1.0, 0.0) * px, px);
  float l = getPressue(pressure, vUv - vec2(1.0, 0.0) * px, px);
  float t = getPressue(pressure, vUv + vec2(0.0, 1.0) * px, px);
  float b = getPressue(pressure, vUv - vec2(0.0, 1.0) * px, px);

  float div = texture(divergence, vUv).x;

  // 流入なら+、流出なら-の圧力が積み重なる
  fragColor = vec4((r + l + t + b + div * - 1.0) * 0.25, 0.0, 0.0, 1.0);
}

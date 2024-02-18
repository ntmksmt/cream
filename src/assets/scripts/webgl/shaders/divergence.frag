precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D velocity;
uniform vec2 px;

#include common/getVelocity.frag

void main() {
	vec2 r = getVelocity(velocity, vUv + vec2(1.0, 0.0) * px, px);
  vec2 l = getVelocity(velocity, vUv - vec2(1.0, 0.0) * px, px);
  vec2 t = getVelocity(velocity, vUv + vec2(0.0, 1.0) * px, px);
  vec2 b = getVelocity(velocity, vUv - vec2(0.0, 1.0) * px, px);

  // ピクセルの流入出量(-が流入、+が流出)
  fragColor = vec4((r.x - l.x) + (t.y - b.y), 0.0, 0.0, 1.0);
}

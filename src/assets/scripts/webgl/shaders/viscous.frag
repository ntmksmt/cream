precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D velocity;
uniform sampler2D newVelocity;
uniform vec2 px;
uniform float viscous;

#include common/getVelocity.frag

void main() {
  vec2 vel = texture(velocity, vUv).xy;

	vec2 r = getVelocity(newVelocity, vUv + vec2(1.0, 0.0) * px, px);
  vec2 l = getVelocity(newVelocity, vUv - vec2(1.0, 0.0) * px, px);
  vec2 t = getVelocity(newVelocity, vUv + vec2(0.0, 1.0) * px, px);
  vec2 b = getVelocity(newVelocity, vUv - vec2(0.0, 1.0) * px, px);

  vec2 newVel = vel + (r + l + t + b) * viscous;
  newVel /= (0.25 + viscous) * 4.0;

  fragColor = vec4(newVel, 0.0, 1.0);
}

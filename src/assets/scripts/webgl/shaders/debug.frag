precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D debug;

void main() {
  fragColor = texture(debug, vUv);
}

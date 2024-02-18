precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform float stdDev;
uniform sampler2D target;
uniform vec2 px;
uniform int radius;

#define PI2 6.283185307179586

float gaussian(int i) {
  float x = float(i);
  // expはxが0の時1
  // stdDev: 値が小さいほどxが0の時の値が大きくブラーがかからない(中心の比重が大きい)
  return exp(- (x * x) / (2.0 * (stdDev * stdDev))) / (sqrt(PI2) * stdDev);
}

void main() {
  float weight = gaussian(0);
  float blur = texture(target, vUv).r * weight;

  vec2 step = vec2(0.0, 1.0);
  #ifdef HORIZONTAL
    step = vec2(1.0, 0.0);
  #endif
  step *= px;

  for(int i = 1; i <= radius; i++) {
    float sampleWeight = gaussian(i);
    
    vec2 sampleUv = vUv + step * float(i);
    blur += texture(target, sampleUv).r * sampleWeight;
    weight += sampleWeight;

    sampleUv = vUv - step * float(i);
    blur += texture(target, sampleUv).r * sampleWeight;
    weight += sampleWeight;
  }
  blur /= weight;

  fragColor = vec4(vec3(blur), 1.0);
}

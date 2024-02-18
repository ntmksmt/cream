precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform vec2 resolution;
uniform sampler2D heightMap;
uniform sampler2D normalMap;
uniform float radius;
uniform float intensity;

#define PI 3.141592653589793
#define PI2 6.283185307179586

// 4を割り切れる値(4や8など)だと不規則にサンプリングできず仕上がりが綺麗にならないので注意
#define SAMPLES 7
#define RINGS 4

const float INV_SAMPLES = 1.0 / float(SAMPLES);
const float ANGLE_STEP = float(RINGS) * PI2 / float(SAMPLES);

highp float rand(vec2 uv) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot(uv.xy, vec2(a, b)), sn = mod(dt, PI);
	return fract(sin(sn) * c);
}

float pow2(float x) {
  return x * x;
}

float getOcclusion(vec3 pos, vec3 samplePos, vec3 nor) {
  // サンプリング位置へのベクトルと距離
  vec3 viewDelta = samplePos - pos;
  float viewDistance = length(viewDelta);

  return max(
    0.0,
    // 遮蔽度 / 遮蔽物との距離(近いほど結果は大きくなる)
    (dot(nor, viewDelta) / viewDistance)
    // 遮蔽物が遠いほど減衰
  ) / (1.0 + pow2(viewDistance));
}

void main() {
  vec2 xy = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
  float z = texture(heightMap, vUv).r;
  vec3 pos = vec3(xy, z);

  vec3 nor = texture(normalMap, vUv).xyz;

  vec2 rad = vec2(radius * INV_SAMPLES) / resolution;
  vec2 radStep = rad;
  float angle = rand(vUv) * PI2;
  float occ = 0.0;
  float weight = 0.0;
  
  for(int i = 0; i < SAMPLES; i++) {
    // vUvから半径radの範囲内でランダムに座標を取得する
    vec2 sampleUv = vUv + vec2(cos(angle), sin(angle)) * rad;

    float sampleZ = texture(heightMap, sampleUv).r;
    vec2 ratio = resolution / resolution.y;
    vec2 sampleXY = sampleUv * 2.0 - 1.0; // -1〜1
    sampleXY *= ratio;
    vec3 samplePos = vec3(sampleXY, sampleZ);

    occ += getOcclusion(pos, samplePos, nor);
    weight += 1.0;

    rad += radStep;
    angle += ANGLE_STEP;
  }

  occ /= weight;
  occ *= intensity;

  fragColor = vec4(vec3(1.0 - occ), 1.0);
}

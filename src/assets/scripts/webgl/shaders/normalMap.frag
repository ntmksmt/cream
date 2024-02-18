precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D heightMap;
uniform vec2 resolution;
uniform vec2 px;

float getHeight(vec2 uv) {
  return texture(heightMap, uv).r; // * heightScale;
}

vec3 calcNormal() {
  vec3 nor = vec3(0.0);
  vec2 ratio = resolution / resolution.y;

  float height = getHeight(vUv);
  vec3 pos = vec3(vUv * ratio, height);

  vec2 uvR = vUv + vec2(1.0, 0.0) * px;
  float heightR = getHeight(uvR);
  vec3 posR = vec3(uvR * ratio, heightR);

  vec2 uvL = vUv + vec2(- 1.0, 0.0) * px;
  float heightL = getHeight(uvL);
  vec3 posL = vec3(uvL * ratio, heightL);

  vec2 uvT = vUv + vec2(0.0, 1.0) * px;
  float heightT = getHeight(uvT);
  vec3 posT = vec3(uvT * ratio, heightT);

  vec2 uvB = vUv + vec2(0.0, - 1.0) * px;
  float heightB = getHeight(uvB);
  vec3 posB = vec3(uvB * ratio, heightB);

  nor += cross(posR - pos, posT - pos);
  nor += cross(posT - pos, posL - pos);
  nor += cross(posL - pos, posB - pos);
  nor += cross(posB - pos, posR - pos);
  nor = normalize(nor);

  return nor;
}

void main() {
  vec3 nor = vec3(0.0);
  float alpha = 0.0;

  float height = getHeight(vUv);
  if(height > 0.0) {
    nor = calcNormal();
    alpha = 1.0;
  }

  fragColor = vec4(nor, alpha);
}

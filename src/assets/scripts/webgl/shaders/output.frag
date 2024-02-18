precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform vec2 resolution;
uniform sampler2D heightMap;
uniform sampler2D normalMap;
uniform float fov;
uniform float minHeight;
uniform float transmissionThreshold;
uniform vec3 albedo;
uniform float metalness;
uniform float roughness;
uniform float IOR;
uniform sampler2D SSS;
uniform float ambientMinIntensity;
uniform float ambientMaxIntensity;
uniform vec3 ambientColor;
uniform float ambientMix;
uniform samplerCube cubeMap;
uniform float cubeMapLod;
uniform float cubeMapIntensity;

#define PI 3.141592653589793
#define GAMMA 2.2

struct Light {
  vec3 position;
  float intensity;
  vec3 color;
};
uniform Light lights[LIGHTS_NUMBER];

const float minDot = 1e-3;
float dot_c(vec3 a, vec3 b) {
	return max(dot(a, b), minDot);
}

// cosTheta1〜0でF0〜1-roughnessを返す
vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
  return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
}

// Trowbridge-Reitz
float distribution(vec3 nor, vec3 h, float roughness) {
  // dot_c(nor, h)が1、roughnessが小さいほど大きな値を返すが、
  // dot_c(nor, h)が小さくなってもroughnessが大きければそこそこ大きな値を返す
  // (表面がゴワゴワだと広範囲で反射するイメージ)
  float a_2 = roughness * roughness;
	return a_2 / (PI * pow(pow(dot_c(nor, h), 2.0) * (a_2 - 1.0) + 1.0, 2.0));
}

// GGX and Schlick-Beckmann
// cosTheta1〜0で1〜0を返す(ただしkが小さいほど大きな値を返す)
float geometry(float cosTheta, float k) {
  return cosTheta / (cosTheta * (1.0 - k) + k);
}

float smiths(float NdotL, float NdotV, float roughness) {
  // roughness0〜1の時、0.125〜0.5
  float k = pow(roughness + 1.0, 2.0) / 8.0;
  return geometry(NdotL, k) * geometry(NdotV, k);
}

float specularBRDF(vec3 nor, vec3 viewDir, vec3 lightDir, vec3 h, float roughness) {
  float NdotL = dot_c(nor, lightDir);
  float NdotV = dot_c(nor, viewDir);

  // Normal distribution(微小面法線分布関数)
	// 物体表面のミクロレベルの各微小平面の法線がどれくらい指定の方向を向いているか
  float D = distribution(nor, h, roughness);

  // マイクロファセット同士が反射経路を遮蔽することによる減衰
  float G = smiths(NdotL, NdotV, roughness);

  // 明るい部分は減衰、暗い部分は増幅
  float V = G / max(0.0001, (4.0 * NdotL * NdotV));

  // 程よい直射と照り返し
  return D * V;
}

vec3 getAmbientLight(vec3 nor) {
  vec3 gradient = mix(vec3(ambientMinIntensity), vec3(ambientMaxIntensity), nor.y * 0.5 + 0.5);
  return mix(gradient, ambientColor * 4.0, ambientMix);
}

vec3 getIrradiance(vec3 pos, vec3 nor, vec3 rd, float transmission) {
  vec3 albedo = albedo;
  float metalness = metalness;
  float roughness = roughness;
  float IOR = IOR;
  vec3 F0 = vec3(pow(IOR - 1.0, 2.0) / pow(IOR + 1.0, 2.0));

  vec3 directDiffuse = vec3(0.0);
  vec3 directSpecular = vec3(0.0);
  for(int i = 0; i < LIGHTS_NUMBER; i++) {
    // light
    vec3 lightDir = normalize(lights[i].position - pos);
    vec3 lightRadiance = lights[i].color * lights[i].intensity;

    // directDiffuse
    float NdotL = dot(nor, lightDir) * 0.5 + 0.5; // 0〜1
    vec3 SSS = texture(SSS, vec2(NdotL, 1.0)).rgb;
    directDiffuse += albedo * SSS * lightRadiance;

    // directSpecular
    vec3 h = normalize(- rd + lightDir);
    // 現在の角度から見たマイクロファセットの反射率
    vec3 F = fresnelSchlickRoughness(dot_c(h, - rd), F0, roughness);
    vec3 specular = F * specularBRDF(nor, - rd, lightDir, h, roughness);
    directSpecular += specular * lightRadiance * dot_c(nor, lightDir);
  }

  vec3 F = fresnelSchlickRoughness(dot_c(nor, - rd), F0, roughness);
  vec3 kD = (1.0 - F) * (1.0 - metalness);

  vec3 ambientLight = getAmbientLight(nor);
  vec3 ambientDiffuse = ambientLight * kD * albedo / PI;
  ambientDiffuse += F * 0.5 * ambientColor;

  vec3 env = textureLod(cubeMap, normalize(reflect(rd, nor)), cubeMapLod).rgb * cubeMapIntensity;
  vec3 ambientSpecular = env * F;

  vec3 diffuse = directDiffuse + ambientDiffuse;

  diffuse = mix(ambientColor, diffuse, transmission);
  
  vec3 irradiance = diffuse + directSpecular + ambientSpecular;
  
  return irradiance;
}

// https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
vec3 ACESFilm(vec3 x) {
	return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 xy = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
  float z = texture(heightMap, vUv).r;
  vec3 pos = vec3(xy, z);

  vec3 nor = texture(normalMap, vUv).xyz;

  float roZ = 1.0 / tan(radians(fov) / 2.0);
  vec3 ro = vec3(0.0, 0.0, roZ);
  vec3 rd = normalize(pos - ro);

  vec3 col = ambientColor;
  if(z > minHeight) {
    float transmission = smoothstep(0.0, transmissionThreshold, z);
    col = getIrradiance(pos, nor, rd, transmission);
  }

  col = ACESFilm(col);
  col = pow(col, vec3(1.0 / GAMMA));

  fragColor = vec4(col, 1.0);
}

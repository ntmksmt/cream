precision highp float;

in vec2 vUv;

out vec4 fragColor;

#define PI 3.141592653589793
#define PI2 6.283185307179586

#define STEPS 128.0

float gaussian(float v, float x) {
  return exp(- (x * x) / (2.0 * v)) / sqrt(PI2 * v);
}

// https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-14-advanced-techniques-realistic-real-time-skin
vec3 getProfile(float x) {
	return gaussian(0.0064, x) * vec3(0.233, 0.455, 0.649) +
				 gaussian(0.0484, x) * vec3(0.100, 0.336, 0.344) +
				 gaussian(0.1870, x) * vec3(0.118, 0.198, 0.000) +
				 gaussian(0.5670, x) * vec3(0.113, 0.007, 0.007) +
				 gaussian(1.9900, x) * vec3(0.358, 0.004, 0.000) +
				 gaussian(7.4100, x) * vec3(0.078, 0.000, 0.000);
}

// angle: PI〜0, r: Y*2〜1
vec3 integrateProfile(float angle, float r) {
  vec3 totalLight = vec3(0);
	vec3 weight = vec3(0);
  float delta = PI2 / STEPS;

  for(float theta = 0.0; theta < PI2; theta += delta) {
    // https://en.wikipedia.org/wiki/Chord_(geometry)
    float dist = 2.0 * r * sin(0.5 * theta);

    vec3 scattering = getProfile(dist);

    totalLight += max(0.0, cos(angle + theta)) * scattering;
    weight += scattering;
  }

  return totalLight / weight;
}

void main() {
  vec3 col = integrateProfile(PI - vUv.x * PI, 1.0 / vUv.y);
  fragColor = vec4(col, 1.0);
}

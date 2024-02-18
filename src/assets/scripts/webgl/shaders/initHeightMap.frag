precision highp float;

out vec4 fragColor;

uniform vec2 resolution;
uniform float fov;

const int ITERATION = 200;
const float MIN_DIST = 0.00001;
const float MAX_DIST = 100.0;

const float RAD = 0.4;
const float MAX_HEIGHT = 0.08;

mat3 lookAt(vec3 ro, vec3 ta, vec3 up) {
  vec3 zaxis = normalize(ta - ro);    
  vec3 xaxis = normalize(cross(zaxis, up));
  vec3 yaxis = cross(xaxis, zaxis);
  return mat3(xaxis, yaxis, - zaxis);
}

#define R(pos, rad) pos = cos(rad) * pos + sin(rad) * vec2(pos.y, - pos.x)
vec3 rot(vec3 pos, vec3 deg) {
  vec3 rad = vec3(radians(deg.x), radians(deg.y), radians(deg.z));
  R(pos.xz, rad.y);
  R(pos.yx, rad.z);
  R(pos.zy, rad.x);
  return pos;
}

float sdTorus(vec3 pos, vec2 t) {
  vec2 q = vec2(length(pos.xy) - t.x, pos.z);
  return length(q) - t.y;
}

float sdCappedTorus(vec3 pos, vec2 r, float deg) {
  float rad = radians(deg);
  pos.x = abs(pos.x);
  vec2 sc = vec2(sin(rad), cos(rad));
  float k = (sc.y * pos.x > sc.x * pos.y) ? dot(pos.xy, sc) : length(pos.xy);
  return sqrt(dot(pos, pos) + r.x * r.x - 2.0 * r.x * k) - r.y;
}

float sdSphere(vec3 pos, float r) {
  return length(pos) - r;
}

float fOpUnion(float a, float b) {
  return a < b ? a : b;
}

float fOpUnionSmooth(float a, float b, float r) {
  vec2 u = max(vec2(r - a, r - b), vec2(0));
  return max(r, min (a, b)) - length(u);
}

float sdScene(vec3 pos) {
  float depth = MAX_DIST;
  float res = MAX_DIST;

  // depth = sdSphere(pos, 0.4);

  pos -= vec3(0.01, 0.05, 0.0);
  pos *= 0.95;
  pos = rot(pos, vec3(0.0, 0.0, -5.0));

  depth = sdTorus(pos, vec2(0.325, 0.02));

  depth = fOpUnionSmooth(
    sdSphere(pos - vec3(- 0.1, 0.25, - 0.04), 0.05),
    depth, 0.1
  );

  depth = fOpUnionSmooth(
    sdCappedTorus(rot(pos - vec3(- 0.17, - 0.17, 0.0), vec3(0.0, 0.0, - 135.0)), vec2(0.2, 0.05), 100.0),
    depth, 0.1
  );

  depth = fOpUnionSmooth(
    sdSphere(pos - vec3(- 0.22, 0.13, 0.0), 0.06),
    depth, 0.1
  );

  depth = fOpUnionSmooth(
    sdCappedTorus(rot(pos - vec3(0.18, - 0.1, 0.0), vec3(0.0, 0.0, 110.0)), vec2(0.2, 0.03), 90.0),
    depth, 0.1
  );

  depth = fOpUnionSmooth(
    sdSphere(pos - vec3(0.2, - 0.29, 0.0), 0.01),
    depth, 0.09
  );

  depth = fOpUnionSmooth(
    sdCappedTorus(rot(pos - vec3(0.075, 0.14, - 0.02), vec3(5.0, 5.0, 25.0)), vec2(0.18, 0.04), 60.0),
    depth, 0.08
  );

  depth = fOpUnionSmooth(
    sdCappedTorus(rot(pos - vec3(- 0.06, - 0.05, 0.0), vec3(- 15.0, 10.0, - 140.0)), vec2(0.16, 0.045), 180.0),
    depth, 0.08
  );

  depth = fOpUnionSmooth(
    sdCappedTorus(rot(pos - vec3(0.07, - 0.04, - 0.08), vec3(- 20.0, 10.0, 90.0)), vec2(0.17, 0.05), 80.0),
    depth, 0.07
  );

  depth = fOpUnionSmooth(
    sdCappedTorus(rot(pos - vec3(- 0.01, 0.04, - 0.0), vec3(0.0, - 20.0, - 60.0)), vec2(0.15, 0.04), 120.0),
    depth, 0.07
  );

  depth = fOpUnionSmooth(
    sdCappedTorus(rot(pos - vec3(0.04, 0.05, - 0.06), vec3(- 20.0, 3.0, 20.0)), vec2(0.2, 0.02), 50.0),
    depth, 0.06
  );

  depth = fOpUnionSmooth(
    sdSphere(pos - vec3(- 0.02, 0.0, - 0.06), 0.11),
    depth, 0.07
  );

  res = fOpUnion(depth, res);

  return res;
}

float intersect(vec3 ro, vec3 rd) {
  float depth = MIN_DIST;

  for(int i = 0; i < ITERATION; i++) {
    vec3 pos = ro + depth * rd;
    float res = sdScene(pos);
    res *= 0.5;
    if(abs(res) < MIN_DIST || res >= MAX_DIST) break;
    depth += res;
  }

  return depth;
}

vec3 render(vec3 ro, vec3 rd) {
  float depth = intersect(ro, rd);
  vec3 pos = ro + depth * rd;
  float height = clamp(pos.z, 0.0, 1.0);
  height *= 0.9;
  return vec3(height);
}

void main() {
  // ray origin/direction
  vec2 xy = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
  float z = 1.0 / tan(radians(fov) / 2.0);
  vec3 rd = normalize(vec3(xy, - z));

  vec3 ro = vec3(0.0, 0.0, z);
  vec3 ta = vec3(0.0);
  vec3 up = vec3(0.0, 1.0, 0.0);

  mat3 viewMat = lookAt(ro, ta, up);
  rd = normalize(viewMat * rd);

  vec3 heightMap = render(ro, rd);

  fragColor = vec4(heightMap, 1.0);
}

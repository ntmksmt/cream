precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D velocity;
uniform float velocityAttenuation;
uniform bool isClick;
uniform vec2 resolution;
uniform vec2 currentMouse;
uniform vec2 lastMouse;
uniform float delta;
uniform float forcesRadius;

float getDistance(vec2 cMouse, vec2 lMouse, vec2 pos) {
  vec2 d = pos - cMouse;
  vec2 x = lMouse - cMouse;
  float lx = length(x);

  if(lx <= 0.0001) return length(d);

  // c -> lの単位ベクトルとdの内積
  // マウス前方 -> -
  // マウス後方 -> 0〜1(距離1), 1〜
  float projection = dot(d, x / lx);

  if(projection < 0.0) {
    return length(d);
  } else if(projection > lx) {
    return length(pos - lMouse);
  } else {
    return sqrt(abs(dot(d, d) - projection * projection));
  }
}

void main() {
  vec2 vel = texture(velocity, vUv).xy;
  vel *= velocityAttenuation;

  if(isClick) {
    vec2 ratio = resolution / resolution.y;
    vec2 cMouse = currentMouse * ratio;
    vec2 lMouse = lastMouse * ratio;
    vec2 mouseVel = (cMouse - lMouse) / delta;

    vec2 pos = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
    float d = getDistance(cMouse, lMouse, pos);
    float strength = d;
    strength /= forcesRadius;
    strength = smoothstep(1.0, 0.0, strength);
    
    vel += mouseVel * strength;
  }

  fragColor = vec4(vel, 0.0, 1.0);
}

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D heightMap;
uniform sampler2D velocity;
uniform float velStrength;
uniform vec2 resolution;
uniform float delta;
uniform vec2 px;

void main() {
  // minus
  float height = texture(heightMap, vUv).r;
  vec2 vel = texture(velocity, vUv).xy;
  float minusStrength = length(vel) * velStrength;
  float minus = min(height * minusStrength, height);

  // // plus
  // vec2 pos = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
  // // 移動前の座標(Yを-1〜1 -> -1〜1 -> 0〜1)
  // vec2 tracedPos = pos - texture(velocity, vUv).xy * delta;
  // vec2 ratio = resolution / resolution.y;
  // tracedPos = tracedPos / ratio;
  // tracedPos = (tracedPos + 1.0) * 0.5;

  // float tracedHeight = texture(heightMap, tracedPos).r;
  // vec2 tracedVel = texture(velocity, tracedPos).xy;

  // plus
  vec2 pos = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
  // 移動前の座標(Yを-1〜1 -> -1〜1 -> 0〜1 -> 0〜resolution)
  vec2 tracedPos = pos - texture(velocity, vUv).xy * delta;
  vec2 ratio = resolution / resolution.y;
  tracedPos = tracedPos / ratio;
  tracedPos = (tracedPos + 1.0) * 0.5;
  tracedPos /= px;

  vec4 st;
  // 0.5を境界にセルの中心を求める
  // 例 tracedPos v2(50.6, 50.4) -> v2(50.5, 49.5)
  st.xy = floor(tracedPos - 0.5) + 0.5;
  st.zw = st.xy + 1.0;

  // st -> 本来の位置
  vec2 t = tracedPos - st.xy;

  // 0〜resolution -> 0〜1
  st *= px.xyxy;

  // 隣接ピクセルの加重平均(高さと速度)
  float heightC = texture(heightMap, st.xy).r;
  float heightR = texture(heightMap, st.zy).r;
  float heightT = texture(heightMap, st.xw).r;
  float heightTR = texture(heightMap, st.zw).r;

  float tracedHeight = mix(
    mix(heightC, heightR, t.x),
    mix(heightT, heightTR, t.x),
    t.y
  );

  vec2 velC = texture(velocity, st.xy).xy;
  vec2 velR = texture(velocity, st.zy).xy;
  vec2 velT = texture(velocity, st.xw).xy;
  vec2 velTR = texture(velocity, st.zw).xy;

  vec2 tracedVel = mix(
    mix(velC, velR, t.x),
    mix(velT, velTR, t.x),
    t.y
  );

  float plusStrength = length(tracedVel) * velStrength;
  float plus = min(tracedHeight * plusStrength, tracedHeight);

  float newHeight = max(height - minus + plus, 0.0);

  fragColor = vec4(vec3(newHeight), 1.0);
}

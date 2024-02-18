float getPressue(sampler2D pressure, vec2 uv, vec2 px) {
  vec2 cellOffset = vec2(0.0, 0.0);

  if(uv.x < 0.0) {
		cellOffset.x = 1.0;
	} else if(uv.x > 1.0) {
		cellOffset.x = - 1.0;
	}
	if(uv.y < 0.0) {
		cellOffset.y = 1.0;
	} else if(uv.y > 1.0) {
		cellOffset.y = - 1.0;
	}

  return texture(pressure, uv + cellOffset * px).x;
}

vec2 getVelocity(sampler2D velocity, vec2 uv, vec2 px) {
  vec2 cellOffset = vec2(0.0, 0.0);
	vec2 multiplier = vec2(1.0, 1.0);

  if(uv.x < 0.0) {
		cellOffset.x = 1.0;
		multiplier.x = - 1.0;
	} else if(uv.x > 1.0) {
		cellOffset.x = - 1.0;
		multiplier.x = - 1.0;
	}
	if(uv.y < 0.0) {
		cellOffset.y = 1.0;
		multiplier.y = - 1.0;
	} else if(uv.y > 1.0) {
		cellOffset.y = - 1.0;
		multiplier.y = - 1.0;
	}

  return multiplier * texture(velocity, uv + cellOffset * px).xy;
}

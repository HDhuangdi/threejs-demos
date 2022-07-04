

uniform sampler2D u_texture;

varying vec3 v_color;
varying float v_opacity;

void main() {
  if (v_opacity <= 0.0) {
    discard;
  }
  vec4 t_color = texture2D(u_texture, gl_PointCoord);
  float a = t_color.a * v_opacity;
  vec3 color = vec3(t_color.xyz) * v_color;
  gl_FragColor = vec4(color, a);
}
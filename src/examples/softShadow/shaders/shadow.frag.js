export default `
precision mediump float;

uniform vec3 u_color;
uniform sampler2D u_depth_texture;
varying vec4 v_pos_from_light;
void main() {
  vec3 shadow_coord = (v_pos_from_light.xyz / v_pos_from_light.w) / 2.0 + 0.5;
  float z = pow(shadow_coord.z, 5000.0);
  vec4 rgba_depth = texture2D(u_depth_texture, shadow_coord.xy);
  float depth = rgba_depth.r;
  float factor = (z > depth + 0.005) ? 0.5 : 1.0;
  gl_FragColor = vec4(factor, factor, factor, 1.0);
}
`
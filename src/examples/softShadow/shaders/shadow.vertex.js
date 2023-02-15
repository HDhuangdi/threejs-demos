export default `
uniform mat4 u_light_view_matrix;
uniform mat4 u_light_proj_matrix;
varying vec4 v_pos_from_light;
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  v_pos_from_light = u_light_proj_matrix * u_light_view_matrix * modelMatrix * vec4(position, 1.0);
}
`
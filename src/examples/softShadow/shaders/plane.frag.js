export default `
uniform sampler2D u_scene_texture;
uniform sampler2D u_shadow_texture;
varying vec2 v_uv;
void main() {
  vec4 scene_color = texture2D(u_scene_texture, v_uv);
  vec4 shadow_color = texture2D(u_shadow_texture, v_uv);

    vec4 color = (shadow_color * scene_color) ;
    vec4 result = vec4(1.0) - exp(-color * 1.0);
    gl_FragColor = color;
}
`
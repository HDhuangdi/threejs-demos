attribute vec3 color;
attribute float size;
attribute float opacity;

varying vec3 v_color;
varying float v_opacity;

const float radius = 1.0;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize =size * ( 300.0 / length( gl_Position.xyz ) );

  v_color = color;
  v_opacity = opacity;
}
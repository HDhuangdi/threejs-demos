attribute vec3 color;
attribute float size;
attribute float opacity;

varying vec3 v_color;
varying float v_opacity;

void main() {
  gl_PointSize = size;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

  v_color = color;
  v_opacity = opacity;
}
export default `
precision mediump float;

void main() {
  gl_FragColor = vec4(pow(gl_FragCoord.z, 5000.0), 0.0, 0.0, 0.0);
}
`
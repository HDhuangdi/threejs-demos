export default `
uniform sampler2D u_texture;
uniform float u_texture_width;
uniform float u_texture_height;
uniform float u_blur_radius;

varying vec2 v_uv;

vec4 box_blur_x(sampler2D tex, vec2 uv, float texture_width, float radius) {
    vec4 color = texture2D(tex, uv);
	vec3 sum_c = color.rgb;
   	vec2 offset = vec2(1.0 / texture_width, 0.0);
    for(float i = 1.5; i <= 100.0; i += 2.0){
        if (i > radius) {
            break;
        }
    	sum_c += texture2D(tex, uv + offset * i).rgb * 2.0;
        sum_c += texture2D(tex, uv - offset * i).rgb * 2.0;
    }
    return vec4(sum_c / (2.0 * radius + 1.0), color.a);
}

float gaussianPdf(in float x, in float sigma) {
    return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;
}

vec4 gaussian_blur(vec2 texSize, sampler2D colorTexture, vec2 uv, vec2 direction) {
    vec2 invSize = 1.0 / texSize;
    float fSigma = 4.0;
    float weightSum = gaussianPdf(0.0, fSigma);
    vec4 diffuseSum = texture2D(colorTexture, uv) * weightSum;
    for( float i = 1.0; i < 100.0; i++ ) {
        if (i > u_blur_radius) { break; }
        float w = gaussianPdf(i, fSigma);
        vec2 uvOffset = direction * invSize * i;
        vec4 sample1 = texture2D(colorTexture, uv + uvOffset);
        vec4 sample2 = texture2D(colorTexture, uv - uvOffset);
        diffuseSum += (sample1 + sample2) * w;
        weightSum += 2.0 * w;
    }
    return diffuseSum / weightSum;
}


void main() {
    vec4 blur_color = gaussian_blur(vec2(u_texture_width, u_texture_height), u_texture, v_uv, vec2(1.0, 0.0));
    vec4 color = texture2D(u_texture, v_uv);
    // gl_FragColor = vec4(blur_color.rgb, color.a);
    gl_FragColor = blur_color;
}
`
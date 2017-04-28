// Author: Charlotte Dann
// Title: Gems

#ifdef GL_ES
precision mediump float;
#endif

//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

// https://gist.github.com/983/e170a24ae8eba2cd174f
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

/////////////////////////////////////////////////////////////////////////

// This is where my code starts

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

// the following line is replaces with the javascript options
// VARIABLES //

float outline(vec2 pos, float fuzz, float noiseShift) {
    vec2 center = vec2(0.0, 0.0);
    float a = atan(pos.y, pos.x);
    float pct = distance(center, pos);

    float noise = snoise(vec3(
        pos.x*2.0*(shapeRoughness+0.5),
        pos.y*2.0*(shapeRoughness+0.5),
        noiseShift + noiseOffset));

    float far = 0.2*(shapeSize+0.8 - fuzz*0.2) + noise*shapeChangability*0.1 - shapeChangability*0.05;
    float near = far - (far * 0.1 * fuzz);
    return min(1.0, 1.0 - smoothstep(abs(pct), near, far) + step(pct, far));
}

float tweakOutline(vec2 pos, float edge, float degree, float scale, float scalar, float timer) {
    float tweakSize = 5.0 / (shapeSize + 0.5);
    float result = abs(snoise(vec3(
        pos.x*scalar*scale,
        pos.y*scalar*scale,
        (timer + noiseOffset))));
    return result * edge * pow(degree, 2.0);
}

void main() {
    vec2 pos = gl_FragCoord.xy/u_resolution.xy - 0.5;
    if (u_resolution.x > u_resolution.y) {
        pos.x *= u_resolution.x/u_resolution.y;
    }
    else {
        pos.y *= u_resolution.y/u_resolution.x;
    }

    float r = 0.0;
    float g = 0.0;
    float b = 0.0;
    float a = 1.0;

    float edge = outline(pos, shapeFuzz, 0.0);
    vec3 baseColor = hsv2rgb(vec3(colorBase, 0.1+colorBaseSaturation*0.5, 0.4+0.4*colorBaseSaturation));
    a -= 0.6 * (colorBaseBrightness - 1.0);
    r += edge * baseColor.x;
    g += edge * baseColor.y;
    b += edge * baseColor.z;

    // add a highlight to the edge
    float highlight = edge - outline(pos * (1.0 + highlightSize * 0.5), 2.0, 0.2);
    r *= 1.0 + highlight * highlightShine * (shapeFuzz + 0.5) * 0.1;
    g *= 1.0 + highlight * highlightShine * (shapeFuzz + 0.5) * 0.1;
    b *= 1.0 + highlight * highlightShine * (shapeFuzz + 0.5) * 0.1;

    // make some colour tweaks
    float tweakSize = 5.0 / (shapeSize + 0.5);
    float tweakRNoise = tweakOutline(pos, edge, colorTweakRDegree, colorTweakRScale, tweakSize, 10.0);
    r += tweakRNoise;
    float tweakGNoise = tweakOutline(pos, edge, colorTweakGDegree, colorTweakGScale, tweakSize, 11.0);
    g += tweakGNoise;
    float tweakBNoise = tweakOutline(pos, edge, colorTweakBDegree, colorTweakBScale, tweakSize, 11.0);
    b += tweakBNoise;
    // up the alpha according to tweak levels
    a += 1.0*(tweakRNoise + tweakGNoise + tweakBNoise);

    gl_FragColor = vec4(r, g, b, a);
}

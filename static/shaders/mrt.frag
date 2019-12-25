#version 300 es
precision highp float;


in vec4 v_color;
in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_view;
// Now we have 2 outputs, one for each render target
layout(location=0) out vec4 color; // This will be sent to the first attachment
layout(location=1) out vec4 normal; // This will be sent to the second attachment

uniform vec4 tint;
uniform sampler2D texture_sampler;
uniform vec3 computation;

float diffuse(vec3 n, vec3 l){
    //Diffuse (Lambert) term computation: reflected light = cosine the light incidence angle on the surface
    return max(0.0f, dot(n,l));
}

float specular(vec3 n, vec3 l, vec3 v, float shininess){
    //Phong Specular term computation
    return pow(max(0.0f, dot(v,reflect(-l, n))), shininess);
}

void main(){
    vec3 n = normalize(v_normal);
    vec3 v = normalize(v_view);
    vec3 l = - light.direction;
    color = texture(texture_sampler, v_texcoord) * v_color * tint; // Send our interpolated color
    normal = vec4(normalize(v_normal), 1.0f);
}
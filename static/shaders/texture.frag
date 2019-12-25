#version 300 es
precision highp float;
in vec3 v_pos;
in vec4 v_color;
in vec2 v_texcoord;
out vec4 color;
const float contrast = 0.3f; 
uniform vec4 tint;
uniform sampler2D texture_sampler;
in vec3 v_normal;  
uniform vec3 lightPos;  
uniform vec3 lightColor;
uniform vec3 objectColor;
uniform mat4 MVP;
uniform vec3 viewPos;

void main(){
    color = texture(texture_sampler, v_texcoord) * v_color * tint;
    float ambientStrength = 1.9;
    vec3 ambient = ambientStrength * lightColor;
    vec3 noramlization = normalize(v_normal);
    vec3 lightDirevtion = normalize(lightPos - v_pos); 
    float diff = max(dot(noramlization, lightDirevtion), 0.0);
    vec3 diffuse = diff * lightColor;
    float specularStrength = 0.5;
    vec3 viewDir = normalize(viewPos - v_pos);
    vec3 reflectDir = reflect(-lightDirevtion, noramlization); 
    float spec=max(dot(viewDir, reflectDir),0.0);
    spec = pow(spec, 32.0);
    vec3 specular = specularStrength * spec * lightColor; 

    vec3 result = (ambient + diffuse+ specular) * lightColor;
    color = vec4(result, 1.0)*texture(texture_sampler, v_texcoord) * v_color * tint;
}
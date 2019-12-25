import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4 } from 'gl-matrix';
import { Cube } from '../common/mesh-utils';
import * as MeshUtils from '../common/mesh-utils';
import {player, asteroid} from '../characters/spaceship';
import * as gameUtils from '../common/game-utils';
import { Howl, Howler } from 'howler'


// In this scene we will draw one rectangle with a texture
export default class myGameScene extends Scene {
    camera: Camera;
    controller: FlyCameraController;
    textures: WebGLTexture[] = [];
    current_texture: number = 0;
    sampler: WebGLSampler;
    programs: {[name: string]: ShaderProgram} = {};
    meshes: {[name:string]: Mesh} = {};
// game attributes 
    myPlayer: player;
    asteroidLevel: asteroid[][];
    numOfBatches:number = 5;       // each batch has 3 enemies    
    batchDistance:number = 10; // this is the distance between each batch of enemies
    objectDistance:number = 4;
    playerData: any;
    asteroidData: any;
    //1.591956615447998, 3.2584495544433594, 14.3014497756958
    lightPos:vec3 = vec3.fromValues(1.591956615447998, 3.2584495544433594, 14.3014497756958) ;
    lightColor:vec3 = vec3.fromValues(1.0,1.0,1.0);
    objectColor:vec3 =vec3.fromValues(1.0, 0.5, 0.31);
    texcoordinates: Float32Array = new Float32Array([
        0, 1,
        1, 1,
        1, 0,
        0, 0,
    ]);
    wrap_s: number;
    wrap_t: number;
    mag_filter: number;
    min_filter: number;

    playerPosition: vec3 = vec3.fromValues(1,1,1);

    static readonly cubemapDirections = ['negx', 'negy', 'negz', 'posx', 'posy', 'posz'];
    
    public load(): void {
        // These shaders take 2 uniform: MVP for 3D transformation and Tint for modifying colors
        this.game.loader.load({
            ["sound"]:{url:'sounds/game.mp3', type:'text'},
            ["texture.vert"]:{url:'shaders/texture.vert', type:'text'},
            ["texture.frag"]:{url:'shaders/texture.frag', type:'text'},
            ["sky.frag"]:{url:'shaders/sky.frag', type:'text'},
            ["sky.vert"]:{url:'shaders/sky.frag', type:'text'},
            ["texture"]:{url:'images/color-grid.png', type:'image'},
            ["sky-cube.vert"]:{url:'shaders/sky-cube.vert', type:'text'},
            ["sky-cube.frag"]:{url:'shaders/sky-cube.frag', type:'text'},
            ["spaceship"]: { url: "models/spaceships/spaceship2.obj", type: "text" },
            ["spaceship-texture"]: {
                url: "models/spaceships/sh3.png",
                type: "image"
            },
            ["spaceship1"]:{url:'models/Suzanne/Suzanne.obj', type:'text'},
            ["spaceship-texture1"]:{url:'models/spaceships/sh3.jpg', type:'image'},
            ["asteroid"]:{url:'models/astroid/ad.obj', type:'text'},
            ["asteroid-texture"]:{url:'models/astroid/astext.jpg', type:'image'},
            ["player-data"] : {url: 'gamedata/player.json', type: 'json'},
            ["asteroid-data"] : {url: 'gamedata/asteroid.json', type: 'json'},
             ...Object.fromEntries(myGameScene.cubemapDirections.map(dir=>[dir, {url:`images/space/${dir}.png`, type:'image'}]))

        });
    } 
    
    public start(): void {
        const infiniteGameSound = new Howl({
            src: "http://localhost:1234/sounds/game.mp3",
            loop: true,
            autoplay: true,
            volume: 0.5,
            onloaderror: (id, err) => {
                console.error(err);
            },
            onplayerror: () => {
                infiniteGameSound.once('unlock', () => {
                    infiniteGameSound.play();
                });
            },
        });

        this.playerData = this.game.loader.resources["player-data"];
        this.asteroidData = this.game.loader.resources["asteroid-data"];
        this.programs["cube"] = new ShaderProgram(this.gl);
        this.programs["cube"] .attach(this.game.loader.resources["texture.vert"], this.gl.VERTEX_SHADER);
        this.programs["cube"] .attach(this.game.loader.resources["texture.frag"], this.gl.FRAGMENT_SHADER);
        this.programs["cube"] .link();

        this.programs['sky'] = new ShaderProgram(this.gl);
        this.programs['sky'].attach(this.game.loader.resources["sky-cube.vert"], this.gl.VERTEX_SHADER);
        this.programs['sky'].attach(this.game.loader.resources["sky-cube.frag"], this.gl.FRAGMENT_SHADER);
        this.programs['sky'].link();
        
        this.meshes['spaceship'] = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["spaceship"]);        
        {
            this.textures[0] = this.gl.createTexture();
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
            const image: ImageData = this.game.loader.resources['texture'];
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA8, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }

        {
            this.textures[1] = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[1]);
            const W = [255, 255, 255], Y = [255, 255, 0], B = [0, 0, 0];
            const data = new Uint8Array([
                ...W, ...W, ...W, ...Y, ...Y, ...Y, ...W, ...W, ...W,
                ...W, ...W, ...Y, ...Y, ...Y, ...Y, ...Y, ...W, ...W,
                ...W, ...Y, ...Y, ...Y, ...Y, ...Y, ...Y, ...Y, ...W,
                ...Y, ...Y, ...B, ...Y, ...Y, ...Y, ...B, ...Y, ...Y,
                ...Y, ...Y, ...B, ...Y, ...Y, ...Y, ...B, ...Y, ...Y,
                ...Y, ...Y, ...Y, ...Y, ...Y, ...Y, ...Y, ...Y, ...Y,
                ...W, ...Y, ...Y, ...B, ...B, ...B, ...Y, ...Y, ...W,
                ...W, ...W, ...Y, ...Y, ...Y, ...Y, ...Y, ...W, ...W,
                ...W, ...W, ...W, ...Y, ...Y, ...Y, ...W, ...W, ...W
            ]);
            this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB8, 9, 9, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, data);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }

        {
            this.textures[2] = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[2]);
            const WIDTH = 256, HEIGHT = 256;
            const data = new Uint8Array(WIDTH*HEIGHT);
            for(let j = 0; j < HEIGHT; j++){
                for(let i = 0; i < WIDTH; i++){
                    data[i + j*WIDTH] = (i+j)/2;
                }
            }
            this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.LUMINANCE, WIDTH, HEIGHT, 0, this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE, data);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }

        {
            this.textures[3] = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[3]);
            const WIDTH = 256, HEIGHT = 256;
            const data = new Float32Array(WIDTH*HEIGHT);
            for(let j = 0; j < HEIGHT; j++){
                for(let i = 0; i < WIDTH; i++){
                    data[i + j*WIDTH] = (i+j)/512;
                }
            }
            this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.R32F, WIDTH, HEIGHT, 0, this.gl.RED, this.gl.FLOAT, data);
            // this.gl.generateMipmap(this.gl.TEXTURE_2D); // MipMaps not supported for This type of textures
        }
       

        const target_directions = [
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z
        ]


        this.textures[4] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.textures[4]);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        for(let i = 0; i < 6; i++){
            this.gl.texImage2D(target_directions[i], 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources[myGameScene.cubemapDirections[i]]);
        }
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
        this.sampler = this.gl.createSampler();

        this.gl.samplerParameteri(this.sampler, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.samplerParameteri(this.sampler, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);

        this.wrap_s = this.wrap_t = this.gl.REPEAT;
        this.mag_filter = this.min_filter = this.gl.NEAREST;

        this.textures['spaceship'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['spaceship']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['spaceship-texture']);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);

        this.camera = new Camera();
        this.camera.type = 'perspective';
        this.camera.position = vec3.fromValues(0.5,0.8,-4.2);
        this.camera.direction = vec3.fromValues(0,0,1);
        this.camera.aspectRatio = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        
        this.controller = new FlyCameraController(this.camera, this.game.input);
        this.controller.movementSensitivity = 0.001;

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clearColor(0,0,0,1);
        this.setupControls();

          // Create a colored rectangle using our new Mesh class
          this.meshes["cube"] = Cube(this.gl);    

          this.meshes['sky'] = Cube(this.gl);
          this.programs["cube"].use();
          this.programs["cube"].setUniform1i("texture_sampler", 0);

            // A.2 draw the player
            this.myPlayer = new player(vec3.fromValues(this.playerData["initial-x"],this.playerData["initial-y"],this.playerData["initial-z"]), this.playerData.speed, this.playerData.width, this.playerData.height, this.playerData.length, this.playerData.shootPower, vec3.fromValues(this.playerData["direction-x"],this.playerData["direction-y"],this.playerData["direction-z"]), this.playerData.health, this, this.playerData);

         this.asteroidLevel = [];
           
            for(var i: number = 0; i < this.asteroidData["batch-number"]; i++) {
                this.asteroidLevel[i] = [];
                for(var j: number = -1; j<= 1; j++) {                
                       let randNum = gameUtils.getRndInteger(-1,1);
                       this.asteroidLevel[i][j+1]= new asteroid(vec3.fromValues(j * this.asteroidData["object-distance"],randNum * this.asteroidData["object-distance"],(i+1)*this.asteroidData["batch-distance"]), this.asteroidData["initial-speed"], this.asteroidData.width,this.asteroidData.height,this.asteroidData.length,3,vec3.fromValues(this.asteroidData["direction-x"],this.asteroidData["direction-y"],this.asteroidData["direction-z"]),this.asteroidData.health, this, this.asteroidData);
                }
            }

    }

    public draw(deltaTime: number): void {
        this.playerData = this.game.loader.resources["player-data"];
        this.asteroidData = this.game.loader.resources["asteroid-data"];
        this.controller.update(deltaTime);

        if(this.game.input.isKeyJustDown("i")){
            vec3.scaleAndAdd(this.playerPosition , this.playerPosition, [0,0,1], 1);        
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.programs["cube"] .use();
        this.meshes["cube"].setBufferData("texcoords", this.texcoordinates, this.gl.STREAM_DRAW);

        let VP = this.camera.ViewProjectionMatrix;
        
        let playerMat = mat4.clone(VP);
        mat4.translate(playerMat, playerMat, this.playerPosition);
        
        this.programs["cube"].setUniformMatrix4fv("MVP", false, playerMat);
        this.programs["cube"].setUniform4f("tint", [1, 1, 1, 1]);
        this.programs["cube"].setUniform3f("lightPos",this.lightPos);
        this.programs["cube"].setUniform3f("lightColor",this.lightColor);
        this.programs["cube"].setUniform3f("objectColor",this.objectColor);
        this.programs["cube"].setUniform3f("viewPos",this.camera.position);

        
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['spaceship']);
        this.programs["cube"].setUniform1i('texture_sampler', 0);
        
        //this.meshes['spaceship'].draw(this.gl.TRIANGLES);
        this.myPlayer.draw(VP, this.programs["cube"]);
        this.myPlayer.incrementScore();

        for(var i: number = 0; i < this.asteroidData["batch-number"]; i++) {            
            for(var j: number = -1; j<= 1; j++) {
                    this.asteroidLevel[i][j+1].incrementSpeed();
                    this.asteroidLevel[i][j+1].updatePosition(this.myPlayer);
                    this.asteroidLevel[i] [j+1].draw(VP, this.programs["cube"]);
            }
        }
        
        this.drawSky(VP);
        this.myPlayer.update(VP, deltaTime);
        // enemies and area code


       // 
    }
    
    public drawSky(VP: mat4){

  // the sky drawing
  let M = mat4.clone(VP); 
  mat4.translate(M,M,vec3.fromValues(0,0,-2)) ;          
  mat4.rotateY(M, M, performance.now()/1000);       

      
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.textures[4]);

      this.gl.cullFace(this.gl.FRONT);
      this.gl.depthMask(false);

      this.programs['sky'].use();

      this.programs['sky'].setUniformMatrix4fv("VP", false, this.camera.ViewProjectionMatrix);
      this.programs['sky'].setUniform3f("cam_position", this.camera.position);

      let skyMat = mat4.create();
      mat4.translate(skyMat, skyMat, this.camera.position);
      
      this.programs['sky'].setUniformMatrix4fv("M", false, skyMat);

      this.programs['sky'].setUniform4f("tint", [1, 1, 1, 1]);
      this.programs['sky'].setUniformMatrix4fv("M_it", true, mat4.invert(mat4.create(), M));


      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.textures[4]);
      this.programs['sky'].setUniform1i('cube_texture_sampler', 0);
      this.gl.bindSampler(0, this.sampler);

      this.meshes['sky'].draw(this.gl.TRIANGLES);
      
      this.gl.cullFace(this.gl.BACK);
      this.gl.depthMask(true); 


    }
    public end(): void {
        for(let key in this.programs){
            this.programs[key].dispose;
        }
        this.programs = {}
        for (let key in this.meshes){
            this.meshes[key].dispose;
        }
        this.meshes ={};
        for(let texture of this.textures)
            this.gl.deleteTexture(texture);
        this.textures = [];
        this.gl.deleteSampler(this.sampler);
        this.clearControls();
    }


    /////////////////////////////////////////////////////////
    ////// ADD CONTROL TO THE WEBPAGE (NOT IMPORTNANT) //////
    /////////////////////////////////////////////////////////
    private setupControls() {
        
    }

    private clearControls() {
        const controls = document.querySelector('#controls');
        controls.innerHTML = "";
    }


}
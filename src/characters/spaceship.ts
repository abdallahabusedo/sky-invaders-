import { vec3, mat4, quat, glMatrix } from 'gl-matrix';
import mesh from '../common/mesh'
import myGameScene from '../scenes/myGameScene'
//This is the abstract base of all scenes
import * as MeshUtils from '../common/mesh-utils';
import ShaderProgram from '../common/shader-program';
import { Key } from 'ts-key-enum';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import * as gameUtils from '../common/gameUtils/gameUtils'
import { HealthBar, ScoreBar } from '../component'
import {Howl, Howler} from 'howler';


export abstract class spaceShip {
    pos:vec3; // this is the center position
    height:number;
    length:number;
    width:number;
    speed:number;
    shootPower:number;  // we have to rethink of this
    diretion: vec3;
    health: number = 100;

    shapeMesh: mesh;
    shapeTexture: WebGLTexture ;
    shapeGameScene: myGameScene;
    public constructor(pos: vec3, speed:number, width:number, height:number, length:number, shootPower:number, direction:vec3, health:number){
        this.pos = pos;
        this.speed = speed;
        this.shootPower = shootPower;
        this.diretion = direction;
        this.health = health;  
        this.width = width;
        this.height = height;
        this.length = length;      
    }
    public abstract draw(VP: mat4, program:ShaderProgram): void; // Here will draw the scene (deltaTime is the difference in time between this frame and the past frame in milliseconds)

}

export  class  player extends spaceShip {

    score:number = 0;
    data: any;
    public constructor(pos: vec3, speed:number, width:number, height:number, length:number, shootPower:number, direction:vec3, health:number, mygameScene:myGameScene, data:any){
        super(pos, speed, width, height, length, shootPower, direction, health) ;
        // prepare the object mesh
        this.shapeMesh = MeshUtils.LoadOBJMesh(mygameScene.gl, mygameScene.game.loader.resources["spaceship"]);
        this.shapeTexture = mygameScene.gl.createTexture();
        mygameScene.gl.activeTexture(mygameScene.gl.TEXTURE0);

        mygameScene.gl.bindTexture(mygameScene.gl.TEXTURE_2D, this.shapeTexture);
        mygameScene.gl.pixelStorei(mygameScene.gl.UNPACK_ALIGNMENT, 4);
        mygameScene.gl.texImage2D(mygameScene.gl.TEXTURE_2D, 0, mygameScene.gl.RGBA, mygameScene.gl.RGBA, mygameScene.gl.UNSIGNED_BYTE, mygameScene.game.loader.resources['spaceship-texture']);
        mygameScene.gl.generateMipmap(mygameScene.gl.TEXTURE_2D);
        this.shapeGameScene = mygameScene;
        this.data = data;
    }

    public draw(VP: mat4, program:ShaderProgram): void {
       
        program.use();
        let spaceshipMat = mat4.clone(VP); 
         mat4.scale(spaceshipMat, spaceshipMat,[0.5,0.5,0.5]);  
         mat4.translate(spaceshipMat, spaceshipMat, this.pos);

          program.setUniformMatrix4fv("MVP", false, spaceshipMat);
          program.setUniform4f("tint", [1, 1, 1, 1]);
          program.setUniform3f("lightpostion",[1,1,1]);
          
          this.shapeGameScene.gl.activeTexture(this.shapeGameScene.gl.TEXTURE0);
          this.shapeGameScene.gl.bindTexture(this.shapeGameScene.gl.TEXTURE_2D, this.shapeTexture);
          program.setUniform1i('texture_sampler', 0);
          
          this.shapeMesh.draw(this.shapeGameScene.gl.TRIANGLES);
    }
    public update (VP: mat4,deltaTime : number)
    {
      if(this.pos[0] > this.data["top-right-restrict"])
        if(this.shapeGameScene.game.input.isKeyDown(Key.ArrowRight)) vec3.scaleAndAdd(this.pos , this.pos, [-this.speed,0,0], 1);  
        
      if(this.pos[0] < this.data["top-left-restrict"])
        if(this.shapeGameScene.game.input.isKeyDown(Key.ArrowLeft)) vec3.scaleAndAdd(this.pos , this.pos, [this.speed,0,0], 1);
      
      if(this.pos[1] < this.data["bottom-left-restrict"])
        if(this.shapeGameScene.game.input.isKeyDown(Key.ArrowUp)) vec3.scaleAndAdd(this.pos , this.pos, [0,this.speed,0], 1);
      
      if(this.pos[1] > this.data["bottom-right-restrict"]) 
        if(this.shapeGameScene.game.input.isKeyDown(Key.ArrowDown)) vec3.scaleAndAdd(this.pos , this.pos, [0,-this.speed,0], 1);
    }
    public incrementScore(): void {
        this.score += 0.1;
        ScoreBar.update(this.score.toFixed(0));
        // document.querySelector(
        //     "div#text div#score span#score"
        // ).innerHTML = this.score.toFixed(0);
    }

    public  decrementHealth(): void {
        this.health-= 5;
        if (this.health === 0) {
            // TODO: Handle endgame
            for(let i = 0 ; i < 10000000; i++ )
            {
                vec3.scaleAndAdd(this.pos , this.pos, [0,-0.01 ,0], 1)  ;   
                   }
        }
        HealthBar.move(this.health);
    }

}
// export class enemy extends spaceShip{
        
    //     public constructor(pos: vec3, speed:number, width:number, height:number, length:number, shootPower:number, direction:vec3, health:number, mygameScene:myGameScene){
    //         super(pos, speed, width, height, length, shootPower, direction, health) ;
    //         // prepare the object mesh
    //         this.shapeMesh = MeshUtils.LoadOBJMesh(mygameScene.gl, mygameScene.game.loader.resources["enemy"]);
    //         this.shapeTexture = mygameScene.gl.createTexture();
    //         mygameScene.gl.activeTexture(mygameScene.gl.TEXTURE0);
    //         mygameScene.gl.bindTexture(mygameScene.gl.TEXTURE_2D, this.shapeTexture);
    //         mygameScene.gl.pixelStorei(mygameScene.gl.UNPACK_ALIGNMENT, 4);
    //         mygameScene.gl.texImage2D(mygameScene.gl.TEXTURE_2D, 0, mygameScene.gl.RGBA, mygameScene.gl.RGBA, mygameScene.gl.UNSIGNED_BYTE, mygameScene.game.loader.resources['asteroid_text']);
    //         mygameScene.gl.generateMipmap(mygameScene.gl.TEXTURE_2D);
    //         this.shapeGameScene = mygameScene;
    //     }

    //     public draw(VP: mat4, program:ShaderProgram): void {
    //         program.use();
    //         let asteroidmat = mat4.clone(VP);       
    //         mat4.translate(asteroidmat, asteroidmat, this.pos);
    //           mat4.rotateY(asteroidmat, asteroidmat, Math.PI);

    //           program.setUniformMatrix4fv("MVP", false, asteroidmat);
    //           program.setUniform4f("tint", [1, 1, 1, 1]);

    //           this.shapeGameScene.gl.activeTexture(this.shapeGameScene.gl.TEXTURE0);
    //           this.shapeGameScene.gl.bindTexture(this.shapeGameScene.gl.TEXTURE_2D, this.shapeTexture);
    //           program.setUniform1i('texture_sampler', 0);
            
    //           this.shapeMesh.draw(this.shapeGameScene.gl.TRIANGLES);
    //     }
        

    // } 
    // 
export class asteroid {
    pos:vec3; // this is the center position
    height:number;
    length:number;
    width:number;
    speed:number;
    shootPower:number;  // we have to rethink of this
    diretion: vec3;
    health: number;
  
    shapeMesh: mesh;
    shapeTexture: WebGLTexture ;
    shapeGameScene: myGameScene;
    data: any;
  
    public constructor(pos: vec3, speed:number, width:number, height:number, length:number, shootPower:number, direction:vec3, health:number, mygameScene:myGameScene, data:any){
        this.pos = pos;
        this.speed = speed;
        this.shootPower = shootPower;
        this.diretion = direction;
        this.health = health;  
        this.width = width;
        this.height = height;
        this.length = length;      
        // prepare the object mesh
        this.shapeMesh = MeshUtils.LoadOBJMesh(mygameScene.gl, mygameScene.game.loader.resources["asteroid"]);
        this.shapeTexture = mygameScene.gl.createTexture();
        mygameScene.gl.activeTexture(mygameScene.gl.TEXTURE0);
        mygameScene.gl.bindTexture(mygameScene.gl.TEXTURE_2D, this.shapeTexture);
        mygameScene.gl.pixelStorei(mygameScene.gl.UNPACK_ALIGNMENT, 4);
        mygameScene.gl.texImage2D(mygameScene.gl.TEXTURE_2D, 0, mygameScene.gl.RGBA, mygameScene.gl.RGBA, mygameScene.gl.UNSIGNED_BYTE, mygameScene.game.loader.resources['asteroid-texture']);
        mygameScene.gl.generateMipmap(mygameScene.gl.TEXTURE_2D);
        this.shapeGameScene = mygameScene;
        this.data = data;
    }
  
    public draw(VP: mat4, program:ShaderProgram): void {
        program.use();
        let spaceshipMat = mat4.clone(VP);       
        mat4.translate(spaceshipMat, spaceshipMat, this.pos);
         
       mat4.rotateY(spaceshipMat, spaceshipMat,20);         

          mat4.rotateY(spaceshipMat, spaceshipMat, Math.PI);
          program.setUniformMatrix4fv("MVP", false, spaceshipMat);
          program.setUniform4f("tint", [1, 1, 1, 1]);
  
          this.shapeGameScene.gl.activeTexture(this.shapeGameScene.gl.TEXTURE0);
          this.shapeGameScene.gl.bindTexture(this.shapeGameScene.gl.TEXTURE_2D, this.shapeTexture);
          program.setUniform1i('texture_sampler', 0);
          
          this.shapeMesh.draw(this.shapeGameScene.gl.TRIANGLES);
    }
  
    public incrementSpeed():void {
        this.speed += this.data["speed-increment"];
    }
    public  updatePosition(gamePlayer: player):void{
        let playerPos = gamePlayer.pos;
        this.pos[2] -= this.speed;
        if (this.pos[2] < this.data["final-z"]) {
            let randNum = gameUtils.getRndInteger(-1, 1);
            this.pos[2] = this.data["start-z"];
            this.pos[1] = this.data["y-distance"] * randNum;
        } else if (vec3.dist(playerPos, this.pos) <= this.data["collision-accuracy"]) {
            console.log("colloided");
            let randNum = gameUtils.getRndInteger(-1, 1);
            this.pos[2] = this.data["start-z"];
            this.pos[1] = this.data["y-distance"] * randNum;
            gamePlayer.decrementHealth();
        }
    }
}
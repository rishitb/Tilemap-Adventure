
var TileSize = 32;
var PlayerSpeed = 4.0; //tiles per second
var Tilemap = require('sald:Tilemap.js');

var sprite = require('sald:Sprite.js'); 

var heroImg = require('../img/HeroSpriteh.png');
var heroSprite = new sprite(heroImg, { 'walk' : { x:0,y:0, width:20,height:20, size:3 }});
heroSprite.animators['walk'].loop(true);
heroSprite.animators['walk'].speed(20);

var col = require('sald:collide.js');
//var heroImgs = [
//	require("../img/hero1.png"),
//	require("../img/hero2.png"),
//	require("../img/hero3.png")
//];

//var tilesImg = require("../img/ground.png");
var myTilesImg=require("../img/tileset.png");

var mymap=[
[8,8,8,8,8,8,8,8,8,8,8],
[8,10,10,10,10,8,10,10,10,10,8],
[8,10,10,10,10,8,10,10,10,10,8],
[8,10,10,10,10,8,10,10,10,10,8],
[8,10,10,10,10,8,10,10,10,10,8],
[8,8,8,8,8,23,8,8,8,8,8],
[8,10,10,10,10,8,10,10,10,10,8],
[8,10,10,10,10,8,10,10,10,10,8],
[8,10,10,10,10,8,10,10,10,10,8],
[8,10,10,10,10,8,10,10,10,10,8],
[8,8,8,8,8,8,8,8,8,8,8]
];

//tmap=new Tilemap(tilesImg, map, 20, 20, 3, 3, map[0].length, map.length, 4);
tmap=new Tilemap(myTilesImg,mymap,32,32,8,8,10);

//camera position (in tiles):
var camera = {
	x: 5.5,
	y: 5.5
};

//player position (in tiles):
var player = {
	x: 5.5,
	y: 5.5,
	frameAcc: 0.0,
	frame: 0,
};

function draw() {
	var ctx = window.sald.ctx;
	//First, clear the screen:
	ctx.setTransform(ctx.factor,0, 0,ctx.factor, 0,0);
	ctx.fillStyle = "#f0f"; //bright pink, since this *should* be drawn over

	ctx.fillRect(0, 0, 320, 240); //<--- hardcoded size. bad style!

	//don't interpolate scaled images. Let's see those crisp pixels:
	ctx.imageSmoothingEnabled = false;

	//Now transform into camera space:
	//  (units are tiles, +x is right, +y is up, camera is at the center:
	ctx.setTransform(
		//x direction:
			ctx.factor * TileSize, 0,
		//y direction (sign is negative to make +y up):
			0,-ctx.factor * TileSize,
		//offset (in pixels):
			ctx.factor * (320 / 2 - Math.round(camera.x * TileSize)),
			ctx.factor * (240 / 2 + Math.round(camera.y * TileSize)) //<-- y is added here because of sign flip
		);
	
	//draw tilemap
	tmap.draw(camera);
	
	//draw player
	heroSprite.draw('walk', player.x,player.y,0,1,1,0.5,0.5);
	
	//draw houses
	(function draw_houses(){
		var house=require("../img/house.png");
		ctx.save();
		ctx.transform(1,0, 0,-1,0,0);
		ctx.drawImage(house,0,0,house.width,house.height,0,-12,1,1);
		ctx.drawImage(house,0,0,house.width,house.height,10,-12,1,1);
		ctx.restore();
	})();

	var house1Rect={
				min:{x: 0, y: 12},
				max:{x: 1, y: 13}
				};
	
	var house2Rect={
				min:{x: 10, y: 12},
				max:{x: 11, y: 13}
				};		
			
	var playerRect={
		min:{x:player.x,y:player.y},
		max:{x:player.x+(0.5),y:player.y+(0.5)}
	};
					
	if (col.rectangleRectangle(house1Rect, playerRect)) {	//Check player collision with house1
				ctx.strokeStyle = '#fff';
				//console.log("Collided");
				player.x=house2Rect.max.x;					//Reset player position to the second house
				player.y=house2Rect.max.y;
			}
			ctx.stroke();
			
	if (col.rectangleRectangle(house2Rect, playerRect)) {	//Check player collision with house2
				ctx.strokeStyle = '#fff';
				//console.log("Collided");
				player.x=house1Rect.max.x;					//Reset player position to the first house
				player.y=house1Rect.max.y;
			}
			ctx.stroke();
			
			
	//rounded corners:
	ctx.setTransform(ctx.factor,0, 0,ctx.factor, 0,0);
	ctx.fillStyle = "#452267"; //background color of page
	ctx.fillRect(0,0, 1,2);
	ctx.fillRect(1,0, 1,1);

	ctx.fillRect(0,238, 1,2);
	ctx.fillRect(1,239, 1,1);

	ctx.fillRect(319,0, 1,2);
	ctx.fillRect(318,0, 1,1);

	ctx.fillRect(319,238, 1,2);
	ctx.fillRect(318,239, 1,1);
	

}

function update(elapsed) {
	var command = {
		x:0.0,
		y:0.0
	};
	
	var keys=window.sald.keys;
	//Movement
	if (keys['LEFT']) command.x -= 1.0;
	if (keys['RIGHT']) command.x += 1.0;
	if (keys['DOWN']) command.y -= 1.0;
	if (keys['UP']) command.y += 1.0;
	
	if (command.x != 0.0 || command.y != 0.0) {
		
		var len = Math.sqrt(command.x * command.x + command.y * command.y);
		command.x /= len;
		command.y /= len;

		player.x += command.x * PlayerSpeed * elapsed;
		player.y += command.y * PlayerSpeed * elapsed;

		//alternate player frames 1 and 2 if walking:
		player.frameAcc = (player.frameAcc + (elapsed * PlayerSpeed) / 0.3) % 2; 
		player.frame = 1 + Math.floor(player.frameAcc);
	} else {
		//player is stopped:
		player.frame = 0;
		heroSprite.animators['walk'].stop();
	}

	//pan camera if player is within 3 tiles of the edge:
	camera.x = Math.max(camera.x, player.x - (320 / TileSize / 2 - 3));
	camera.x = Math.min(camera.x, player.x + (320 / TileSize / 2 - 3));
	camera.y = Math.max(camera.y, player.y - (240 / TileSize / 2 - 3));
	camera.y = Math.min(camera.y, player.y + (240 / TileSize / 2 - 3));
	
}

function key(key, state) {
	//don't do anything
}


module.exports = {
	draw:draw,
	update:update,
	key:key
};

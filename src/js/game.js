"use strict";

var level = 0; // -1 = lost, 0 = title screen, 1 = level 1, last = won
var nlevel = 8; 
var lastlevel = -2;
var gamephase = 0; // 0 = normal game, 1 = destroyed and waiting phase, 2 = waiting phase during start
var secondsUntilStart = 0;
var ships = 5;
var collisioncounts = 0; // number of collision pixels
var fps = 0;
var frames = 0;
var score = 0;

var t0 = Date.now();

var game = {};
var color = null;
var boundary = null;
var maps = null;

var ukey = 0.;
var rkey = 0.;
var dkey = 0.;
var lkey = 0.;

// contains all graphics relevant data
var graphics = {}

function InitGraphics(N, M)
{
    graphics.N = N|0;
    graphics.M = M|0;

    graphics.info = document.getElementById("info");
    graphics.shipsleft = document.getElementById("shipsleft");

    graphics.fuelbar = document.getElementById("fuelbar");
    graphics.fuel = document.getElementById("fuel");

    graphics.velocitybar = document.getElementById("velocitybar");
    graphics.velocity = document.getElementById("velocity");
    
    graphics.svg = document.getElementById("svg");
    graphics.timerText = document.getElementById("timertext");
    graphics.levelText = document.getElementById("leveltext");

    graphics.fluidcanvas = document.getElementById("fluidcanvas");
    graphics.fluidcanvas.width = N;
    graphics.fluidcanvas.height = M;
    graphics.fluidctx = graphics.fluidcanvas.getContext("2d");
    graphics.imagedata = graphics.fluidctx.createImageData(N, M);

    graphics.overlaycanvas = document.getElementById("overlaycanvas");
    graphics.overlayctx = graphics.overlaycanvas.getContext("2d");

    graphics.boundarycanvas = document.createElement('canvas');
    graphics.boundarycanvas.width = N*4;
    graphics.boundarycanvas.height = M*4;
    graphics.boundaryctx = graphics.boundarycanvas.getContext("2d");

    graphics.collisioncanvas = document.createElement('canvas');
    graphics.collisioncanvas.width = N*4;
    graphics.collisioncanvas.height = M*4;
    graphics.collisionctx = graphics.collisioncanvas.getContext("2d");

    graphics.shipcanvas = document.createElement('canvas');
    graphics.shipcanvas.width = 36;
    graphics.shipcanvas.height = 40;
    graphics.shipctx = graphics.shipcanvas.getContext("2d");

    DrawShip(graphics.shipctx, 18, 16);
}

function RoundRect (c, x, y, w, h, r)
{
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    c.beginPath();
    c.moveTo(x+r, y);
    c.arcTo(x+w, y,   x+w, y+h, r);
    c.arcTo(x+w, y+h, x,   y+h, r);
    c.arcTo(x,   y+h, x,   y,   r);
    c.arcTo(x,   y,   x+w, y,   r);
    c.fill();
}

function DrawShip(c, x, y)
{
    c.fillStyle = "#E8EDEEFF";
    RoundRect(c, x-12, y-12, 24, 20, 5);
    
    c.fillStyle = "#B0B6BBFF";
    c.fillRect(x-6, y-15, 12, 3);
    c.fillRect(x-6, y+8, 12, 3);
    
    c.fillStyle = "#232C4DFF";    
    c.fillRect(x-6, y+12, 12, 6);

    c.lineWidth=2;
    c.strokeStyle="#B0B6BBFF";
    c.beginPath();
    c.arc(x,y-2, 5, 0, 2*Math.PI);
    c.stroke();

    c.lineWidth=1.5;
    c.strokeStyle="#232C4DFF";
    c.beginPath();
    
    //---
    c.moveTo(x+5, y+12);
    c.lineTo(x+15, y+17);
    
    c.moveTo(x-5, y+12);
    c.lineTo(x-15, y+17);

    // ---
    c.moveTo(x+5, y+18);
    c.lineTo(x+15, y+17);
    
    c.moveTo(x-5, y+18);
    c.lineTo(x-15, y+17);

    // ---
    c.moveTo(x+5, y+18);
    c.lineTo(x+16, y+23);
    
    c.moveTo(x-5, y+18);
    c.lineTo(x-16, y+23);

    // ---
    c.moveTo(x+15, y+17);
    c.lineTo(x+17, y+23);
    
    c.moveTo(x-15, y+17);
    c.lineTo(x-17, y+23);

    ///---
    c.moveTo(x+17-3, y+23);
    c.lineTo(x+17+3, y+23);
    
    c.moveTo(x-17-3, y+23);
    c.lineTo(x-17+3, y+23);

    c.stroke();
}

// Update the velocity bar and fuel bar
function UpdateSVGOverlay(c)
{
    let t = game._GetTime();
    /*
    info.innerHTML = 
        "time: " + Math.floor(t * 10) / 10 + 
        "<br/>ships: " + ships + 
        "<br/>fuel: " + Math.floor(game._GetFuel()) +
        "<br/>fps: " + Math.floor(fps * 10) / 10;
    */
   graphics.info.innerHTML = "" + (Math.floor(fps * 10) / 10) + " fps";

    if (level <= 0 || level > nlevel) 
    {
        graphics.velocitybar.style.display = "none";
        graphics.fuelbar.style.display = "none";
        graphics.shipsleft.innerHTML = "";
        return;
    }
    graphics.shipsleft.innerHTML = "" + ships + " ships";

    let fuel = game._GetFuel();
    graphics.fuelbar.style.display = "block";
    graphics.fuel.setAttribute('y', 70-fuel/1000. * 70 + 20.);
    graphics.fuel.setAttribute('height', fuel/1000.*70.);


    let vy = game._ShipGetVY();
    if (vy > 10) vy = 10;
    if (vy < -10) vy = -10;

    graphics.velocitybar.style.display = "block";
    graphics.velocity.setAttribute('y1', 60+vy*5.);
    graphics.velocity.setAttribute('y2', 60+vy*5.);
}

function CollisionDetection()
{
    let c = graphics.overlayctx;
    c.clearRect(0, 0, graphics.N * 4, graphics.M * 4);
    c.drawImage(graphics.collisioncanvas, 0, 0);
    c.drawImage(graphics.shipcanvas, game._ShipGetX()*4.-18, game._ShipGetY()*4.-20);

    let newcollisioncounts = CountCollisionPixels(c);

    if (Math.abs(newcollisioncounts.boundary - collisioncounts.boundary) > 10)
    {
        audio.ThrustOff();
        game._Destroyed();
        return;
    }

    if (Math.abs(newcollisioncounts.landingpad - collisioncounts.landingpad) > 10)
    {
        audio.ThrustOff();
        if (game._ShipGetVY() > 2) 
        {
            game._Destroyed();
        }
        else
        {
            level++;
            ships++;
            score += game._GetFuel();
            SetLevel();
        }
    }
}

function Draw()
{
    let t1 = Date.now();

    if (t1 - t0 > 2000)
    {
        fps = frames / (t1 - t0) * 1e3; 
        t0 = t1;
        frames = 0;
    }


    for(let i=0; i<graphics.N*graphics.M*4; i++)
        graphics.imagedata.data[i] = color[i];
    
    graphics.fluidctx.putImageData(graphics.imagedata, 0, 0);

    let c = graphics.overlayctx;
    c.clearRect(0, 0, graphics.N*4, graphics.M*4);
    c.drawImage(graphics.boundarycanvas, 0, 0);

    if (!game._IsExploded())
    {
        c.drawImage(graphics.shipcanvas, game._ShipGetX()*4.-18, game._ShipGetY()*4.-20);
    }

    UpdateSVGOverlay(c);
}

function CountCollisionPixels(c)
{
    let boundarycount = 0;
    let landingpadcount = 0;
    let data = c.getImageData(0, 0, 1024, 512).data;
    for (let i = 0; i < data.length; i += 4)
    {
        if (data[i+3] != 0xFF) continue; // alpha
        landingpadcount += (data[i+1] == 0xFF)?1:0; // gree color
        boundarycount += (data[i+0] == 0xFF)?1:0; // red color
    }
    return {boundary: boundarycount, landingpad: landingpadcount}
};

function Loop()
{    
    if (gamephase == 0)
    {
        game._SetKeys(ukey, dkey, rkey, lkey);
        game._IsThrustOn()?audio.ThrustOn():audio.ThrustOff();
    }
    game._Step(Date.now(), gamephase==0);

    frames++;
    window.requestAnimationFrame(Draw);

    if (gamephase == 2)
    {
        window.setTimeout(Loop, 0);
        return;
    }

    if (!game._IsExploded())
    {
        CollisionDetection();
    }

    if (game._IsExploded() && gamephase==0)
    {
        gamephase = 1;
        window.localStorage.dateOfLastAccident = Date.now();
        audio.Explosion();
        audio.ThrustOff();
        ships--;
        if (ships == 0)
            window.setTimeout(() => 
            {
                gamephase = 0;
                level = -1;
                SetLevel();                
            }, 5000);
        else
        window.setTimeout(() => 
        {
            gamephase = 0;
            SetLevel();
        }, 5000);
    }

   window.setTimeout(Loop, 0);
}

function SetLevel()
{
    ResetLevel(level);

    let c = graphics.boundaryctx;
    DrawLevel(c, level);    
    SetBoundary(c);

    gamephase = 0;
    if ((level > 0) && (level <= nlevel))
    {
        gamephase = 2; // waitingphase before start
        
        audio.Beep();
        graphics.levelText.innerHTML = "Level " + level + " / " + nlevel;
        graphics.timerText.innerHTML = 3;
        window.setTimeout(() => 
        {
            audio.Beep();
            graphics.timerText.innerHTML = 2;
            window.setTimeout(() => 
            {
                audio.Beep();
                graphics.timerText.innerHTML = 1;
                window.setTimeout(() => 
                {
                    graphics.timerText.innerHTML = "";
                    graphics.levelText.innerHTML = "";
                    gamephase = 0;
                }, 1000);
            }, 1000);
        }, 1000);
    }
}

function SetBoundary(c)
{
    let data = c.getImageData(0, 0, 1024, 512).data;

    let collisionctx = graphics.collisionctx;
    let collisionimage = collisionctx.createImageData(1024, 512);
    let offset = 0;

    for(let j = 0; j < graphics.M+2; j++)
    for(let i = 0; i < graphics.N+2; i++)
    {
        let isBoundary = data[(j*4096+i*4)*4+3] == 255; // alpha
        boundary[offset++] = isBoundary?1:0;
    }

    for (let i = 0; i < collisionimage.data.length; i += 4)
    {
        if (data[i+3] != 0xFF) continue; // alpha
        collisionimage.data[i+3] = 0xFF;
        
        if ((data[i+0] == 0xFF) && (data[i+1] == 0xFF) && (data[i+2] == 0xFF)) // white is landing pad
        {
            collisionimage.data[i+1] = 0xFF;
        } else
        {
            collisionimage.data[i+0] = 0xFF; // red
        }        
    }
    collisionctx.putImageData(collisionimage, 0, 0);
    collisioncounts = CountCollisionPixels(collisionctx);
    game._FixCells();
}

function Resize()
{
    let scale = {x: 1, y: 1};
        scale.x = (window.innerWidth) / graphics.fluidcanvas.width;
        scale.y = (window.innerHeight) / graphics.fluidcanvas.height;

    if (scale.x > scale.y)
    {
        graphics.fluidcanvas.setAttribute('style', 'width: auto; height: '+(window.innerHeight)+'px;');
        graphics.overlaycanvas.setAttribute('style', 'width: auto; height: '+(window.innerHeight)+'px;');
        graphics.svg.setAttribute('style', 'width: auto; height: '+(window.innerHeight)+'px;');
        
    } else
    {
        graphics.fluidcanvas.setAttribute('style', 'width: '+(window.innerWidth)+'px; height: auto;');
        graphics.overlaycanvas.setAttribute('style', 'width: '+(window.innerWidth)+'px; height: auto;');
        graphics.svg.setAttribute('style', 'width: '+(window.innerWidth)+'px; height: auto;');
    }
}

// --------------------------------------

function Main()
{
    let importOb = {
        env: {
            memory : new WebAssembly.Memory({initial:256, maximum:256}),
            table : new WebAssembly.Table({initial:2, maximum: 2, element:"anyfunc"}),
            tableBase : 0,
            STACKTOP : 2048,
            abort : function(err) { alert("abort " + err) }
        }
    };

    fetch('game.wasm').then(response =>
        response.arrayBuffer()
    ).then(bytes =>
        WebAssembly.instantiate(bytes, importOb)
    ).then(
        obj => {
            game = obj.instance.exports;
            game._Init();
            color = new Uint8Array(importOb.env.memory.buffer, game._GetColorOffset());
            boundary = new Uint32Array(importOb.env.memory.buffer, game._GetBoundaryOffset());
            maps = new Uint8Array(importOb.env.memory.buffer, game._GetMapsOffset());
            SetLevel();
            Loop();
        },
        err => alert(err)
    );
   
    audio.Wind();
    InitGraphics(256, 128);
    Resize();
    onresize = () => Resize();

    var onkey = (event, v, l, i) =>
    {
       if (v && event.keyCode==32)
       {
           audio.EnableDisable();
           return;
       }

        if (v && level <= 0)
        {
            level++;
            SetLevel();
        }
        for(i in l=
            {
                ukey: [38, 90, 87],
                rkey: [39, 68],
                dkey: [40, 83],
                lkey: [37, 65, 81]
            })
            if (l[i].includes(event.keyCode)) top[i] = v;
    }
    onkeydown = (event) => onkey(event, 1);
    onkeyup = (event) => onkey(event, 0);

}


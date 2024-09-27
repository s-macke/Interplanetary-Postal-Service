"use strict";

let level = 0 | 0; // -1 = lost, 0 = title screen, 1 = level 1, last = won
let nlevel = 8;
let lastlevel = -2;
let gamephase = 0; // 0 = normal game, 1 = destroyed and waiting phase, 2 = waiting phase during start
let ships = 5;
let fps = 0;
let frames = 0;
let score = 0;

let t0 = Date.now();

let game = {};
let color = null;
let boundary = null;
let maps = null;

let ukey = 0.;
let rkey = 0.;
let dkey = 0.;
let lkey = 0.;

// contains all graphics relevant data
let graphics = {}

function InitGraphics(N, M) {
    graphics.N = N | 0;
    graphics.M = M | 0;

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
    graphics.fluidctx = graphics.fluidcanvas.getContext("2d", {alpha: true});
    graphics.imagedata = graphics.fluidctx.createImageData(N, M);

    graphics.overlaycanvas = document.getElementById("overlaycanvas");
    graphics.overlayctx = graphics.overlaycanvas.getContext("2d", {alpha: true, willReadFrequently: true});

    graphics.boundarycanvas = document.createElement('canvas');
    graphics.boundarycanvas.width = N * 4;
    graphics.boundarycanvas.height = M * 4;
    graphics.boundaryctx = graphics.boundarycanvas.getContext("2d", {alpha: true, willReadFrequently: true});

    graphics.collisioncanvas = document.createElement('canvas');
    graphics.collisioncanvas.width = N * 4;
    graphics.collisioncanvas.height = M * 4;
    graphics.collisionctx = graphics.collisioncanvas.getContext("2d", {alpha: true, willReadFrequently: true});

    graphics.shipcanvas = document.createElement('canvas');
    graphics.shipcanvas.width = 36;
    graphics.shipcanvas.height = 40;
    graphics.shipctx = graphics.shipcanvas.getContext("2d", {alpha: true});

    DrawShip(graphics.shipctx, 18, 16);
}

function RoundRect(c, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.fill();
}

function DrawShip(c, x, y) {
    c.clearRect(0, 0, 36+1, 40+1);

    c.fillStyle = "#E8EDEEFD";
    c.strokeStyle = "#E8EDEEFD";
    RoundRect(c, x - 12, y - 12, 24, 20, 5);

    c.fillStyle = "#B0B6BBFD";
    c.fillRect(x - 6, y - 15, 12, 3);
    c.fillRect(x - 6, y + 8, 12, 3);

    c.fillStyle = "#232C4DFD";
    c.fillRect(x - 6, y + 12, 12, 6);

    c.lineWidth = 2;
    c.strokeStyle = "#B0B6BBFD";
    c.beginPath();
    c.arc(x, y - 2, 5, 0, 2 * Math.PI);
    c.stroke();

    c.lineWidth = 1.5;
    c.strokeStyle = "#232C4DFD";
    c.beginPath();

    //---
    c.moveTo(x + 5, y + 12);
    c.lineTo(x + 15, y + 17);

    c.moveTo(x - 5, y + 12);
    c.lineTo(x - 15, y + 17);

    // ---
    c.moveTo(x + 5, y + 18);
    c.lineTo(x + 15, y + 17);

    c.moveTo(x - 5, y + 18);
    c.lineTo(x - 15, y + 17);

    // ---
    c.moveTo(x + 5, y + 18);
    c.lineTo(x + 16, y + 23);

    c.moveTo(x - 5, y + 18);
    c.lineTo(x - 16, y + 23);

    // ---
    c.moveTo(x + 15, y + 17);
    c.lineTo(x + 17, y + 23);

    c.moveTo(x - 15, y + 17);
    c.lineTo(x - 17, y + 23);

    ///---
    c.moveTo(x + 17 - 3, y + 23);
    c.lineTo(x + 17 + 3, y + 23);

    c.moveTo(x - 17 - 3, y + 23);
    c.lineTo(x - 17 + 3, y + 23);

    c.stroke();
/*
    let data = c.getImageData(0, 0, 36, 40).data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0x00) {
            data[i + 3] = 0xFF
        }
    }
 */
}

// Update the velocity bar and fuel bar
function UpdateSVGOverlay(c) {
    graphics.info.innerHTML = "" + (Math.floor(fps * 10) / 10) + " fps";

    if (level <= 0 || level > nlevel) {
        graphics.velocitybar.style.display = "none";
        graphics.fuelbar.style.display = "none";
        graphics.shipsleft.innerHTML = "";
        return;
    }
    graphics.shipsleft.innerHTML = "" + ships + " ships";

    let fuel = game._GetFuel();
    graphics.fuelbar.style.display = "block";
    graphics.fuel.setAttribute('y', 70 - fuel / 1000. * 70 + 20.);
    graphics.fuel.setAttribute('height', fuel / 1000. * 70.);

    let vy = game._ShipGetVY();
    if (vy > 10) vy = 10;
    if (vy < -10) vy = -10;

    graphics.velocitybar.style.display = "block";
    graphics.velocity.setAttribute('y1', 60 + vy * 5.);
    graphics.velocity.setAttribute('y2', 60 + vy * 5.);
}

function CollisionDetection() {
    let data = graphics.collisionctx.getImageData(0, 0, 1024, 512).data;
    let data2 = graphics.shipctx.getImageData(0, 0, 36, 40).data;
    let boundarycollision = 0;
    let landingpadcollision = 0;
    let xship = Math.floor(game._ShipGetX() * 4 - 18);
    let yship = Math.floor(game._ShipGetY() * 4. - 20)
    for (let y=0; y<40; y++) {
        for (let x = 0; x < 36; x++) {
            let i = ((y * 36 + x) * 4)|0;
            if (data2[i + 3] === 0) continue;
            let xscr = x + xship;
            let yscr = y + yship;
            if (xscr < 0 || xscr >= 1024 || yscr < 0 || yscr >= 512) continue;
            let j = (((yscr) * 1024 + xscr) * 4)|0;
            if (data[j + 3] !== 0xFF) continue;
            landingpadcollision += (data[j + 1] === 0xFF) ? 1 : 0;
            boundarycollision += (data[j + 0] === 0xFF) ? 1 : 0;
        }
    }

    if (boundarycollision > 10) {
        audio.ThrustOff();
        game._Destroyed();
        return;
    }

    if (landingpadcollision > 10) {
        audio.ThrustOff();
        if (game._ShipGetVY() > 2) {
            game._Destroyed();
        } else {
            level++;
            ships++;
            score += game._GetFuel();
            SetLevel();
        }
    }
}

function Draw() {
    let t1 = Date.now();

    if (t1 - t0 > 2000) {
        fps = frames / (t1 - t0) * 1e3;
        t0 = t1;
        frames = 0;
    }

    // copy from webassembly memory to canvas
    for (let i = 0; i < graphics.N * graphics.M * 4; i++)
        graphics.imagedata.data[i] = color[i];

    graphics.fluidctx.putImageData(graphics.imagedata, 0, 0);

    let c = graphics.overlayctx;
    c.clearRect(0, 0, graphics.N * 4, graphics.M * 4);
    c.drawImage(graphics.boundarycanvas, 0, 0);

    if (!game._IsExploded()) {
        c.drawImage(graphics.shipcanvas, game._ShipGetX() * 4. - 18, game._ShipGetY() * 4. - 20);
    }
    UpdateSVGOverlay(c);
}

function Loop() {
    if (gamephase === 0) {
        game._SetKeys(ukey, dkey, rkey, lkey);
        game._IsThrustOn() ? audio.ThrustOn() : audio.ThrustOff();
    }
    game._Step(Date.now(), gamephase === 0);

    frames++;
    window.requestAnimationFrame(Draw);

    if (gamephase === 2) {
        window.setTimeout(Loop, 0);
        return;
    }

    if (!game._IsExploded()) {
        CollisionDetection();
    }

    if (game._IsExploded() && gamephase === 0) {
        gamephase = 1;
        window.localStorage.dateOfLastAccident = Date.now();
        audio.Explosion();
        audio.ThrustOff();
        ships--;
        if (ships === 0)
            window.setTimeout(() => {
                gamephase = 0;
                level = -1;
                SetLevel();
            }, 5000);
        else
            window.setTimeout(() => {
                gamephase = 0;
                SetLevel();
            }, 5000);
    }

    window.setTimeout(Loop, 0);
}

function SetLevel() {
    ResetLevel(level);

    let c = graphics.boundaryctx;
    DrawLevel(c, level);

    SetBoundary(c);

    gamephase = 0;
    if ((level > 0) && (level <= nlevel)) {
        gamephase = 2; // waitingphase before start

        audio.Beep();
        graphics.levelText.innerHTML = "Level " + level + " / " + nlevel;
        graphics.timerText.innerHTML = "3";
        window.setTimeout(() => {
            audio.Beep();
            graphics.timerText.innerHTML = "2";
            window.setTimeout(() => {
                audio.Beep();
                graphics.timerText.innerHTML = "1";
                window.setTimeout(() => {
                    graphics.timerText.innerHTML = "";
                    graphics.levelText.innerHTML = "";
                    gamephase = 0;
                }, 1000);
            }, 1000);
        }, 1000);
    }
}

function SetBoundary(c) {
    let data = c.getImageData(0, 0, 1024, 512).data;

    let collisionctx = graphics.collisionctx;
    let collisionimage = collisionctx.createImageData(1024, 512);
    let offset = 0;

    for (let j = 0; j < graphics.M + 2; j++)
        for (let i = 0; i < graphics.N + 2; i++) {
            let isBoundary = data[(j * 4096 + i * 4) * 4 + 3] >= 254; // alpha
            boundary[offset++] = isBoundary ? 1 : 0;
        }

    for (let i = 0; i < collisionimage.data.length; i += 4) {
        if (data[i + 3] !== 0xFF) continue; // alpha
        collisionimage.data[i + 3] = 0xFF; // set alpha in case you want to show the image

        if ((data[i + 0] === 0xFF) && (data[i + 1] === 0xFF) && (data[i + 2] === 0xFF)) // white is landing pad
        {
            collisionimage.data[i + 1] = 0xFF;
        } else {
            collisionimage.data[i + 0] = 0xFF; // red
        }
    }
    collisionctx.putImageData(collisionimage, 0, 0);
    game._FixCells();
}

function Resize() {
    let scale = {x: 1, y: 1};
    scale.x = (window.innerWidth) / graphics.fluidcanvas.width;
    scale.y = (window.innerHeight) / graphics.fluidcanvas.height;

    if (scale.x > scale.y) {
        graphics.fluidcanvas.setAttribute('style', 'width: auto; height: ' + (window.innerHeight) + 'px;');
        graphics.overlaycanvas.setAttribute('style', 'width: auto; height: ' + (window.innerHeight) + 'px;');
        graphics.svg.setAttribute('style', 'width: auto; height: ' + (window.innerHeight) + 'px;');
    } else {
        graphics.fluidcanvas.setAttribute('style', 'width: ' + (window.innerWidth) + 'px; height: auto;');
        graphics.overlaycanvas.setAttribute('style', 'width: ' + (window.innerWidth) + 'px; height: auto;');
        graphics.svg.setAttribute('style', 'width: ' + (window.innerWidth) + 'px; height: auto;');
    }
}

// --------------------------------------

function onkey(event, v) {
    console.log("'", event.code, "'", event.key, "'")
    if (v && event.code === "Space") {
        audio.EnableDisable();
        return;
    }

    if (v && level <= 0) {
        level++;
        SetLevel();
    }

    if (event.code === "KeyW" || event.code === "ArrowUp") {
        ukey = v;
    }
    if (event.code === "KeyS" || event.code === "ArrowDown") {
        dkey = v;
    }
    if (event.code === "KeyA" || event.code === "ArrowLeft") {
        lkey = v;
    }
    if (event.code === "KeyD" || event.code === "ArrowRight") {
        rkey = v;
    }

}


function Main() {
    InitGraphics(256, 128);
    Resize();
    window.addEventListener('resize', () => Resize());

    let importOb = {
        env: {
            memory: new WebAssembly.Memory({initial: 256, maximum: 256}),
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

            audio.Wind();
            document.addEventListener('keydown', event => onkey(event, 1));
            document.addEventListener('keyup', event => onkey(event, 0));

            level = 0;
            SetLevel();
            Loop();
        },
        err => alert(err)
    );
}


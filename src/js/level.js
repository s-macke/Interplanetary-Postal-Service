var texture = Array.from({length: 17*32}, () => Math.random()*0.1+0.9);

function GetDensityMap(x, y, offset)
{
    offset = offset | 0;
    let n = 0;

    let i = Math.floor(x / 33)|0;
    let j = Math.floor(y / 32)|0;

    for (let jj = j-3; jj <= j+3; jj++)
    for (let ii = i-3; ii <= i+3; ii++)
    {
        if (jj < 0) continue;
        if (ii < 0) continue;
        if (jj >= 17) continue;
        if (ii >= 32) continue;
        if ((maps[(ii>>3) + jj*4 + offset] >> 7-(ii & 7) & 1) == 0) continue;

        let r = ((x - ii*33)*(x - ii*33) + (y - jj*32)*(y - jj*32));
        n += Math.exp(-0.001 * r) * texture[jj*32 + ii];
    }
    return n;
}


function DrawMap(c, level, color)
{    
    let offset = 68 * level;
    for (let j = 0; j < 512; j++)
    for (let i = 0; i < 1024; i++)
    {
        let n = GetDensityMap(i, j, offset);
        let gradx = GetDensityMap(i+1, j, offset) - n;
        let grady = GetDensityMap(i, j+1, offset) - n;
        let rad = Math.sqrt(gradx*gradx + grady*grady);
        if (rad < 0.0001)
        {
            rad = 0.;
        } else
        rad = gradx*0.2/rad;
        let col =  0.8 + rad;

        c.fillStyle = "rgb("+(color.r*col|0)+","+(color.g*col|0)+","+(color.b*col|0)+")";

        if (n > 1.5)
        {
            c.fillRect(i, j, 1, 1);
        } else
        if (n > 1.3 && (i & 7) == 0 && (j & 7) == 0)
        {
            c.translate(i, j);
            //c.rotate(Math.random() * 2 * 3.141592);
            c.rotate(i*j*n); // random value
            c.fillRect(-8, -8, 16, 16);
            c.resetTransform();
        }
    }
}

function FillCenterText(c, str, y)
{
    let x = 512-0.5*c.measureText(str).width;
    c.fillStyle = "#00000040";
    c.fillText(str, x+1, y+1);
    c.fillText(str, x+2, y+2);
    c.fillText(str, x+3, y+3);
    c.fillStyle = "#A0A0FFA0";
    c.fillText(str, x, y);
}

function CenterText(c, str, y)
{
    let x = 512-0.5*c.measureText(str).width;
    c.fillStyle = "#A0A0FF60";
    c.fillText(str, x, y);
}

function DrawBuilding(c, x, y, w, h)
{
    c.fillStyle = "#A0A0A0FF";
    c.fillRect(x, y, w, h);

    for(let j=y+5; j<y+h-5; j += 10)
    for(let i=x+5; i<x+w-5; i += 10)
    {
        if (Math.random() > 0.5) c.fillStyle = "#000000FF"; else c.fillStyle = "#FFFF00FF";
        c.fillRect(i, j, 5, 5);
    }
}

function DrawLevel(c, level)
{
    if (level == lastlevel) return;
    lastlevel = level;
    c.clearRect(0, 0, graphics.boundarycanvas.width, graphics.boundarycanvas.height);   
    switch(level)
    {
        case -1:
            c.font = "100px Arial";
            c.fillStyle = "#000000FF";
            c.fillText("GAME", 200, 200);
            c.fillText("OVER", 320, 330);
            c.strokeStyle = "#A01010FF";
            c.lineWidth = 2;
            c.strokeText("GAME", 200, 200);
            c.strokeText("OVER", 320, 330);

            c.font = "50px Arial";
            c.strokeStyle = "#A01010FF";
            c.fillText("You lost all ships", 230, 390);
            c.strokeText("You lost all ships", 230, 390);
            break;

        case 0:
            ships = 5;
            score = 0;

            c.font = "500px Arial";
            CenterText(c, "📯", 350);

            c.fillStyle = "#FFFFFF80";
            c.font = "100px Arial";
            FillCenterText(c, "Interplanetary", 110)
            FillCenterText(c, "Postal", 210)
            FillCenterText(c, "Service", 310)
    
            c.font = "40px Arial";
            let str = "Guaranteed delivery in your lifetime";
            if (window.localStorage.dateOfLastAccident)
            {
                let lastAccident = Math.floor( (Date.now() - window.localStorage.dateOfLastAccident)/1000./3600./24.*10000.)/10000.;
                str = "No accident since " + lastAccident + " days";
            }
            FillCenterText(c, str, 370)
            
            c.font = "30px Arial";
            c.fillStyle = "#FFFFFFA0";
            FillCenterText(c, "As a postman, it is your job to deliver the mail to the distant colonies.", 420);
            FillCenterText(c, "Use Cursor Keys or WASD to fly your post lander", 450);
            FillCenterText(c, "Spacebar to toggle audio", 480);
            break;

        case 1:
            DrawMap(c, 0, {r:0x40, g:0xA0, b:0x40});
            c.clearRect(330, 120, 230, 30);
            c.fillStyle = "#FFFFFFFF";
            c.fillRect(330, 140, 230, 10);
            c.font = "20px Arial";
            c.fillText("Landing Pad", 380, 170);
            let data = c.getImageData(0, 0, 1024, 512).data;                
            DrawBuilding(c, 880, 200, 65, 200);
            DrawBuilding(c, 840, 250, 25, 150);
            /*
            for(let i=0; i<100; i++)
            {
                let x = Math.floor(Math.random()*1024);
                let y = Math.floor(Math.random()*512);
                if (y > 200)
                if (data[(y*1024+x)*4+3] == 0xFF) DrawTree(c, x, y, 0, 0);
            }
            */
            break;

        case 2:
            DrawMap(c, 1, {r:0x9D, g:0x84, b:0x20});
            c.clearRect(550, 400, 180, 70);
            c.fillStyle = "#FFFFFFFF";
            c.fillRect(550, 460, 180, 10);
            break;

        case 3: // dungeon
            DrawMap(c, 2, {r:0x21, g:0x6b, b:0x00});
            c.fillStyle = "#FFFFFFFF";
            c.fillRect(150, 190, 90, 10);
            DrawBuilding(c, 80, 150, 65, 50);
            break;

        case 4:
            for(let i=0; i<100; i++)
            {
                c.fillStyle = "#FFFFFFF0";
                c.beginPath();
                c.arc(Math.random()*1024,Math.random()*512,1,0,2*Math.PI);
                c.fill();
            }
            DrawMap(c, 3, {r:0x10, g:0x40, b:0x30});
            c.fillStyle = "#FFFFFFFF";
            c.clearRect(320, 440, 100, 30);
            c.fillRect(320, 460, 100, 10);
            break;

        case 5: // waterfall
            DrawMap(c, 4, {r:0x51, g:0x75, b:0x07});
            c.fillStyle = "#FFFFFFFF";
            c.fillRect(750, 290, 150, 10);
            DrawBuilding(c, 900, 250, 65, 50);
            DrawBuilding(c, 700, 200, 65, 100);
            break;

        case 6:
            DrawMap(c, 5, {r:0x89, g:0x89, b:0x89});
            c.fillStyle = "#FFFFFFFF";
            c.clearRect(750, 80, 100, 30);
            c.fillRect(750, 110, 100, 10);
            break;

        case 7:
            DrawMap(c, 6, {r:0xF4, g:0x8D, b:0x4E});
            c.fillStyle = "#FFFFFFFF";
            for(let i=0; i<50; i++)
            {
                let h = Math.random()*250+50;
                let x = Math.random()*1024;
                if ((x < 300) || (x > 800))
                    DrawBuilding(c, x, 500-h, 35, h);
            }
            c.fillStyle = "#202020FF";
            c.fillRect(450, 410, 100, 90);
            c.fillStyle = "#202020FE";
            c.fillRect(430, 390, 140, 20);

            DrawBuilding(c, 580, 450, 65, 40);

            c.fillStyle = "#FFFFFFFF";
            c.fillRect(580, 450, 65, 10);
            break;

        case 8:
            game._ShipSetActive();
            DrawMap(c, 7, {r:0x73, g:0x9F, b:0x2C});
            c.fillStyle = "#FFFFFFFF";
            c.fillRect(0, 490, 80, 10);
            break;

        case 9:
            game._Reset(
                level,
                0xFF7070, 0x8F3030,
                0xA0A0A0, 128, 84);
            c.font = "80px Arial";
            c.fillStyle = "#FFFFFFFF";
            FillCenterText(c, "You have successfully", 150)
            FillCenterText(c, "delivered all mail", 230)
            c.font = "50px Arial";
            FillCenterText(c, "" + Math.floor(ships * 500 + score) + " Points", 300)
            break
    }
}

function ResetLevel(level)
{

    switch(level)
    {
        case -1:
            game._Reset(
                    level, 0, 0, 
                    0x1010FF, 
                    -1e3, -1e3);
            break;
        case 0:
            game._Reset(
                level,
                0xAF7070, 0x804040,
                0xA0A0A0, -1e3, -1e3);
            break;
        case 1:
            game._Reset(
                level, 
                0xFF7070, 0x602020, 
                0xFFFFFF, 40, 40);
            game._ShipSetActive();
            break;

        case 2:
            game._Reset(
                level, 
                0x90A583, 0x94B9AF,
                0x11299B, 50, 10);
            game._ShipSetActive();
            break;

        case 3: // dungeon
            game._Reset(
                level, 
                0x0078A2, 0x0068A5,
                0x980063, 20, 100);
            game._ShipSetActive();
            break;

        case 4:
            game._Reset(
                level, 
                0x101010, 0x101010, 
                0x0030A0, 25, 60);
            game._ShipSetActive();
            break;

        case 5: // waterfall
            game._Reset(
                level,
                0x0B17AF, 0x000868,
                0x0B9DAF, 25, 50);
            game._ShipSetActive();
            break;
        
        case 6:
            game._Reset(
                level,
                0x263230, 0x161210,
                0xE0E0E0, 30, 100);
            game._ShipSetActive();

        case 7:
            game._Reset(
                level, 
                0xEA7D5A7D, 0x421C25, 
                0x4EF4F4, 50, 10);
                game._ShipSetActive();
                break;

        case 8:
            game._Reset(
                level,
                0x53942A94, 0x9269D4,
                0x8D4F8D, 220, 20);
            game._ShipSetActive();
            break;

        case 9:
            game._Reset(
                level, 
                0xFF7070, 0xFF7070,
                0xA0A0A0, 128, 64);
            break;
    }
}
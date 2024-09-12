#include"game.h"
#include"fluid.h"
#include"colorize.h"
#include"ship.h"
#include"maps.h"
#include"level.h"

float t;
float dt;
float windInfluence;

double realtime;

int level;

typedef struct
{
    int u, d, r, l;
} Keys;

Keys keys;

float __attribute__((export_name("_GetTime"))) GetTime()
{
    return t;
}

int __attribute__((export_name("_GetMapsOffset"))) GetMapsOffset()
{
    return (int)maps;
}

void __attribute__((export_name("_SetKeys"))) SetKeys(int u, int d, int r, int l)
{
    keys.u = u;
    keys.d = d;
    keys.r = r;
    keys.l = l;
}

void __attribute__((export_name("_Init"))) Init()
{
    dt = 0.05f;
    realtime = -1.;
    ColorInit(256, 128);
    FluidInit(256, 128, 20);
    ShipInit(-1000, -1000); // outside of screen
}

void __attribute__((export_name("_Reset"))) Reset(int _level, int _bgcolor1, int _bgcolor2, int _density2color, int x, int y)
{
    dt = 0.05f;
    realtime = -1.;
    level = _level;
    bgcolor1 = RGB2Color(_bgcolor1);
    bgcolor2 = RGB2Color(_bgcolor2);
    density2color = RGB2Color(_density2color);
    FluidReset();
    ShipInit(x, y);
}

void __attribute__((export_name("_Destroyed"))) Destroyed()
{
    Explode(s.r.x+0.5, s.r.y+0.5);
    s.isExploded = 1;
    s.isActive = 0;
}

float __attribute__((export_name("_GetFuel"))) GetFuel()
{
    return s.fuel;
}

int __attribute__((export_name("_IsThrustOn"))) IsThrustOn()
{
    if (s.fuel <= 0) return 0;
    if (s.isExploded) return 0;
    if (!s.isActive) return 0;
    return (keys.r + keys.l + keys.d + keys.u) > 0;
}

void Thrust(int x, int y, float sx, float sy)
{    
    s.fuel -= (keys.r + keys.l + keys.d + keys.u) * dt * 7.f;
    if (s.fuel < 0.001)
    {
        s.fuel = 0;        
        return;
    }
    
    ShipAddForce
    (
        (keys.r - keys.l)*1.f,
        (keys.d - keys.u)*1.f
    );

    if (keys.u)
    for(int j=y-3; j<y+3; j++)
    for(int i=x-3; i<x+3; i++)
    {
        if (!IsInside(j+6, i)) continue;
        float r2 = (i - sx)*(i - sx) + (j - sy)*(j - sy);
        density1[j+6][i] += dt * expf_fast(-r2*1.f)*10.;
        vy[j+6][i] += dt * expf_fast(-r2*1.f) * 1.;
    }

    if (keys.d)
    for(int j=y-3; j<y+3; j++)
    for(int i=x-3; i<x+3; i++)
    {
        if (!IsInside(j-6, i)) continue;
        float r2 = (i - sx)*(i - sx) + (j - sy)*(j - s.r.y);
        density1[j-6][i] += dt * expf_fast(-r2*1.f)*10.;
        vy[j-6][i] -= dt * expf_fast(-r2*1.f) * 1.;
    }

    if (keys.l)
    for(int j=y-3; j<y+3; j++)
    for(int i=x-3; i<x+3; i++)
    {
        if (!IsInside(j, i+6)) continue;
        float r2 = (i - sx)*(i - sx) + (j - sy)*(j - sy);
        density1[j][i+6] += dt * expf_fast(-r2*1.f)*10.;
        vx[j][i+6] += dt * expf_fast(-r2*1.f) * 1.;
    }

    if (keys.r)
    for(int j=y-3; j<y+3; j++)
    for(int i=x-3; i<x+3; i++)
    {
        if (!IsInside(j, i-6)) continue;
        float r2 = (i - sx)*(i - sx) + (j - sy)*(j - sy);
        density1[j][i-6] += dt * expf_fast(-r2*1.f)*10.;
        vx[j][i-6] -= dt * expf_fast(-r2*1.f) * 1.;
    }

}

void ShipFluidInteractionStep()
{
    if (!s.isActive) return;

    // move to the center of the cells
    float sx = s.r.x + 0.5;
    float sy = s.r.y + 0.5;

    int x = (int)s.r.x;
    int y = (int)s.r.y;

    if ((x < 5 || y < 5 || x > N-5 || y > M-5)) Destroyed();

    float fx = 0.;
    float fy = 0.;
    for(int j=y-5; j<=y+5; j++)
    for(int i=x-5; i<=x+5; i++)
    {
        if (!IsInside(j, i)) continue;
        float r2 = ((float)i - sx)*((float)i - sx) + ((float)j - sy)*((float)j - sy);
        fx += vx[j][i];
        fy += vy[j][i];
        float e = 1.-expf_fast(-r2*0.05f);
        vx[j][i] *= e;
        vy[j][i] *= e;
    }
    
    ShipAddForce(fx/dt*windInfluence, fy/dt*windInfluence);
    Thrust(x, y, sx, sy);
}


/*
 * Calculate timestep
 */ 
void __attribute__((export_name("_Step"))) Step(double _realtime, int simulateShip)
{
    if (realtime <= 0)
    {
        realtime = _realtime;
    } else
    {
        dt = (_realtime - realtime) / 500.;
        if (dt > 0.2)  dt = 0.2;
        if (dt < 0.001)  dt = 0.001;
        realtime = _realtime;
    }

    if (simulateShip) ShipFluidInteractionStep();
    SetLevelStep(level, dt);

    FluidStep(dt);
    if (simulateShip) ShipStep(dt);
    
    Colorize();

    t += dt;
}



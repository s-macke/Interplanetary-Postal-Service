#include"utils.h"
#include"ship.h"


Ship s;

float gravity = 0.5;

void ShipInit(int x, int y)
{    
    s.mass = 1.;
    s.width = 4;
    s.height = 4;
    s.J = 1./12.*s.mass*4*(s.width*s.width + s.height*s.height);
    s.r.x = x;
    s.r.y = y;
    s.v.x = 0.;
    s.v.y = 0.;
    s.f.x = 0.;
    s.f.y = 0.;
    s.phi = 0.;
    s.w = 0.;
    s.M = 0.;
    s.isActive = 0;
    s.isExploded = 0;
    s.fuel = 1000.;
}

void __attribute__((export_name("_ShipSetActive"))) ShipSetActive()
{
    s.isActive = 1;
    s.f.x = 0.;
    s.f.y = 0.;
}

int __attribute__((export_name("_IsExploded"))) IsExploded()
{
    return s.isExploded;
}

void ShipAddForce(float x, float y)
{
    s.f.x += x;
    s.f.y += y;
}

void ShipStep(float dt)
{
    if (!s.isActive) return;

    s.v.x += s.f.x/s.mass * dt;
    s.v.y += s.f.y/s.mass * dt;
    s.r.x += s.v.x * dt;
    s.r.y += s.v.y * dt;

    // air friction and gravity
    s.f.x = -s.v.x*0.1;
    s.f.y = -s.v.y*0.1 + gravity;
}

float __attribute__((export_name("_ShipGetX"))) ShipGetX()
{
    return s.r.x;
}

float __attribute__((export_name("_ShipGetY"))) ShipGetY()
{
    return s.r.y;
}

float __attribute__((export_name("_ShipGetVY"))) ShipGetVY()
{
    return s.v.y;
}

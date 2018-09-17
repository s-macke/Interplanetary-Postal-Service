#ifndef PHYSICS_H
#define PHYSICS_H

#include<emscripten.h>
#include"utils.h"

void EMSCRIPTEN_KEEPALIVE Init();
void EMSCRIPTEN_KEEPALIVE Reset(int _level, int _bgcolor1, int _bgcolor2, int _density2color, int x, int y);
void EMSCRIPTEN_KEEPALIVE Step(double _realtime, int simulateShip);

void EMSCRIPTEN_KEEPALIVE SetKeys(int u, int d, int r, int l);
float EMSCRIPTEN_KEEPALIVE GetTime();

extern float windInfluence;


#endif

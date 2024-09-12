#ifndef PHYSICS_H
#define PHYSICS_H

#include"utils.h"

void Init();
void Reset(int _level, int _bgcolor1, int _bgcolor2, int _density2color, int x, int y);
void Step(double _realtime, int simulateShip);

void SetKeys(int u, int d, int r, int l);
float GetTime();

extern float windInfluence;


#endif

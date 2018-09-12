#ifndef FLUID_H
#define FLUID_H

#include"utils.h"

void FluidInit(int _N, int _M, int _iterations);
void FluidStep(float dt);
void GetVelocity(float x, float y, Vector *v);
void FluidReset();
int IsInside(int j, int i);

extern int N, M;
extern float **vx, **vy;
extern float **density1;
extern float **density2;
extern float **density3;
extern float **p, **divergence;

#define FLUID 0
#define BOUNDARY 1
#define INNERBOUNDARY 2
extern int **cell;

#endif
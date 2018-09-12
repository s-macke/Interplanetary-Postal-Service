#ifndef COLORIZE_H
#define COLORIZE_H

#include"utils.h"

extern Color bgcolor1;
extern Color bgcolor2;
extern Color density2color;
extern Color thrustcolor;
extern Color explosioncolorlow;
extern Color explosioncolorhigh;
extern float velocityColorScale;
extern float velocityColorOffset;
extern float shadingStrength;



void ColorInit(int N, int M);
void Colorize();

#endif
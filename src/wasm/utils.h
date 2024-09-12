#ifndef UTILS_H
#define UTILS_H

typedef struct
{
    float x, y;
} Vector;

typedef struct
{
    float r, g, b;
} Color;

unsigned int Color2RGB(Color c);
Color RGB2Color(int color);

void AddDensity(Color *c, Color *gasc, float d);
void AddDensityInterpolate(Color *c, Color *gaslowc, Color *gashighc, float d);
void ColorInterpolate(Color *c, Color *lowc, Color *highc, float d);

float** AllocArray(int N, int M);

float sqrtf_fast(float x);
float cosf_fast(float x);
float sinf_fast(float x);
float expf_fast(float a);

unsigned int rand(void);

#endif
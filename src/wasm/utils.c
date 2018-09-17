#include"utils.h"

char *allocPointer = (char*)8192; // start of dynamic memory allocation

float** AllocArray(int N, int M)
{
    float **f =  (float**)allocPointer;
    allocPointer += sizeof(float*) * M;
    for(int i=0; i<M; i++)
    {
        f[i] = (float*)allocPointer;
        allocPointer += sizeof(float) * N;
    }
    return f;
}

Color RGB2Color(int color)
{
    Color c;
    c.r = ((float)((color >> 0) & 0xFF))/255.;
    c.g = ((float)((color >> 8) & 0xFF))/255.;
    c.b = ((float)((color >> 16) & 0xFF))/255.;
    return c;
}

int Color2RGB(Color c)
{
    if (c.r > 1.) c.r = 1;
    if (c.g > 1.) c.g = 1;
    if (c.b > 1.) c.b = 1;
    if (c.r < 0.) c.r = 0;
    if (c.g < 0.) c.g = 0;
    if (c.b < 0.) c.b = 0;
    
    return 0xFF000000 | ((int)(c.b * 255.)<<16) | ((int)(c.g * 255.)<<8) | ((int)(c.r * 255.));
}

void AddDensity(Color *c, Color *gasc, float d)
{
    if (d < 0.01) return;
    if (d > 1.) d = 1.;
    c->r = c->r * (1. - d) + gasc->r * d;
    c->g = c->g * (1. - d) + gasc->g * d;
    c->b = c->b * (1. - d) + gasc->b * d;
}


void ColorInterpolate(Color *c, Color *lowc, Color *highc, float d)
{
    c->r = lowc->r + (highc->r-lowc->r)*d;
    c->g = lowc->g + (highc->g-lowc->g)*d;
    c->b = lowc->b + (highc->b-lowc->b)*d;
}


void AddDensityInterpolate(Color *c, Color *gaslowc, Color *gashighc, float d)
{
    if (d < 0.01) return;
    float dint = 1.-expf_fast(-d*0.5);
    if (d > 1.) d = 1.;
    c->r = c->r * (1. - d) + (gaslowc->r + (gashighc->r-gaslowc->r)*dint) * d;
    c->g = c->g * (1. - d) + (gaslowc->g + (gashighc->g-gaslowc->g)*dint) * d;
    c->b = c->b * (1. - d) + (gaslowc->b + (gashighc->b-gaslowc->b)*dint) * d;
}


float sqrtf_fast(float x)
{
  unsigned int i = *(unsigned int*) &x;
  i  += 127 << 23;
  i >>= 1;
  return *(float*) &i;
}

#define PI 3.1415927f
#define FLOOR( V ) ((V) >= 0 ? (int)(V) : (int)((V) - 1))
#define FABS( V ) ((V) < 0 ? (-V) : (V))

float cosf_fast(float x)
{
    float tp = 1./(2.*PI);
    x *= tp;
    x -= .25f + FLOOR(x + .25f);
    x *= 16.f * (FABS(x) - .5f);
    return x;
}

float sinf_fast(float x)
{
    return cosf_fast(x + PI*0.5f);
}

float expf_fast(float a)
{
  union { float f; int x; } u;
  u.x = (int) (12102203 * a + 1064866805);
  return u.f;
}
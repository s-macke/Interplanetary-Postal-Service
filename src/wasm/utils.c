#include"utils.h"

char *allocPointer = (char*)0x20000; // start of dynamic memory allocation

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
    c.r = ((float)((color >> 0) & 0xFF))/255.f;
    c.g = ((float)((color >> 8) & 0xFF))/255.f;
    c.b = ((float)((color >> 16) & 0xFF))/255.f;
    return c;
}

unsigned int Color2RGB(Color c)
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
    if (d < 0.01f) return;
    if (d > 1.) d = 1.f;
    c->r = c->r * (1.f - d) + gasc->r * d;
    c->g = c->g * (1.f - d) + gasc->g * d;
    c->b = c->b * (1.f - d) + gasc->b * d;
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
    float dint = 1.f-expf_fast(-d*0.5f);
    if (d > 1.) d = 1.f;
    c->r = c->r * (1.f - d) + (gaslowc->r + (gashighc->r-gaslowc->r)*dint) * d;
    c->g = c->g * (1.f - d) + (gaslowc->g + (gashighc->g-gaslowc->g)*dint) * d;
    c->b = c->b * (1.f - d) + (gaslowc->b + (gashighc->b-gaslowc->b)*dint) * d;
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
    float tp = 1.f/(2.f*PI);
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
  u.x = (int) (12102203 * a + 1064866805.f);
  return u.f;
}

unsigned int rand(void)
{
    static unsigned int z1 = 12345, z2 = 12345, z3 = 12345, z4 = 12345;
    unsigned int b;
    b  = ((z1 << 6) ^ z1) >> 13;
    z1 = ((z1 & 4294967294U) << 18) ^ b;
    b  = ((z2 << 2) ^ z2) >> 27;
    z2 = ((z2 & 4294967288U) << 2) ^ b;
    b  = ((z3 << 13) ^ z3) >> 21;
    z3 = ((z3 & 4294967280U) << 7) ^ b;
    b  = ((z4 << 3) ^ z4) >> 12;
    z4 = ((z4 & 4294967168U) << 13) ^ b;
    return (z1 ^ z2 ^ z3 ^ z4);
}

void *memset(void *s, int c, unsigned long n) {
    unsigned char *d = (unsigned char *) s;
    for (int i = 0; i < n; i++) d[i] = c;
    return s;
}
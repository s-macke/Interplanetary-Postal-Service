#include"colorize.h"
#include"fluid.h"

Color bgcolor1;
Color bgcolor2;
Color density2color;
Color thrustcolor;
Color explosioncolorlow;
Color explosioncolorhigh;
float velocityColorScale;
float velocityColorOffset;
float shadingStrength;

int **color;

int __attribute__((export_name("_GetColorOffset"))) GetColorOffset()
{
    return (int)&color[0][0];
}

void ColorInit(int N, int M)
{
    thrustcolor = RGB2Color(0x202020);
    explosioncolorlow = RGB2Color(0x0040FF);
    explosioncolorhigh = RGB2Color(0x42FFFF);
    color = (int**)AllocArray(N, M);
}

void Colorize()
{
    Color c, bgcolor;
    Color temp;
    for(int j=1; j<=M; j++)
    {
        ColorInterpolate(&bgcolor, &bgcolor1, &bgcolor2, ((float)j-1)/(float)M);
        
        int *colorRow = color[j-1];
        
        float *density1Row = density1[j];

        float *density2PrevRow = density2[j-1];
        float *density2Row = density2[j];
        float *density2NextRow = density2[j+1];

        float *density3Row = density3[j];

        float *vxRow = vx[j];
        float *vyRow = vy[j];

        float shadingStrengthSub = 1.-shadingStrength;

        for(int i=1; i<=N; i++)
        {
            c = bgcolor;

            // shade according to gradient. Similar to diffuse lightning
            if (density2Row[i] > 0.01)
            {
                temp = density2color;
                float gradx = density2Row[i+1] - density2Row[i-1];
                float grady = density2NextRow[i] - density2PrevRow[i];
                float r = gradx*shadingStrength/sqrtf_fast(gradx*gradx + grady*grady);
                float v = sqrtf_fast(vxRow[i]*vxRow[i] + vyRow[i]*vyRow[i])
                            *velocityColorScale + velocityColorOffset;
                float scale = (shadingStrengthSub + r)*v;
                temp.r *= scale;
                temp.g *= scale;
                temp.b *= scale;
                AddDensity(&c, &temp, density2Row[i]);
            }

            // Add the thrust
            AddDensity(&c, &thrustcolor, density1Row[i]);
            // Add Explosions
            AddDensityInterpolate(&c, &explosioncolorlow, &explosioncolorhigh, density3Row[i]);
            colorRow[i-1] = Color2RGB(c);
        }
    }
}

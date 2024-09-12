#include"utils.h"
#include"level.h"
#include"fluid.h"
#include"game.h"
#include"colorize.h"

void Explode(int x, int y)
{
    for(int j=-10; j<=10; j++)
    for(int i=-10; i<=10; i++)
    {
        if (!IsInside(j+y, i+x)) continue;

        float r2 = i*i + j*j;
        density3[j+y][i+x] = expf_fast(-r2*0.1) * 10.;
        
        if ((i == 0) && (j == 0)) continue;
        vy[j+y][i+x] += (((float)j)/sqrtf_fast(r2)) * 0.2;
    }
}


void SetFluidVelocity(int type, int x, int y, float dt)
{
    switch(type)
    {
        case 0: // left
            for(int i=y-2; i<=y+2; i++)
            {
                vx[i][x] = 0.1;
                density2[i][x-1] += 20.*dt;
            }
            break;
        case 1: // right
            for(int i=y-2; i<=y+2; i++)
            {
                vx[i][x] = -0.1;
                density2[i][x+1] += 20.*dt;
            }
            break;
        case 2: // up
            for(int i=x-2; i<=x+2; i++)
            {
                vy[y][i] = -0.1;
                density2[y-1][i] += 20.*dt;
            }
            break;
        case 3: // down
            for(int i=x-2; i<=x+2; i++)
            {
                vy[y][i] = 0.1;
                density2[y+1][i] += 20.*dt;
            }
            break;
    }
}

float time2 = 0; // helper for final screen

void SetLevelStep(int level, float dt)
{
    windInfluence = 0.04;
    switch(level)
    {
        case -1: // lost
            velocityColorScale = 5.;
            velocityColorOffset = 0.8;
            shadingStrength = 0.15;
            for(int j=1; j<M; j++)
            for(int i=1; i<N; i++)
            {
                if (cell[j][i] == FLUID)
                if (cell[j+1][i])
                {
                    density2[j-1][i] += 1*dt;
                    density2[j][i] += 1*dt;
                    vy[j-1][i] = -0.1;
                }
            }
            break;

        case 0: // start screen
            velocityColorScale = 10.;
            velocityColorOffset = 0.1;
            shadingStrength = 0.15;
            for(int i=128-10; i<=128+10; i++)
            {
                vy[M-4][i] -= 0.2;
                density2[M-5][i] += 5.*dt;
                density2[M-4][i] += 5.*dt;
            }
            break;

        case 1: //green hill
            velocityColorScale = 30.;
            velocityColorOffset = 0.5;
            shadingStrength = 0.03;
            for(int i=10; i<=70; i++)
            {
                vx[i][N-2] = -0.02;
                density2[i][N-2] += 2.*dt;
            }
            break;
        
        case 2: // hole
            velocityColorScale = 10.;
            velocityColorOffset = 0.7;
            shadingStrength = 0.1;
            for(int i=10; i<=20; i++)
            {
                vx[i][1] = 0.1;
                density2[i][1] += 0.4*dt;
            }
            break;

        case 3: // dungeon
            velocityColorScale = 20.;
            velocityColorOffset = 0.7;
            shadingStrength = 0.2;
            for(int i=10; i<=50; i++)
            {
                if (cell[i][1]) continue;
                vx[i][1] = 0.1;
                density2[i][1] += 0.2*dt;
            }
            break;

        case 4: // vulcano
            windInfluence = 0.055;
            velocityColorScale = 20.;
            velocityColorOffset = 0.5;
            shadingStrength = 0.15;
            for(int i=80; i<=150; i++)
            {
                if (cell[M][i]) continue;
                vy[M][i] = -0.1;
                density2[M][i] += 0.05*dt;
            }
            break;

        case 5: // waterfall
            velocityColorScale = 10.;
            velocityColorOffset = 0.5;
            shadingStrength = 0.15;
            for(int i=0+20; i<=256-20; i++)
            {
                vy[3][i] = 0.04;
                density2[2][i] += 3*dt;
            }            
            break;

        case 6:
            windInfluence = 0.033;
            velocityColorScale = 20.;
            velocityColorOffset = 0.4;
            shadingStrength = 0.15;
            for(int i=5; i<=150; i++)
            {
                float sinx = sinf_fast(i/10.);

                if (!cell[M-2][i] && !cell[M-2][i+1] && sinx > 0.)
                {
                    vy[M-2][i] = -sinx*0.1;
                    density2[M-2][i] += sinx*4.*dt;
                }
                
                if (!cell[3][i] && !cell[3][i+1] && sinx < 0.)
                {                    
                    vy[3][i] = -sinx*0.1;
                    density2[3][i] += (-sinx)*4.*dt;
                }
            }
            break;

        case 7: // city with chimney
            windInfluence = 0.05;
            velocityColorScale = 20.;
            velocityColorOffset = 0.2;
            shadingStrength = 0.3;

            for(int i=128-10; i<=128+10; i++)
            {
                vy[M-32][i] = -1.7f;
                density2[M-32][i] += 1.f*dt;
                density2[M-31][i] += 1.f*dt;
                density2[M-30][i] += 0.2f*dt;
                density2[M-29][i] += 0.2f*dt;
            }
            break;

        case 8: // flying green
            velocityColorScale = 20.;
            velocityColorOffset = 0.7;
            shadingStrength = 0.15;

            // right
            //SetFluidVelocity(0, 3, 30);
            SetFluidVelocity(0, 3, 60, dt);

            // left
            SetFluidVelocity(1, N-2, 20, dt);
            SetFluidVelocity(1, N-2, 60, dt);

            // up
            SetFluidVelocity(2, 200, M-2, dt);
            SetFluidVelocity(2, 150, M-2, dt);
            SetFluidVelocity(2, 100, M-2, dt);
            SetFluidVelocity(2, 25, M-2, dt);

            // down
            SetFluidVelocity(3, 650, 3, dt);
            SetFluidVelocity(3, 20, 3, dt);
                
            break;

        case 9: // end screen
            time2 -= dt;
            if (time2 < 0)
            {
                Explode(rand()&255, rand()&127);
                time2 += 3;
            }
            break;

        default:
            break;
    }

}

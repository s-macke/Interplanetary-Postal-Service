#include"utils.h"
#include"fluid.h"

// size of the grid
int N;
int M;

// number of iterations for the linear solver of Poisson's equation
int iterations;

// the density of the different particles I simulate
float **prevdensity1, **density1; // thrust
float **prevdensity2, **density2; // specific to the level
float **prevdensity3, **density3; // explosion

// velocity in x and y direction
float **prevvx, **prevvy, **vx, **vy;

// the pressure and the divergence
float **p, **divergence;

// flag field for the cell
int **cell;

// Provides the pointer to the cell array
int __attribute__((export_name("_GetBoundaryOffset"))) GetBoundaryOffset() {
    return (int) &cell[0][0];
}

// Resets the fluid velocity and densities
void FluidReset() {
    for (int i = 0; i <= N + 1; i++)
        for (int j = 0; j <= M + 1; j++) {
            density1[j][i] = 0.f;
            prevdensity1[j][i] = 0.f;
            density2[j][i] = 0.f;
            prevdensity2[j][i] = 0.f;
            density3[j][i] = 0.f;
            prevdensity3[j][i] = 0.f;
            cell[j][i] = FLUID;
            vx[j][i] = 0.f;
            vy[j][i] = 0.f;
        }
}

// Initializes the fluid data structures
void FluidInit(int _N, int _M, int _iterations) {
    N = _N;
    M = _M;

    iterations = _iterations;

    density1 = AllocArray(N + 2, M + 2);
    prevdensity1 = AllocArray(N + 2, M + 2);
    density2 = AllocArray(N + 2, M + 2);
    prevdensity2 = AllocArray(N + 2, M + 2);
    density3 = AllocArray(N + 2, M + 2);
    prevdensity3 = AllocArray(N + 2, M + 2);

    cell = (int **) AllocArray(N + 2, M + 2);

    prevvx = AllocArray(N + 2, M + 2);
    prevvy = AllocArray(N + 2, M + 2);
    vx = AllocArray(N + 2, M + 2);
    vy = AllocArray(N + 2, M + 2);

    p = AllocArray(N + 2, M + 2);
    divergence = AllocArray(N + 2, M + 2);

    FluidReset();
}

int IsInside(int j, int i) {
    if (j < 1) return 0;
    if (i < 1) return 0;
    if (j > M) return 0;
    if (i > N) return 0;
    if (cell[j][i]) return 0;
    return 1;
}

// Set Neumann boundary conditions f' = 0 at edges. For example to define inlet outlet flow
void SetEdgesEqual(float **x) {
    // top and bottom
    for (int i = 1; i <= N; i++) {
        x[0][i] = x[1][i];
        x[M + 1][i] = x[M][i];
    }

    // left and right
    for (int j = 1; j <= M; j++) {
        x[j][0] = x[j][1];
        x[j][N + 1] = x[j][N];
    }

    // average at the edges
    x[0][0] = 0.5f * (x[0][1] + x[1][0]);
    x[M + 1][0] = 0.5f * (x[M + 1][1] + x[M][0]);
    x[0][N + 1] = 0.5f * (x[0][N] + x[1][N + 1]);
    x[M + 1][N + 1] = 0.5f * (x[M + 1][N] + x[M][N + 1]);
}

// Set Dirichlet boundary conditions at edges
void SetEdgesZero(float **x) {
    // top and bottom
    for (int i = 0; i <= N + 1; i++) {
        x[0][i] = 0.f;
        x[M + 1][i] = 0.f;
    }

    // left and right
    for (int j = 0; j <= M + 1; j++) {
        x[j][0] = 0.f;
        x[j][N + 1] = 0.f;
    }

}

// Set Neumann boundary conditions.
void SetBoundaryEqual(float **x) {
    for (int j = 1; j < M + 1; j++) {
        int *cellRow = cell[j];
        float *xRow = x[j];
        for (int i = 1; i < N + 1; i++) {
            if (cellRow[i] == INNERBOUNDARY) {
                xRow[i] = 0.f;
            } else if (cellRow[i] == BOUNDARY) {
                float add = 0.f;
                float n = 0;

                if (!cellRow[i + 1]) {
                    add += xRow[i + 1];
                    n++;
                }
                if (!cellRow[i - 1]) {
                    add += xRow[i - 1];
                    n++;
                }
                if (!cell[j + 1][i]) {
                    add += x[j + 1][i];
                    n++;
                }
                if (!cell[j - 1][i]) {
                    add += x[j - 1][i];
                    n++;
                }
                if (n != 0) xRow[i] = add / (float) n; else xRow[i] = 0.f;
            }
        }
    }
    SetEdgesEqual(x);
}

// Set Dirichlet boundary conditions.
void SetBoundaryZero(float **x) {
    for (int j = 1; j < M + 1; j++) {
        int *cellRow = cell[j];
        float *xRow = x[j];
        for (int i = 1; i < N + 1; i++) {
            if (cellRow[i]) xRow[i] = 0.f; // if boundary
        }
    }
    SetEdgesEqual(x);
}

/*
 * Set the boundary conditions for the velocity field
 *
 * No flow should exit the walls. This simply means that the horizontal 
 * component of the velocity should be zero on the vertical walls, 
 * while the vertical component of the velocity should be zero on the 
 * horizontal walls. 
*/
void SetBoundaryVelocity(float **vx, float **vy) {
    // average at the boundary
    for (int i = 1; i < N + 1; i++)
        for (int j = 1; j < M + 1; j++) {
            if (cell[j][i] == INNERBOUNDARY) {
                vx[j][i] = 0.f;
                vy[j][i] = 0.f;
            } else if (cell[j][i] == BOUNDARY) {
                float addx = 0.f;
                float addy = 0.f;
                float n = 0;

                if (!cell[j][i + 1]) {
                    addx += -vx[j][i + 1];
                    addy += vy[j][i + 1];
                    n++;
                }
                if (!cell[j][i - 1]) {
                    addx += -vx[j][i - 1];
                    addy += vy[j][i - 1];
                    n++;
                }
                if (!cell[j + 1][i]) {
                    addx += vx[j + 1][i];
                    addy += -vy[j + 1][i];
                    n++;
                }
                if (!cell[j - 1][i]) {
                    addx += vx[j - 1][i];
                    addy += -vy[j - 1][i];
                    n++;
                }
                if (n != 0) {
                    vx[j][i] = addx / (float) n;
                    vy[j][i] = addy / (float) n;
                } else {
                    vx[j][i] = 0.f;
                    vy[j][i] = 0.f;
                }
            }
        }

    // inflow and outflow at the edges
    SetEdgesEqual(vx);
    SetEdgesEqual(vy);
}

// Advection step for the fluid simulation using Lagrange integration and linear interpolation
void Advect(float **d0, float **d, float dt) {
    float Wdt0 = dt * N;
    float Hdt0 = dt * M;
    float Wp5 = N + 0.5;
    float Hp5 = M + 0.5;
    for (int j = 1; j <= M; j++) {
        for (int i = 1; i <= N; i++) {
            float x = i - Wdt0 * vx[j][i];
            float y = j - Hdt0 * vy[j][i];
            if (x < 0.5) x = 0.5f; else if (x > Wp5) x = Wp5;
            int i0 = x;
            int i1 = i0 + 1;
            if (y < 0.5) y = 0.5f; else if (y > Hp5) y = Hp5;
            int j0 = y;
            int j1 = j0 + 1;
            float s1 = x - i0;
            float s0 = 1. - s1;
            float t1 = y - j0;
            float t0 = 1. - t1;
            d[j][i] = s0 * (t0 * d0[j0][i0] + t1 * d0[j1][i0]) + s1 * (t0 * d0[j0][i1] + t1 * d0[j1][i1]);
        }
    }
}

// Get Velocity at a specific position using linear interpolation
void GetVelocity(float x, float y, Vector *v) {
    float Wp5 = N + 0.5;
    float Hp5 = M + 0.5;

    if (x < 0.5) x = 0.5f; else if (x > Wp5) x = Wp5;
    int i0 = x;
    int i1 = i0 + 1;

    if (y < 0.5) y = 0.5f; else if (y > Hp5) y = Hp5;
    int j0 = y;
    int j1 = j0 + 1;

    float s1 = x - i0;
    float s0 = 1 - s1;
    float t1 = y - j0;
    float t0 = 1 - t1;

    v->x = s0 * (t0 * vx[j0][i0] + t1 * vx[j1][i0]) + s1 * (t0 * vx[j0][i1] + t1 * vx[j1][i1]);
    v->y = s0 * (t0 * vy[j0][i0] + t1 * vy[j1][i0]) + s1 * (t0 * vy[j0][i1] + t1 * vy[j1][i1]);
}

// Solves the Poisson's equation using Jacobi
void LinearSolve(float **x, float **x0, float a, float c) {
    float invC = 1.f / c;
    float w = 1.5f;
    SetBoundaryEqual(x);
    for (int k = 0; k < iterations; k++) {
        //x[2][2] = 0.;
        for (int j = 1; j <= M; j++) {
            float *lastRow = x[j - 1];
            float *currentRow = x[j + 0];
            float *nextRow = x[j + 1];
            float *currentRow0 = x0[j];
            int *currentcellRow = cell[j];
            for (int i = 1; i <= N; i++) {
                if (currentcellRow[i]) continue; // If boundary
                currentRow[i] =
                        (currentRow0[i] + a * (currentRow[i - 1] + currentRow[i + 1] + lastRow[i] + nextRow[i])) * invC;
                //currentRow[i] = (1.-w)*currentRow[i] + (currentRow0[i] + a * (currentRow[i-1] + currentRow[i+1] + lastRow[i] + nextRow[i])) * invC * w;
            }
        }
        SetBoundaryEqual(x);
    }
}

/* Check of quality of linear solver. Ignored for the game. Let'h hope the best */
float Residual(float **x, float **x0, float a, float c) {
    float invC = 1.f / c;
    float res;
    for (int j = 1; j <= M; j++) {
        float *lastRow = x[j - 1];
        float *currentRow = x[j + 0];
        float *nextRow = x[j + 1];
        float *currentRow0 = x0[j];
        int *currentCellRow = cell[j];
        for (int i = 1; i <= N; i++) {
            if (currentCellRow[i]) continue;
            float add = (currentRow0[i] - a * (currentRow[i - 1] + currentRow[i + 1] + lastRow[i] + nextRow[i])) * invC;
            res += add * add;
        }
    }
    return res;
}

void Stabilize(float **x) {
    for (int j = 0; j < M + 2; j++) {
        float *xRow = x[j];
        for (int i = 0; i < N + 2; i++) {
            if (xRow[i] > 0.1) xRow[i] = 0.f;
            if (xRow[i] < -0.1) xRow[i] = 0.f;
        }
    }
}

void Project() {
    //float h = -0.5 / sqrtf(N*M);
    float h = -0.00276213586f; // well, just to prevent usage of sqrtf

    for (int j = 1; j <= M; j++) {
        float *previousRow = vy[j - 1];
        float *nextRow = vy[j + 1];
        float *vxRow = vx[j];

        float *divRow = divergence[j];
        float *pRow = p[j];
        int *currentCellRow = cell[j];
        for (int i = 1; i <= N; i++) {
            pRow[i] = 0.f;
            if (currentCellRow[i]) continue;
            divRow[i] = h * (vxRow[i + 1] - vxRow[i - 1] + nextRow[i] - previousRow[i]);
        }
    }
    SetBoundaryEqual(divergence);

    // Solves Poisson's equation
    LinearSolve(p, divergence, 1.f, 4.f);
/*
    // calculate residual
    if (Residual(p, divergence, 1., 4.) > 1)
    {
        Stabilize(vx);
        Stabilize(vy);
        Stabilize(prevvx);
        Stabilize(prevvy);
    }
  */

    float wScale = 0.5f * N;
    float hScale = 0.5f * M;
    for (int j = 1; j <= M; j++) {
        float *previousrow = p[j - 1];
        float *prow = p[j];
        float *nextrow = p[j + 1];

        float *vxRow = vx[j];
        float *vyRow = vy[j];
        int *currentCellRow = cell[j];

        for (int i = 1; i <= N; i++) {
            if (currentCellRow[i]) continue;
            vxRow[i] -= wScale * (prow[i + 1] - prow[i - 1]);
            vyRow[i] -= hScale * (nextrow[i] - previousrow[i]);
        }
    }
    SetBoundaryVelocity(vx, vy);
}

// just fix some unusual boundaries for stability reasons. Define inner boundary
void __attribute__((export_name("_FixCells"))) FixCells() {
    // Set edges as boundary
    for (int i = 0; i <= N + 1; i++) {
        cell[0][i] = BOUNDARY;
        cell[M + 1][i] = BOUNDARY;
    }

    for (int j = 0; j <= M + 1; j++) {
        cell[j][0] = BOUNDARY;
        cell[j][N + 1] = BOUNDARY;
    }

    // Fix fluid cell which are surrounded by boundaries
    for (int j = 1; j <= M; j++)
        for (int i = 1; i <= N; i++) {
            if (cell[j + 1][i] && cell[j - 1][i]) cell[j][i] = BOUNDARY;
            if (cell[j][i + 1] && cell[j][i - 1]) cell[j][i] = BOUNDARY;

            if (cell[j][i] && cell[j + 1][i + 1])
                if (cell[j + 1][i] == FLUID && cell[j][i + 1] == FLUID) {
                    cell[j + 1][i] = BOUNDARY;
                    cell[j][i + 1] = BOUNDARY;
                }

            if (cell[j][i]
                && cell[j - 1][i] == FLUID
                && cell[j + 1][i] == FLUID
                && cell[j - 1][i - 1] == FLUID
                && cell[j - 1][i + 1] == FLUID)
                cell[j][i] = FLUID;

            if (cell[j + 1][i] && cell[j][i + 1])
                if (cell[j][i] == FLUID && cell[j + 1][i + 1] == FLUID) {
                    cell[j + 1][i + 1] = BOUNDARY;
                    cell[j + 1][i + 1] = BOUNDARY;
                }
        }

    // Define inner boundary
    for (int j = 1; j <= M; j++)
        for (int i = 1; i <= N; i++) {
            if (cell[j + 1][i] && cell[j - 1][i] && cell[j][i + 1] && cell[j - 1][i - 1])
                if (cell[j + 1][i + 1] && cell[j - 1][i + 1] && cell[j + 1][i - 1] && cell[j - 1][i + 1])
                    cell[j][i] = INNERBOUNDARY;
        }
}


void FluidStep(float dt) {
    float **temp;

    SetBoundaryVelocity(vx, vy);
    SetBoundaryEqual(density1);
    SetBoundaryEqual(density2);
    SetBoundaryEqual(density3);
    Project();

    Advect(vx, prevvx, dt);
    Advect(vy, prevvy, dt);
    SetBoundaryVelocity(prevvx, prevvy);

    // switch arrays
    temp = vx;
    vx = prevvx;
    prevvx = temp;
    temp = vy;
    vy = prevvy;
    prevvy = temp;

    Project();

    // switch arrays
    temp = density1;
    density1 = prevdensity1;
    prevdensity1 = temp;
    temp = density2;
    density2 = prevdensity2;
    prevdensity2 = temp;
    temp = density3;
    density3 = prevdensity3;
    prevdensity3 = temp;

    // Actually SetBoundaryZero would be better. But the boundary drawing looks bad
    Advect(prevdensity1, density1, dt);
    SetBoundaryEqual(density1);
    SetEdgesZero(density1);
    Advect(prevdensity2, density2, dt);
    SetBoundaryEqual(density2);
    SetEdgesZero(density2);
    Advect(prevdensity3, density3, dt);
    SetBoundaryEqual(density3);
    SetEdgesZero(density3);
}

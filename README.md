# Interplanetary Postal Service

![Ingame Image](https://github.com/s-macke/Interplanetary-Postal-Service/blob/master/images/IPShigh.png)

This game is my entry to the 2018 [js13kgames](https://js13kgames.com) competition.

# [Play it now!](https://simulationcorner.net/js13kgame/) 

As a postman of the Interplanetary Postal Service your task is to deliver 
precious mails to our distant colonies. This game lets you control a lander module 
on the last miles to the colony. You must not only fight against gravity, 
but also against dangerous winds. Play through 8 uniquely designed levels

Control the game with your arrow keys or with WASD. Press Space to toggle sound.

# Technical Description

Fluid dynamics in a game, that was the goal. Not just a fake one. I wanted it real. Solving the real equations. So far I have only encountered two games with real fluid dynamics. [Plasma Pong](https://en.wikipedia.org/wiki/Plasma_Pong) and [Pixeljunk Shooter](https://en.wikipedia.org/wiki/PixelJunk_Shooter)

Especially the last one is great and had motivated me for this game.

# Webassembly

Once you decide to implement fluid dynamics you need one thing more than anything: speed. To write also tiny code you have to either program directly in the assembler language or use a language with a really small footprint. That language is C without using any libraries. I used the emscripten emcc compiler.

In order to save space and for speed you have to define you own math functions with the desired accuracy. For example the exp function takes needs only a few bytes.

```C
float expf_fast(float a)
{
  union { float f; int x; } u;
  u.x = (int) (12102203 * a + 1064866805);
  return u.f;
}
```

# Fluid

The fluid dynamics is a combination of code and knowledge from 
 * [Nast2D](http://wissrech.ins.uni-bonn.de/research/projects/NaSt2D/index.html) software described in this [book](https://www.amazon.com/Numerical-Simulation-Fluid-Dynamics-Introduction/dp/0898713986)
 * Jos Stam: [Stable Fluids](http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf)
 * Mike Ash: [Stable Fluid dynamics for dummies](https://mikeash.com/pyblog/fluid-simulation-for-dummies.html)
 * Years of interest in fluid dynamics and reading a lot of stuff

It is hard to describe exactly what you have to do here. You have to solve the Navier-Stokes equation on a grid. The grid size here is 256 x 128.

# Graphics

The graphics consists of three layers. The first is the canvas used by the webassembly code. It contains the basic background and the fluid. The second canvas contains the level map and the ship sprite. The third layers is an SVG overlay and shows the text and the velocity and fuel display.

The collision detection was done by drawing a canvas and counting boundary pixels. If the ship overlaps with the boundary, the number of boundary pixels decrease.

# Sound

Sound is extremely easy. You just take white noise and run it through an filter. Wind has a peak frequency 500Hz. Explosion and thrust work at 100Hz with different peak widths.



# Interplanetary Postal Service

![Ingame Image](https://github.com/s-macke/Interplanetary-Postal-Service/blob/master/images/IPShigh.png)

This game is my [entry](https://js13kgames.com/entries/interplanetary-postal-service) to the 2018 [js13kgames](https://js13kgames.com) competition.

The original source for the game entry can be found [here](https://github.com/s-macke/Interplanetary-Postal-Service/tree/js13kgames)

# [Play it now!](https://js13kgames.com/games/interplanetary-postal-service/index.html) 

As a postman of the Interplanetary Postal Service your task is to deliver 
precious mails to our distant colonies. This game lets you control a lander module 
on the last miles to the colony. You must not only fight against gravity, 
but also against dangerous winds. Play through 8 uniquely designed levels

Control the game with your arrow keys or with WASD. Press Space to toggle sound.

# Technical Description

Fluid dynamics in a game, that was the goal. Not just a fake one. I wanted it real. Solving the real equations. So far I had only encountered two games with real fluid dynamics (see below).

Especially the last one is great and had motivated me for this game. Then the decision for a game type was easy. I chose a game from my distant path: Lunar Lander. The game type fits perfectly.

# Webassembly

Once you decide to implement fluid dynamics you need one thing more than anything: speed. To write also tiny code you have to either program directly in the web assembler language or use a language with a really small footprint. That language is C without using any libraries. I used the emscripten emcc compiler and throwed away all Javascript overhead.

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

It is hard to describe exactly what you have to do here. You have to solve the Navier-Stokes equations on a grid. The grid size here is 256 x 128. The compiled fluid dynamics code requires about 3-4kB of compressed space. I simulate 3 colored fluids: The thrust of the ship, the main fluid of the level and the explosions.

# Graphics

The graphics consists of three layers. The first one is the canvas (256 x 128) used by the webassembly code. It contains the basic background and the fluid. The second canvas contains the level map and the ship sprite. The third layers is an SVG overlay and shows the text and the velocity and fuel display.

# Collision

For collision detection I decided for a trivial but pixel perfect technique. The collision detection was done by drawing a canvas and counting the boundary pixels. If the ship sprite overlaps with the boundary, the number of boundary pixels decrease indicating  an collision.

# Map

The map is stored as a bitfield of size 32x17. So each map requires only 68 byte of space. This field is expanded over an gaussian kernel and some random texture on top. Together with trivial lightning you get a pretty decend and cheap level design.
Here is an example of a map. A '*' is a one. A '-' is a zero.

```
********************************
----------------------------****
-----------------------------***
**----------------------------**
**----------------------------**
**--------********------------**
**------***********-----------**
**************----------------**
************-----------------***
************-----------------***
*********------------------*****
-------------------------*******
---------------------***********
-------------------*************
-------------------------*******
*************------------*******
********************************
```

# Sound

Sound is implemented very easy. You just take white noise and run it through an band-filter. Wind has a peak frequency of around 500Hz. Explosion and thrust work at 100Hz with different peak widths.

# Balancing

Balancing the game was the most difficult part. The flow dynamics are not always controllable and the result varies depending on the FPS and your actions. Tiny changes on the algorithms or the free parameters let you redesign and balance all levels again and again.
Although the game is challenging, I usually manage all levels on the first or second try.

# The last 3kB

At the end I realized that even without any massive compression tricks I had 3 kBs of available space left. I tried to introduce a touchpad control for mobiles. But then I realized, that most mobiles simply don't have enough power to run the game. Then I tried to introduce music. But my so called "music" made the experience much worse :-). So I skipped that two options. 
I tried to introduce more levels. You can put 6-10 levels in 3 kB. But then I ran out of time. Polishing surely would have taken another one or two weeks. 

# Other games with fluid dynamics

*  [Plasma Pong](https://en.wikipedia.org/wiki/Plasma_Pong) 
*  [Pixeljunk Shooter](https://en.wikipedia.org/wiki/PixelJunk_Shooter)
*  [Polluted Planet](http://grantkot.com/pollutedplanet/)
*  [Bessel](https://store.steampowered.com/app/108500/Vessel/)
*  [Claybook](https://store.steampowered.com/app/108500/Vessel/)
*  [Noita](https://store.steampowered.com/app/881100/Noita/)
*  [Shoita](http://www.the2bears.com/?page_id=652)
*  [Ichor](https://www.fun-motion.com/physics-games/ichor/)

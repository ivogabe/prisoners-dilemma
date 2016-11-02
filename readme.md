Spatialized Prisoners Dilemma
=============================

Implementation of the experiment of Nowak and May, published as ['The Spatial Dilemmas of Evolution'](https://www.stat.berkeley.edu/~aldous/260-FMIE/Papers/nowak_1993.pdf) in International Journal of Bifurcation and Chaos.

Nice settings
-------------
- `w, h = 49` - all-D after 1140 iterations
- `w, h = 51, 57 or 61` - periodic
- `w, h >= 69` - very long / infinite (?) sequences
- `w = 51, h = 19`

How to build
------------
- Install NodeJS
- Install Typecript (`npm install typescript -g`)
- Run `tsc -p .`
- Open `index.html`

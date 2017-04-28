# Study 5 – Microscopic – A1

In this study the physical and virtual artefacts developed alongside one another. I began with thoughts of cell division, and the intricacies and detail of the human body on a microscopic scale. I wanted to experiment with shaders and GLSL, aiming for a metaball effect to simulate mitosis. I created [a shader](https://codepen.io/pouretrebelle/project/editor/ccd13d57185847e2b61fc48fe597a8a8/AKJBKX/) with a genetic _code_ that could be tweaked to show mutation. It was at this point I began thinking that glass would be a good medium for the physical object as my shader resembled some of my previous experiments with glass and I was drawn to its aesthetics.

As I compared some of my existing glass samples I saw common features in them, and arranged them as a grid where each piece was related to those around it. At this point I stopped seeing the shader as a means to a family tree of genetically-modified results, but likewise as a grid of related materials. In the final iteration of the virtual artefact random setting are selected, and each gem is derived from the gems above and to the left of it, with genetic mutations also preavilant through the grid. I also crafted a new set of glass pieces that transcend colour, size, inclusions, and other parameters visible in the program.

## Setup

This program relies on the http method fetch to get the shader code, and thus can only be run locally with a server. Below are two methods to launch a simple server, depending on having python or php installed respectively.

```
python -m SimpleHTTPServer
php -S localhost:8000
```

After running one of these commands the demo should be visible at [localhost:8000](localhost:8000), alternatively see it running on [Codepen](https://codepen.io/pouretrebelle/project/full/3ca8f0f155cdf231996c36abfee72c56/AkmQqZ/).

## Virtual Artefact screenshots

![Screenshots](/5-microscopic/thumbnails/virtual.jpg?raw=true)

## Physical Artefact

![Photos](/5-microscopic/thumbnails/physical.jpg?raw=true)

## References, Technologies, Materials

[GLSLCanvas library](https://github.com/patriciogonzalezvivo/glslCanvas/) by Patricio Gonzalez Vivo, [WebGL noise library](https://github.com/ashima/webgl-noise) by Ashima Arts and Stefan Gustavson.

Build files generated from [this Codepen project](https://codepen.io/pouretrebelle/project/editor/3ca8f0f155cdf231996c36abfee72c56/AkmQqZ/).

Physical artefacts made from Bullseye glass.

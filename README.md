UdeS CLI
======================

# Introduction
This package is used for npm script. You include the package via your package.json dependencies and all the script 
declare in the bin section of its package.json are available.


# Getting started
## Include in package.json dependencies
`"dependencies": {...
"udes-cli": "0.0.0",
...}`

# Usage
In your package.json script section
## Scripts
`"scripts": {
    "build-dev": "polymer-build", ...}`
    
# Conventions
## organization of code
* The script (bin) must be place under bin and in a sub folder for related utils
Ex. Polymer utils

`bin/polymer/polymer-build.js`

* The scr folder muste content the code executed by the script following a similar structure
Ex. Polymer

`src/polymer/index.js`



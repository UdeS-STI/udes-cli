UdeS CLI
========

[![Greenkeeper badge](https://badges.greenkeeper.io/UdeS-STI/udes-cli.svg)](https://greenkeeper.io/)

[![CircleCI](https://circleci.com/gh/UdeS-STI/udes-cli.svg?style=svg)](https://circleci.com/gh/UdeS-STI/udes-cli)
[![npm](https://img.shields.io/npm/v/udes-cli.svg?style=flat-square)](https://www.npmjs.com/package/udes-cli)
![Node](https://img.shields.io/badge/node-6.10.1-brightgreen.svg)

# Introduction
This package contains Command Line Interface tools for automated certain
development tasks. Once installed the included scripts can be added to your
`package.json`.

# Prerequisites
* [Node](https://nodejs.org) 6.10.1 or above (it is recommended to install it via
[NVM](https://github.com/creationix/nvm))

# Getting started
## Installation
If you want to test or develop on the library simply run these commands
```bash
git clone git@github.com:UdeS-STI/udes-cli.git
cd udes-cli
npm install
# Allows using the CLI directly within the package for testing.
ln -s `pwd` node_modules/udes-cli
```

## Add to project
If you want to add the library to your project simply run
```bash
npm install udes-cli -g --save
```

Then, in the `script` section of your `package.json` you can add the commands
from the library
```json
{
  "scripts": {
    "build": "udes polymer-build -u=dir --buildName=bundled --rewriteBuildDev"
  }
}
```

# Usage
## Command Line
```bash
npm run udes polymer-build -- --rootURI /path/to/project
``` 

# Documentation
TODO

# Contributing
## Structure
```
.
├── bin
|   └── udes (CLI entry point)
├── dist 
|   └── transpiled (es5) source files
└── src
    ├── UdeSCLI (main class, handles all CLI requests)
    ├── lib (utility files)
    └── polymer
        └── polymer source files
```
* Source files must be added to the `src` directory.
* The `dist` directory contains files built from `babel-cli`.

## Style
You must use the following guides:
* [UdeS JavaScript Style Guide](https://www.npmjs.com/package/eslint-config-udes)
* [StandardJS](https://standardjs.com/)
* [JSdoc](http://usejsdoc.org/)

This project contains a linting config, you should setup `eslint` into your
editors with `.eslintrc.js`.

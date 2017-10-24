UdeS CLI
========

[![CircleCI](https://circleci.com/gh/UdeS-STI/udes-cli/tree/master.svg?style=svg&circle-token=04015d40678b6aab6829a79ca2951bd9dccf7808)](https://circleci.com/gh/UdeS-STI/udes-cli/tree/master)
[![npm](https://img.shields.io/npm/v/udes-cli.svg?style=flat-square)](https://www.npmjs.com/package/udes-cli)
![Node](https://img.shields.io/badge/node-6.10.1-brightgreen.svg)

# Introduction
This package contains Command Line Interface tools for automated certain
development tasks. Once installed the included scripts can be added to your `package.json`.

# Prerequisites
* [Node](https://nodejs.org) 6.10.1 (it is recommended to install it via
[NVM](https://github.com/creationix/nvm))
* Ensure you have a development environment setup to use the orchestrator.
Since it uses a socket you cannot run it on a local machine.

# Getting started
## Installation
```bash
npm install udes-cli
```

## Add to project
In the `script` section of your `package.json`
```json
{
  "scripts": {
    "polymer-build-dev": "polymer-build --buildName=es5-bundled --rewriteBuildDev"
  }
}
```

# Usage
## Command Line
```bash
npm run polymer-build-dev -- --rootURI /path/to/project
``` 

# Documentation
TODO

# Contributing
## Structure
```
.
├── bin
|   └── polymer
|       └── polymer scripts
├── dist
|   └── transpiled (es5) source files
└── src
    └── polymer
        └── polymer source files
```
* Scripts must be added to `bin` directory in a related sub-directory.
* Source files must be added to the `src` directory.
* The `dist` directory contains files built from `babel-cli`.

## Style
You must use the following guides:
* [UdeS JavaScript Style Guide](https://www.npmjs.com/package/eslint-config-udes)
* [StandardJS](https://standardjs.com/)
* [JSdoc](http://usejsdoc.org/)

This project contains a linting config, you should setup `eslint` into your
editors with `.eslintrc.js`.

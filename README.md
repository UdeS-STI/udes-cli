UdeS CLI
========

[![npm](https://img.shields.io/npm/v/udes-cli.svg?style=flat-square)](https://www.npmjs.com/package/udes-cli)

# Introduction
This package contains Command Line Interface tools for automated certain
development tasks. Once installed the included scripts can be added to your `package.json`.

# Getting started
## Installation
```bash
npm install udes-cli
```

## Add to project
In the `script` section of your `package.json`
```json
"scripts": {
  "polymer-build-dev": "polymer-build --buildName=es5-bundled --rewriteBuildDev"
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

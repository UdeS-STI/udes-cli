UdeS CLI
========

[![Greenkeeper badge](https://badges.greenkeeper.io/UdeS-STI/udes-cli.svg)](https://greenkeeper.io/)
[![CircleCI](https://circleci.com/gh/UdeS-STI/udes-cli.svg?style=svg)](https://circleci.com/gh/UdeS-STI/udes-cli)
[![npm](https://img.shields.io/npm/v/udes-cli.svg?style=flat-square)](https://www.npmjs.com/package/udes-cli)
![Node](https://img.shields.io/badge/node-6.10.1-brightgreen.svg)
[![NSP Status](https://nodesecurity.io/orgs/udes-sti/projects/a84effa1-1302-420c-92fa-c7d772a60833/badge)](https://nodesecurity.io/orgs/udes-sti/projects/a84effa1-1302-420c-92fa-c7d772a60833)

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
    "build": "udes polymer-build -u /dir/ --buildNames bundled -ac",
    "format": "udes format .",
    "install": "udes bower install",
    "lint": "udes lint .",
    "lock": "udes bower lock",
    "status": "udes bower status",
    "unlock": "udes bower unlock",
    "validate": "udes bower validate"
  }
}
```

# Usage
## Command Line
```bash
npm run udes bower install bower-package --save
npm run udes format .
npm run udes lint .
npm run udes polymer-build --baseURI /path/to/project/
``` 

# Documentation
TODO

# Contributing
## Style
You must use the following guides:
* [UdeS JavaScript Style Guide](https://www.npmjs.com/package/eslint-config-udes)
* [StandardJS](https://standardjs.com/)
* [JSdoc](http://usejsdoc.org/)

This project contains a linting config, you should setup `eslint` into your
editors with `.eslintrc.js`.

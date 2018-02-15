#! /usr/bin/env node
const UdeSCLI = require('../dist/UdeSCLI').default;

// Command is always at index 2 when used as `udes polymer-build --args`
const COMMAND = 2;
const cli = new UdeSCLI();
cli.run(process.argv[COMMAND]);

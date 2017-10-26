#! /usr/bin/env node
const UdeSCLI = require('../dist/UdeSCLI').default

const cli = new UdeSCLI()
// Command is always at index 2 when used as `udes polymer-build --args`
cli.run(process.argv[2])

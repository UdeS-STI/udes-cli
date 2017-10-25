#! /usr/bin/env node
const UdeSCLI = require('../dist/UdeSCLI').default

const cli = new UdeSCLI()
cli.run(process.argv[2])

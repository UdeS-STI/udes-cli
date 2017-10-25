#! /usr/bin/env node
const UdeSCLI = require('../dist/UdeSCLI').default

const cli = new UdeSCLI(process.argv[2])
cli.run()

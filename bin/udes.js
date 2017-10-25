#! /usr/bin/env node
const UdeSCLI = require('../dist/UdeSCLI').default
const getArguments = require('../dist/lib/utils').getArguments

const cli = new UdeSCLI()
cli.run(process.argv[2], getArguments())

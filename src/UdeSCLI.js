import yargs from 'yargs'

import PolymerBuild from './polymer/PolymerBuild'

/**
 *
 */
export default class UdeSCLI {
  help = () => {
    this.argv = yargs.usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]')
      .command('polymer-build', 'Build a repo for release')
      .help('h')
      .alias('h', 'help')
      .argv
  }

  run = (command, args) => {
    let commandInstance

    switch (command) {
      case 'polymer-build':
        commandInstance = new PolymerBuild(args)
        commandInstance.run()
        break
      default:
        this.help()
    }
  }
}

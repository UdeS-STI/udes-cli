import childProcess from 'child_process'
import fs from 'fs'
import yargs from 'yargs'

import { udesLogger } from 'udes-logger'

/**
 * @class
 */
export default class Publish {
  constructor (args) {
    if (!args) {
      this.validateArgv()
    } else if (!args.type || !this.isValidType(args.type)) {
      throw new Error('Please provide valid type argument to publish')
    }

    this.args = this.formatArguments(args || this.argv)
  }

  static RELEASE_TYPES = {
    MAJOR: 'major',
    MINOR: 'minor',
    PATCH: 'patch',
    PREMAJOR: 'premajor',
    PREMINOR: 'preminor',
    PREPATCH: 'prepatch',
    PRERELEASE: 'prerealease',
  }

  checkoutMaster = async () => {
    await this.exec('git fetch')
    await this.exec('git checkout master && git pull origin master')
    await this.exec('npm install')
  }

  bumpVersion = async () => {
    await this.updatePackageInfo()
    const { version } = this.packageInfo

    await this.exec(`git checkout -b bump-version-v${version}`)
    await this.exec(`git commit -am'Bump version to v${version}'`)
    await this.exec(`git push origin bump-version-v${version}`)
    await this.exec(`git tag v${version} && git push origin --tags`)
  }

  updatePackageInfo = async () => {
    await this.exec(`npm version ${this.args.type} --no-git-tag-version`)
    this.setPackageInfo()
  }

  publishToNpm = async () => {
    if (this.packageInfo.scripts.build) {
      await this.exec('npm run build')
      // TODO: Update `main` entry in package.json
    }

    await this.exec('npm publish')
    await this.exec('git reset --hard')
  }

  updateDocumentation = async () => {
    const { version } = this.packageInfo

    if (this.packageInfo.scripts.documentation) {
      await this.exec('git checkout gh-pages && git pull origin gh-pages')
      await this.exec(`git merge bump-version-v${version} --strategy-option theirs --no-commit`)
      await this.exec('npm run documentation')
      await this.exec(`git commit -am'Update documentation for v${version}'`)
      await this.exec('git push origin gh-pages')
    }
  }

  /**
   * Execute code for building polymer project.
   */
  run = async () => {
    this.setPackageInfo()

    if (await this.canPublish()) {
      try {
        await this.checkoutMaster()
        await this.bumpVersion()
        // await this.publishToNpm()
        await this.updateDocumentation()

        const { name, version } = this.packageInfo
        console.log(`\nPublished ${name}@${version} successfully`)
      } catch (error) {
        console.log(error)
      }
    }
  }

  exec = command => new Promise((resolve, reject) => {
    console.log(`executing '${command}'`)
    childProcess.exec(command, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

  setPackageInfo = () => {
    this.packageInfo = JSON.parse(`${fs.readFileSync('package.json')}`)
  }

  canPublish = async () => {
    const { audit, lint, test } = this.packageInfo.scripts

    try {
      await !lint || this.exec('npm run lint')
      await !audit || this.exec('npm run audit')
      await !test || this.exec('npm run test')
      return true
    } catch (error) {
      udesLogger.error(error)
      return false
    }
  }

  /**
   * Validate CLI arguments.
   */
  validateArgv = () => {
    this.argv = yargs
      .usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]')
      .option('type', {
        alias: 't',
        describe: 'Type of release',
        choices: Object.values(Publish.RELEASE_TYPES),
      })
      .demandOption(['type'], 'Please provide --type argument to publish')
      .help('h')
      .alias('h', 'help')
      .argv
  }

  isValidType = type => Object.values(Publish.RELEASE_TYPES).includes(type)

  /**
   * @private
   * @param args
   * @returns {*}
   */
  formatArguments = (args) => {
    return {
      type: args.type,
    }
  }
}

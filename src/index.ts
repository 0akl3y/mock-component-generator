import { Command, flags } from '@oclif/command'

import { generateMocksInDir } from './fileOperations'

class MockGenerator extends Command {
  static description = 'Generate mocks from all tsx files in the folder'

  static args = [
    {
      name: 'glob',
      description: 'File path',
      default: process.cwd(),
    },
  ]

  static flags = {
    keepImports: flags.boolean({ char: 'i' }),
    keepTSTypes: flags.boolean({ char: 't' }),
  }

  async run() {
    const { args, flags } = this.parse(MockGenerator)
    this.log(`Generating mock files`)
    generateMocksInDir(args.glob, flags)
  }
}

export = MockGenerator

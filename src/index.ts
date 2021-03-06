import { Command, flags } from '@oclif/command'

import { generateMocksInDir } from './fileOperations'

class MockGenerator extends Command {
  static description = 'Generate mocks from all tsx files in the folder'

  static flags = {
    keepImports: flags.boolean({ char: 'i' }),
    keepTSTypes: flags.boolean({ char: 't' }),
  }

  async run() {
    const { flags } = this.parse(MockGenerator)
    this.log(`Generating mock files`)
    generateMocksInDir(process.cwd(), flags)
  }
}

export = MockGenerator

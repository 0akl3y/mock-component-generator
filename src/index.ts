import { Command, flags } from "@oclif/command";

import { generateMocksInDir } from "./fileOperations";

class MockGenerator extends Command {
  static description = "Generate mocks from all tsx files in the folder";

  static flags = {
    // add --version flag to show CLI version
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: "n", description: "mockGenerator" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" }),

    removeImports: flags.boolean({ char: "i" }),
    removeTypes: flags.boolean({ char: "t" }),
  };

  static args = [{ name: "file", removeImport: true }];

  async run() {
    const { args, flags } = this.parse(MockGenerator);
    this.log(`Generating mock files`);
    generateMocksInDir(__dirname);
  }
}

export = MockGenerator;

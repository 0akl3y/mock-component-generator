/* eslint-disable @typescript-eslint/no-var-requires */

import { generateMocksInDir } from '../fileOperations'

const fs = require('fs')

const mockFolderPath = `${__dirname}/__mockFilesystem__/__mocks__`

describe('fileOperations', () => {
  beforeAll(() => {
    fs.rmdirSync(mockFolderPath, { force: true, recursive: true })
  })

  it('walks generates mock files for all existing files in the dir', async () => {
    await generateMocksInDir(`${__dirname}/__mockFilesystem__`)

    const mockFiles: string[] = fs.readdirSync(mockFolderPath, {
      encoding: 'utf-8',
    }) as string[]

    mockFiles.forEach((mFile) => {
      const newContent = fs.readFileSync(`${mockFolderPath}/${mFile}`, {
        encoding: 'utf-8',
      })

      expect(newContent).toMatchSnapshot()
    })
  })
})

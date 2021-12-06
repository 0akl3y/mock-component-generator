/* eslint-disable @typescript-eslint/no-var-requires */

import { generateMocksInDir } from '../fileOperations'

const fs = require('fs')

const mockFolderPath = `${__dirname}/__mockFilesystem__/__mocks__`

describe('fileOperations', () => {
  beforeEach(() => {
    fs.rmdirSync(mockFolderPath, { force: true, recursive: true })
  })

  it('generate the files for the absolute path', async () => {
    await generateMocksInDir(`${__dirname}/__mockFilesystem__/*`)

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

  it('generates files for the glob', async () => {
    await generateMocksInDir(`**/SomeOtherThing.*`)

    const mockFiles: string[] = fs.readdirSync(mockFolderPath, {
      encoding: 'utf-8',
    }) as string[]

    expect(mockFiles.length).toEqual(1)
    expect(mockFiles[0]).toEqual('SomeOtherThing.ts')
  })
})

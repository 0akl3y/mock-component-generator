import { Glob } from 'glob'
import { generateMock, MockGeneratorOptions } from './generateMocks'
const glob = require('glob')
const path = require('path')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// const path = require("path");

const mockFolderExists = (dir: string) => {
  try {
    fs.readdirSync(`${dir}/__mocks__`, {
      encoding: 'utf-8',
    })
    return true
  } catch {
    return false
  }
}

const mockFileExists = (dir: string, filenanme: string) => {
  try {
    const mockFiles: string[] = fs.readdirSync(`${dir}/__mocks__`, {
      encoding: 'utf-8',
    })
    return mockFiles.includes(filenanme)
  } catch {
    return false
  }
}

export async function generateMocksInDir(
  file: string,
  options?: MockGeneratorOptions
) {
  const files = glob.sync(file)

  files.forEach((f) => {
    const fullPath = path.relative(process.cwd(), f)
    const currPath = path.dirname(fullPath)

    const currFile = path.basename(fullPath)
    if (!mockFolderExists(currPath)) {
      fs.mkdirSync(`${currPath}/__mocks__`)
    }
    const content = fs.readFileSync(`${f}`, {
      encoding: 'utf-8',
    })
    const mockContent = generateMock(content, options)

    //It should not overwrite existing mocks
    if (!mockFileExists(file, f) && mockContent) {
      fs.writeFileSync(`${currPath}/__mocks__/${currFile}`, mockContent, {
        encoding: 'utf-8',
      })
    }
  })
}

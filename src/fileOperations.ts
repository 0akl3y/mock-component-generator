import { generateMock } from "./generateMocks";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// const path = require("path");

const mockFolderExists = (dir: string) => {
  try {
    fs.readdirSync(`${dir}/__mocks__`, {
      encoding: "utf-8",
    });
    return true;
  } catch {
    return false;
  }
};

const mockFileExists = (dir: string, filenanme: string) => {
  try {
    const mockFiles: string[] = fs.readdirSync(`${dir}/__mocks__`, {
      encoding: "utf-8",
    });
    return mockFiles.includes(filenanme);
  } catch {
    return false;
  }
};

export async function generateMocksInDir(dir: string) {
  const files = fs.readdirSync(dir);
  const tsxFiles = files.filter((file: string) => file.match(/\.tsx/));

  if (!mockFolderExists(dir)) {
    fs.mkdirSync(`${dir}/__mocks__`);
  }

  tsxFiles.forEach((tsxFile: string) => {
    const content = fs.readFileSync(`${dir}/${tsxFile}`, {
      encoding: "utf-8",
    });
    const mockContent = generateMock(content);

    //It should not overwrite existing mocks
    if (!mockFileExists(dir, tsxFile)) {
      fs.writeFileSync(`${dir}/__mocks__/${tsxFile}`, mockContent, {
        encoding: "utf-8",
      });
    }
  });
}

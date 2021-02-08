import { generateMock } from "./generateMocks";

const fs = require("fs");
const path = require("path");

export async function walk(dir: string) {
  const files = fs.readdirSync(dir);
  const tsxFiles = files.filter((file) => file.match(/\.tsx/));
  console.log(tsxFiles);
  const content = fs.readFileSync(`${dir}/${tsxFiles[0]}`, {
    encoding: "utf-8",
  });
  return generateMock(content);
}

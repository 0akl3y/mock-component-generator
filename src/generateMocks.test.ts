import { generateMock } from "./generateMocks";

const code = `
import Stuff from '@/some-stuff'
import Blah from '@/some-blah'
import { Blub } from '@/some-blub'

export const SomeComponent = (props) => {
  return <Row />
}

export function someFunction() {
  return () => 'foo'
}
`;

describe("generateMocks", () => {
  it("replaces the import statement with only react", () => {
    const input = `
    import Stuff from '@/some-stuff'
    import Blah from '@/some-blah'
    import { Blub } from '@/some-blub'
    `;

    expect(generateMock(input).code).toEqual("import React from 'React'");
  });
  it("parses the example correctly", () => {
    expect(generateMock(code)).toBeTruthy();
  });
});

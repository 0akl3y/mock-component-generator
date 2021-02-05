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
  it.skip("replaces the import statement with only react", () => {
    const input = `
    import Stuff from '@/some-stuff'
    import Blah from '@/some-blah'
    import { Blub } from '@/some-blub'

    const someOtherCode;
    `;
    expect(generateMock(input).code).toEqual(
      "import React from 'react'\nconst someOtherCode;"
    );
  });

  describe("functional components", () => {
    it("mocks functional components of different sort", () => {
      const input = `
      export const same = 'the same procedure as every year'
      export const shortComponent = props => <SomeView />
      export const parans = (props) => (<SomeViewInParans />)
      export const braced = (props) => {return (<SomeBracedView />)}
      export const someFunction = props => 'Remains the same'      
      `;
      expect(generateMock(input).code).toMatchSnapshot();
    });

    it("removes non exported components", () => {
      const input = `
      const _internalComponent = props => <SomeInternalComponent />      
      const _privateFN = () => 'should not show'
      export const externalComponent = props => <SomeExternalComponent />            
      `;

      expect(generateMock(input).code).toMatchSnapshot();
    });

    it.skip("mocks functional components", () => {
      const input = `
      import React from 'react'
      import {Row} from 'superuiguide'
  
      const someStuff
  
      
      const curly = (input) => ('braces')
      const someOtherFunction = (input) => {return input + 1}
      
      export const SomeComponent = (props) => {
        return <Row />
      }
      `;
      console.log(generateMock(input));
      expect(generateMock(input)).toBeTruthy();
    });
  });
});

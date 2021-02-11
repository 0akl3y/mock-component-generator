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
    expect(generateMock(input)).toEqual(
      "import React from 'react'\nconst someOtherCode;"
    );
  });

  describe("components", () => {
    it.skip("mocks functional components of different sort", () => {
      const input = `
      export const same = 'the same procedure as every year'
      export const shortComponent = props => <SomeView />
      export const parans = (props: {id: string}) => (<SomeViewInParans />)
      export const braced = (props: {id: string}) => {return (<SomeBracedView />)}
      export const someFunction = props => 'Remains the same'      
      `;
      expect(generateMock(input)).toMatchSnapshot();
    });

    it.skip("removes non exported components", () => {
      const input = `
      const _internalComponent = props => <SomeInternalComponent />      
      const _privateFN = () => 'should not show'
      export const externalComponent = props => <SomeExternalComponent />            
      `;
      expect(generateMock(input)).toMatchSnapshot();
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
      expect(generateMock(input)).toMatchSnapshot();
    });

    it.skip("mocks non component functions with jest.fn", () => {
      const input = `
      export const function1 = (args: string[]) => { return 'function 1'}
      export const function2 = args => 'function 2'
      export const function3 = (args:string) => ('function 3')
      `;
      expect(generateMock(input)).toMatchSnapshot();
    });

    it.skip("mocks functions", () => {
      const input = `
      export function fn1(args) {
         return 'fn1'
      }

      export function FnComponent(props: {foo: string}) {
        return <Row />
      }
      
      `;
      expect(generateMock(input)).toMatchSnapshot();
    });

    it("removes comments", () => {
      const input = `
      // This is some unneccessary comment
      /*
        Once upon a time... blah blah blah      
      */
      export const function2 = args => 'function 2'
      
      `;
      expect(generateMock(input)).toMatchSnapshot();
    });
  });
});

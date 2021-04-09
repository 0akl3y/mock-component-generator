import { generateMock } from './generateMocks'

describe('generateMocks', () => {
  it('replaces the import statement with only react', () => {
    const input = `
    import Stuff from '@/some-stuff'
    import Blah from '@/some-blah'
    import { Blub } from '@/some-blub'

    let someOtherCode
    `
    expect(generateMock(input)).toEqual("import React from 'react'\n")
  })

  describe('components', () => {
    it('mocks functional components of different sort', () => {
      const input = `
      import {SomeView, SomeViewInParans, SomeBracedView} from 'fantasien'
      
      export const same = 'the same procedure as every year'
      export const shortComponent = props => <SomeView />
      export const parans = (props: {id: string}) => (<SomeViewInParans />)
      export const braced = (props: {id: string}) => {return (<SomeBracedView />)}
      export const someFunction = props => 'Remains the same'      
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('removes non exported components', () => {
      const input = `
      import {SomeInternalComponent, SomeExternalComponent} from 'fantasien'
      const _internalComponent = props => <SomeInternalComponent />      
      const _privateFN = () => 'should not show'
      export const externalComponent = props => <SomeExternalComponent />            
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('mocks functional components', () => {
      const input = `
      import React from 'react'
      import {Row} from 'superuiguide'
      const someStuff
        
      const curly = (input) => ('braces')
      const someOtherFunction = (input) => {return input + 1}
      
      export const SomeComponent = (props) => {
        return <Row />
      }
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('mocks non component functions with jest.fn', () => {
      const input = `
      export const function1 = (args: string[]) => { return 'function 1'}
      export const function2 = args => 'function 2'
      export const function3 = (args:string) => ('function 3')
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('mocks functions', () => {
      const input = `
      export function fn1(args) {
         return 'fn1'
      }

      export function FnComponent(props: {foo: string}) {
        return <Row />
      }
      
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('removes comments', () => {
      const input = `
      // This is some unneccessary comment
      /*
        Once upon a time... blah blah blah      
      */
      export const function2 = args => 'function 2'
      
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('mocks class component', () => {
      const input = `
      import React from "react";
      export class SomeClassComponent extends React.PureComponent<{ name: string }> {
        render() {
          return <h1>Hello, {this.props.name}</h1>;
        }
      }
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('mocks default class component', () => {
      const input = `
      import React from "react";
      export default class SomeClassComponent extends React.PureComponent<{ name: string }> {
        render() {
          return <h1>Hello, {this.props.name}</h1>;
        }
      }
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('mocks referenced default class component', () => {
      const input = `
      import React from "react";
      class SomeClassComponent extends React.PureComponent<{ name: string }> {
        render() {
          return <h1>Hello, {this.props.name}</h1>;
        }
      }
      export default SomeClassComponent
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('removes typescript', () => {
      const input = `
      import React from "react";
      export const parans = (props: {id: string}) => (<SomeViewInParans />)
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('handles export default correctly', () => {
      const input = `
      import React from 'react'
      import {Row} from 'superuiguide'
      const someStuff
        
      const curly = (input) => ('braces')
      const someOtherFunction = (input) => {return input + 1}
      
      const SomeComponent = (props) => {
        return <Row />
      }

      export default SomeComponent
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('handles direct export defaults correctly', () => {
      const input = `
      import React from 'react'
      import {Row} from 'superuiguide'
      const someStuff
                  
      export default (props) => {
        return <Row />
      }
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('handles export wrapped in higher order function', () => {
      const input = `
      import React from 'react'
      import {Row} from 'superuiguide'
      let someStuff

      const SomeComponent = (props) => {
        return <Row />
      }
                  
      export default React.memo(SomeComponent)
      `
      expect(generateMock(input)).toMatchSnapshot()
    })

    it('handles styled components', () => {
      const input = `
      import React from 'react'
      
      import {Row} from 'superuiguide'
      const someStuff

      const Thing = styled.View\`
        background-color: black;      
      \`

      export const SomeComponent = (props) => {
        return <Thing />
      }                  
      
      `
      expect(generateMock(input)).toMatchSnapshot()
    })
  })

  it('handles ExportNamedDeclarations', () => {
    const input = `
    import React from 'react'
    
    import {Row} from 'superuiguide'
    const someStuff

    const Thing = styled.View\`
      background-color: black;      
    \`

    const A = (props) => {
      return <Thing />
    }                  

    const B = (props) => {
      return <Thing />
    }

    export {A, B}
    
    `
    expect(generateMock(input)).toMatchSnapshot()
  })
})

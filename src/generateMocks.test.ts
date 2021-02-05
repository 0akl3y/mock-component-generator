import { generateMock } from './generateMocks'

const code = `
import Stuff from '@/some-stuff'
import Blah from '@/some-blah'
import { Blub } from '@/some-blub'

export const SomeComponent = (props) => {
  return <View />
}

export function someFunction() {
  return () => 'foo'
}
`;

describe('runExample', () => {
  it('parses the example correctly', () => {    
    expect(generateMock(code)).toBeTruthy()
  })
})
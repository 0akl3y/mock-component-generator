import {parseExample} from './generateMocks'


describe('parseExample', () => {
  it('parses the example', () => {
    console.log(parseExample())
    expect(parseExample()).toBeTruthy()
  })
})
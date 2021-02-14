mock-component-generator
=============

Generate a `__mock__` folder with mocks for all tsx files within the folder.
Per default Existing `__mocks__` will not be overwritten.
Currently all components (class and functional) will be mocked as function.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/mockGenerator.svg)](https://npmjs.org/package/mockGenerator)
[![Downloads/week](https://img.shields.io/npm/dw/mockGenerator.svg)](https://npmjs.org/package/mockGenerator)
[![License](https://img.shields.io/npm/l/mockGenerator.svg)](https://github.com/0akl3y/mock-component-generatorr/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Options](#options)
* [Example](#example)
<!-- tocstop -->

# Usage
<!-- usage -->
```sh-session
$ npm install -g mockGenerator
$ cd my-folder
$ generateMockComponents
...generate mocks for all umocked jsx and tsx files in the current folder
```
<!-- usagestop -->

# Options
<!-- options -->

`--keepImports (-i)`: Keep the imports. Default is false

`--keepTSType (-t)`: Keep the TS-Types. Default is false 

<!-- optionsstop -->

# Example. 
<!-- example -->
Running generateMockComponents in 
```
|- ComponentA.tsx
|- ComponentB.jsx
|- OtherStuff.ts
```
will result in
```
|- __mocks__
  |- ComponentA.tsx
  |- ComponentB.jsx

|- ComponentA.tsx
|- ComponentB.jsx
|- OtherStuff.ts
```

where

```typescript 
import React from 'react'
import { foo } from 'bar'

export const HelloComponent = (props: { name: string }) => (
  <div>
    <p>`${name}`</p>
  </div>
)
```
will be mocked like:

```typescript 
import React from 'react'
export const HelloComponent = (props) => React.createElement('HelloComponent', props)
```

<!-- examplestop -->






# mock-component-generator

Generate a `__mock__` folder with mocks for all jsx and tsx files that match the glob.
Per default existing `__mocks__` will not be overwritten.
Currently all components (class and functional) will be mocked as function.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/mock-component-generator.svg)](https://www.npmjs.com/package/mock-component-generator)
[![Downloads/week](https://img.shields.io/npm/dw/mock-component-generator.svg)](https://www.npmjs.com/package/mock-component-generator)
[![License](https://img.shields.io/npm/l/mock-component-generator.svg)](https://github.com/0akl3y/mock-component-generatorr/blob/master/package.json)

<!-- toc -->

- [Usage](#usage)
- [Options](#options)
- [Example.](#example)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g mock-component-generator
$ cd my-folder
$ generateMockComponents **/foo/bar.*
...generating mocks
```

<!-- usagestop -->

# Options

<!-- options -->

`--keepImports (-i)`: Keep the imports. Default is false

`--keepTSTypes (-t)`: Keep the TS-Types. Default is false

<!-- optionsstop -->

# Example.

<!-- example -->

Running

```
generateMockComponents **/foo.*
```

in

```
|- foo.tsx
|- ComponentA.tsx
|- ComponentB.jsx
|- OtherStuff.ts

|- subfolder
  |- foo.js

```

will result in

```
|- __mocks__
  |- foo.tsx


|- ComponentA.tsx
|- ComponentB.jsx
|- OtherStuff.ts

|- subfolder
  |- __mocks__
    |- foo.js
  |- foo.js

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

will be mocked like

```typescript
import React from 'react'
export const HelloComponent = (props) =>
  React.createElement('HelloComponent', props)
```

<!-- examplestop -->

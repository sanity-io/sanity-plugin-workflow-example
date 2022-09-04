# sanity-plugin-workflow

## Installation

```
npm install --save sanity-plugin-workflow
```

or

```
yarn add sanity-plugin-workflow
```

## Usage

Add it as a plugin in sanity.config.ts (or .js):

```js
 import {createConfig} from 'sanity'
 import {workflow} from 'sanity-plugin-workflow'

 export const createConfig({
    // all other settings ...
     plugins: [
         workflow({
            // Required
            schemaTypes: [],
            // Optional
            states: [],
         })
     ]
 })
```

## License

MIT © Simeon Griggs
See LICENSE

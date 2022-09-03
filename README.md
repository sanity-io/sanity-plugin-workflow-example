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

```
 import {createConfig} from 'sanity'
 import {myPlugin} from 'sanity-plugin-workflow'

 export const createConfig({
     /...
     plugins: [
         myPlugin({})
     ]
 })
```
## License

MIT © Simeon Griggs
See LICENSE
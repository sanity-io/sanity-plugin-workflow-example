> This is a **Sanity Studio v3** plugin.

# sanity-plugin-workflow

With Sanity Studio you can [customize your content tools to support arbitrary workflows like assignment and content pipelines](https://www.sanity.io/docs/custom-workflows).
This plugin includes a reference implementation of these customization APIs as an example of how this can be done.

This work is currently in **beta** and the aim is to implement previous workflows examples in V3 plugin form for those who do not wish to further customize, or as example code to show how these customizations are done.

## Installation

```
npm install --save sanity-plugin-workflow@beta
```

or

```
yarn add sanity-plugin-workflow@beta
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
            // Required, list of document type names
            // schemaTypes: ['article', 'product'],
            schemaTypes: [],
            // Optional, see type definitions for the structure of these
            states: [],
         })
     ]
 })
```

## License

[MIT](LICENSE) © Sanity.io


## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/sanity-plugin-workflow/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

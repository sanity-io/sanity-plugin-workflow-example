# Sanity Workflow Demo Plugin Example

With Sanity Studio you can [customize your content tools to support arbitrary workflows like assignment and content pipelines](https://www.sanity.io/docs/custom-workflows).

This plugin is distributed as a **reference implementation** of these customization APIs and is not considered to be a feature-complete implementation of what workflow management requires in production. It is a starting point intended to be forked and customized to the needs of your organization and content creators.

## Features

This work demonstrates how a single plugin can define:

- A unique schema to handle workflow metadata
- Document Actions to promote and demote documents through the workflow
- Document Badges for visual feedback about the current state of a document
- A custom Tool for drag-and-drop updating of a document's state

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

## Configuring "States"

The plugin comes with a default set of five "States". These are tracked by the plugin creating a separate "metadata" document for each document in the workflow. 

Documents can be promoted and demoted in the workflow with the provided Document Actions as well as a drag-and-drop interface. The settings below are not enforced by the API, custom access control rules could be used to enforce them. 

```ts
{
    // Required configuration
    id: 'inReview',
    title: 'In Review',
    // Optional settings:
    // Will un/publish the Document when moved to this State
    operation: 'publish', // or 'unpublish'
    // Used for the color of the Document Badge
    color: 'success',
    // Will enable document actions and drag-and-drop for only users with these Role
    roles: ['publisher', 'administrator'],
    // Requires the user to be "assigned" in order to update to this State
    requireAssignment: true,
    // Defines which States a document can be moved to from this one
    transitions: ['changesRequested', 'approved']
}
```

## License

[MIT](LICENSE) © Sanity.io

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hot reload in the studio.

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/sanity-plugin-workflow/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run the release on any branch.

<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.0-beta.7](https://github.com/sanity-io/sanity-plugin-workflow/compare/v1.0.0-beta.6...v1.0.0-beta.7) (2023-04-05)

### Features

- explainer text on 'complete' button ([b0bb891](https://github.com/sanity-io/sanity-plugin-workflow/commit/b0bb89174be09fd91b9ec829a3ecdb2516f9f603))
- hide schema filters if there is only one ([f19923a](https://github.com/sanity-io/sanity-plugin-workflow/commit/f19923ab0ca4c5997a9fea678880ba4eed72bf36))
- prevent dragging until patch is completed ([c71b768](https://github.com/sanity-io/sanity-plugin-workflow/commit/c71b76841c6ca553081bdbea905d5e60de1b068e))

### Bug Fixes

- more predictable orderRank generation ([05ccd4b](https://github.com/sanity-io/sanity-plugin-workflow/commit/05ccd4bea5ef031b380c3f1d0a1dab9b595ee0fc))
- unique ordering ([731d012](https://github.com/sanity-io/sanity-plugin-workflow/commit/731d0122ad68b8f90541bd306dbde74dc6fe7ced))

## [1.0.0-beta.6](https://github.com/sanity-io/sanity-plugin-workflow/compare/v1.0.0-beta.5...v1.0.0-beta.6) (2023-04-04)

### Bug Fixes

- add document count and increase overscan ([14bff13](https://github.com/sanity-io/sanity-plugin-workflow/commit/14bff1322f78de4b0b1f91c3ec8a5e7146722064))
- remove ifRevisionId restriction on patches ([0fa24b5](https://github.com/sanity-io/sanity-plugin-workflow/commit/0fa24b52b82d50486bd5e008f478ff076865ccbe))

## [1.0.0-beta.5](https://github.com/sanity-io/sanity-plugin-workflow/compare/v1.0.0-beta.4...v1.0.0-beta.5) (2023-03-29)

### Features

- requireValidation option for performance ([f676dc9](https://github.com/sanity-io/sanity-plugin-workflow/commit/f676dc9f85d92c7ca7e17de50b48f3a97482bf74))

### Bug Fixes

- ordering error bug ([90a331a](https://github.com/sanity-io/sanity-plugin-workflow/commit/90a331a580c5f40a0aa9b7bfa4868ba0393a3ccb))

## [1.0.0-beta.4](https://github.com/sanity-io/sanity-plugin-workflow/compare/v1.0.0-beta.3...v1.0.0-beta.4) (2023-03-21)

### Features

- add orphan metadata removal ([9e3adb0](https://github.com/sanity-io/sanity-plugin-workflow/commit/9e3adb09f9088299362b7a3f8594e7089d2ae193))
- virtualised lists ([9c8d1bd](https://github.com/sanity-io/sanity-plugin-workflow/commit/9c8d1bd10022cdd933b4c1fba88b3580e2e7e132))

## [1.0.0-beta.3](https://github.com/sanity-io/sanity-plugin-workflow/compare/v1.0.0-beta.2...v1.0.0-beta.3) (2023-03-20)

### Features

- add lexorank ordering ([39bdd94](https://github.com/sanity-io/sanity-plugin-workflow/commit/39bdd944552097a3b31782e23b0553a9ab31bb5a))
- add searchable user filter ([6d39404](https://github.com/sanity-io/sanity-plugin-workflow/commit/6d3940495ff40e70c952daf3f680a773e2606970))

### Bug Fixes

- document actions logic ([986cee6](https://github.com/sanity-io/sanity-plugin-workflow/commit/986cee6d0f12b2b7e7e076fe44bca789277f5f8e))
- remove yarn lock ([c2134b3](https://github.com/sanity-io/sanity-plugin-workflow/commit/c2134b3bc031546ac85c0d9d20f4cfedb8863c48))

## [1.0.0-beta.2](https://github.com/sanity-io/sanity-plugin-workflow/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2023-02-24)

### Features

- add schema and user filters ([8b8ec09](https://github.com/sanity-io/sanity-plugin-workflow/commit/8b8ec09131afa98c9b487fcc8c687e94efb743a7))
- better UI feedback for workflow states ([ea76c4d](https://github.com/sanity-io/sanity-plugin-workflow/commit/ea76c4d0a3265663fc77a3d4eea686963d77a3ae))
- change to opt-in model for workflows ([d16ca8f](https://github.com/sanity-io/sanity-plugin-workflow/commit/d16ca8f1a5c5b6f28b575731670746637ba7c47f))
- improve document actions for all states ([95458b7](https://github.com/sanity-io/sanity-plugin-workflow/commit/95458b7dcbf86894cb2620b7c7f1df9023597fb0))
- re-add user assignment action ([d05d1c9](https://github.com/sanity-io/sanity-plugin-workflow/commit/d05d1c902f2842138cbb76c944491b3f70ebbe1b))
- type hinting for transitions ([1a41292](https://github.com/sanity-io/sanity-plugin-workflow/commit/1a41292c928005eea93d40e3acbabae45001b196))
- update state example ([059bd90](https://github.com/sanity-io/sanity-plugin-workflow/commit/059bd903a622c8f775ea52f46f389a62eb573ff9))
- user role awareness ([d5cdc97](https://github.com/sanity-io/sanity-plugin-workflow/commit/d5cdc976ef3b011f9fdc65753b48e3750e485476))

### Bug Fixes

- better user handling and document operations ([d2efd8a](https://github.com/sanity-io/sanity-plugin-workflow/commit/d2efd8a15baea09932c0d10f65069a5f65c36e9e))
- double-operation and add status icons ([238ae58](https://github.com/sanity-io/sanity-plugin-workflow/commit/238ae5871b5d5313b10ad5a92e3ca34325f862fb))
- linting ([374772f](https://github.com/sanity-io/sanity-plugin-workflow/commit/374772f542c03b3a8e8f5654b2c37a09efeea2ff))
- remove 'operation' from State configs ([fea853a](https://github.com/sanity-io/sanity-plugin-workflow/commit/fea853aa9719e4985c50657e21ebb5147e24a2be))
- satisfy plugin-kit ([67c2429](https://github.com/sanity-io/sanity-plugin-workflow/commit/67c2429335b736c8e3a9a044bdfe14fbabe6473a))

## 1.0.0-beta.1 (2022-12-16)

### Features

- first beta version ([3c8874c](https://github.com/sanity-io/sanity-plugin-workflow/commit/3c8874c6b93c23a9cf789fb78dcb4e2008d1db1b))
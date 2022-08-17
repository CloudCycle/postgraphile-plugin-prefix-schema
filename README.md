postgraphile-plugin-prefix-schema
=================================


This plugin for PostGraphile prepends the name of the SQL schema to the types in the GraphQL schema generated by Postgrahile. It does so in a way matching the capitalization style of the original type, so that camel-case, capital-case etc. are preserved.

Limitations
-----------

Only a single SQL schema may be used. If multiple schemas are used (which PostGraphile allows), the plugin will abort with an error.

Installation
------------

Install using NPM or Yarn:
NPM:

```bash
npm install --save postgraphile-plugin-prefix-schema
```

Yarn:
```bash
yarn add postgraphile-plugin-prefix-schema
```

Usage
-----

CLI:

```bash
postgraphile --append-plugins postgraphile-plugin-prefix-schema
```

Library:

```javascript
import prefixSchemaPlugin from 'postgraphile-plugin-prefix-schema';
```

Then add it to the appendPlugins array. E.g.:

```javascript
app.use(
  postgraphile(process.env.AUTH_DATABASE_URL, "app_public", {
    appendPlugins: [prefixSchemaPlugin],

    // Optional customisation
    graphileBuildOptions: {
      /*
       * Uncomment if you want simple collections to lose the 'List' suffix
       * (and connections to gain a 'Connection' suffix).
       */
      //pgOmitListSuffix: true,
      /*
       * Uncomment if you want 'userPatch' instead of 'patch' in update
       * mutations.
       */
      //pgSimplifyPatch: false,
      /*
       * Uncomment if you want 'allUsers' instead of 'users' at root level.
       */
      //pgSimplifyAllRows: false,
      /*
       * Uncomment if you want primary key queries and mutations to have
       * `ById` (or similar) suffix; and the `nodeId` queries/mutations
       * to lose their `ByNodeId` suffix.
       */
      // pgShortPk: true,
    },
    // ... other settings ...
  })
);
```
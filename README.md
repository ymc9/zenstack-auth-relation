# ZenStack Demo For Access Policies Using Relation Fields From `auth()`

This sample demonstrates a workaround when you need to access information from `auth()` but that information is in a relation field. In this example, `User` has a many-to-many relation to `Role`, and the `permission` in `Role` is needed in access policies.

1. A "virtual field" is added to `User` model to "lift" the information needed from the relation field.
2. The virtual field value is computed before passing to the `enhance` call.
3. The field is marked `@ignore` so it's not exposed on PrismaClient.
4. The virtual field can be used in access policies.

```prisma
@@allow('create,update,delete', auth().hasWritePermission)
```

Note that this is a temporary workaround. We'll support using `auth()` function call in [collection predict expressions](https://zenstack.dev/docs/reference/zmodel-language#collection-predicate-expressions) in the future, and then you can directly write policy rules like:

```prisma
@@allow('create,update,delete', auth().roles?[permission == 'WRITE'])
```

You can track the feature request here: https://github.com/zenstackhq/zenstack/issues/803

## Run

-   npm install
-   npm run generate
-   npm run dev

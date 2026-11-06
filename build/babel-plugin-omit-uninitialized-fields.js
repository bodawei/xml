/* Copyright ® 2022 by 柏大衛. All rights reserved. */

// Babel 8's TypeScript transform initializes every field that has no initializer to `undefined`
// (as `useDefineForClassFields: true` does). This project compiles with `tsc` and
// `useDefineForClassFields: false` (see tsconfig.json), where such fields emit nothing.
// Dropping them here, before the TypeScript transform sees the class, makes the code that Jest
// runs behave like the code that is built. Babel 7 did this by default.
//
// Only declarations with no value are dropped. Fields with an initializer, private (`#x`) fields
// and `declare` fields are left alone.
module.exports = function omitUninitializedFields() {
   return {
      name: 'omit-uninitialized-fields',
      visitor: {
         Class(path) {
            path.node.body.body = path.node.body.body.filter(
               (member) =>
                  !(member.type === 'ClassProperty' && member.value == null && !member.declare),
            );
         },
      },
   };
};

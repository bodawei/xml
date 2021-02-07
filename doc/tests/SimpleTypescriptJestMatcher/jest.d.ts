// import importedExpect = require('expect');
// declare const expectExport: typeof importedExpect;


// This one works with the "ambient" Jest definitions
// it does not work with import { describe, expect, it } from '@jest/globals';
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeWithinOneMinuteOf(expected: Date): R
        }
    }
}


// THis does not work
// This works IF we change the index.d.ts in expect/build to be
// namespace expect {
//  copied content from types.ts
// }
// declare global {
//     namespace expect {
//         interface Matchers<R> {
//             toBeWithinOneMinuteOfTwo(expected: Date): R
//         }
//     }
// }

export {};

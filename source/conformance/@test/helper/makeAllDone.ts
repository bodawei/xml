/* Copyright ® 2020 by 柏大衛. All rights reserved. */

/*
 * Simple locking routine. Calls the provided function when the
 * returned function has been called doneCount times.
 */
function makeAllDone(doneCount: number, func: () => void): () => void {
   let count = 0;

   return function oneDone(): void {
      count++;

      if (count === doneCount) {
         func();
      }
   };
}

export { makeAllDone };

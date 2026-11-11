/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

type DoneFn = () => void;
/*
 * Simple locking routine. Calls the provided function when the
 * returned function has been called doneCount times.
 */
function makeAllDone(doneCount: number, func: DoneFn | undefined): () => void {
   let count = 0;

   return function oneDone(): void {
      count++;

      if (count === doneCount) {
         func?.();
      }
   };
}

export { makeAllDone };

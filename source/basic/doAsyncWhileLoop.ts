/* Copyright ® 2020 by 柏大衛. All rights reserved. */

/*
 * Utility for calling a particular potentially asynchrounous function
 * repeatedly until it returns undefined.  REturns an array of all
 * the returned value
 */
function doAsyncWhileLoop<Output>(
   processor: (callback: (result: Output | undefined) => void) => void,
   finish: (results: Array<Output>) => void,
): void {
   let totalResults = 0;
   let totalInvocations = 1;
   let seenEnd = false;
   const results: Array<Output> = [];

   function processResult(thisInvocation: number, result: Output | undefined): void {
      totalResults++;

      if (result !== undefined) {
         results.push(result);
      } else {
         seenEnd = true;
      }

      // We need the seenEnd flag, otherwise each iteration through this if
      // they all happen in order will terminate
      if (totalResults === totalInvocations && seenEnd) {
         finish(results);
         return;
      }

      totalInvocations++;
      processor(processResult.bind(undefined, thisInvocation + 1));
   }

   processor(processResult.bind(undefined, 0));
}

export { doAsyncWhileLoop };

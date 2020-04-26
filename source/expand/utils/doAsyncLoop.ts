/* Copyright ® 2020 by 柏大衛. All rights reserved. */

/*
 * Utility routine for iterating over an aray, where each iteration involves
 * a potentially asynchronous call to a routine with a callback.
 *
 * Given an array of elements (Input)
 *   Call a processor with that input and a callback function.
 *   Each callback function must call the callback with the results of
 *     its processing (Output)
 *   Return an array of those results in the same order as the input elements.
 */
function doAsyncLoop<Input, Output>(
   array: Array<Input>,
   processor: (input: Input, callback: (result: Output) => void) => void,
   finish: (results: Array<Output>) => void,
): void {
   let remaining = array.length;
   const results: Array<Output> = [];

   // Call back immediately (synchronously!) if the input array is empty.
   if (remaining === 0) {
      finish(results);
      return;
   }

   // inner callback function that receives the results of the processing
   function processResult(boundIndex: number, result: Output): void {
      remaining--;
      results[boundIndex] = result;

      if (remaining === 0) {
         finish(results);
      }
   }

   for (let index = 0; index < array.length; index++) {
      const element = array[index];
      processor(element, processResult.bind(undefined, index));
   }
}

export { doAsyncLoop };

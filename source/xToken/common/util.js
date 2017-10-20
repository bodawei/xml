/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

function textOrBlank(lToken) {
   return lToken ? lToken.text : '';
}

function pushNonBottom(results, value) {
   if (value !== undefined && value !== null) {
      results.push(value);
   }
}

export {
   textOrBlank,
   pushNonBottom,
};

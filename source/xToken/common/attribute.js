/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import * as quotedValue from './quotedValue.js';

function parse(source, options = {}, deliverResults) {
   const newOptions = {
      terminators: [ '=' ].concat(options.terminators || []),
   };
   getNextAttribute(source, newOptions, [], deliverResults);
}

function getNextAttribute(source, options, params, deliverResults) {
   source.extract('word', options.terminators, (lToken) => {
      addAttribute(source, params, options, lToken, deliverResults);
   });
}

function addAttribute(source, params, options, name, deliverResults) {
   if (!name) {
      deliverResults(params);
      return;
   }
   const param = {
      name,
   };
   params.push(param);

   source.extractToObject('space', param, 'postNameSpace');
   source.extractToObject('match', '=', param, 'equal');
   source.extractToObject('space', param, 'postEqualSpace');
   quotedValue.parse('param', source, param, (gotQuoted) => {
      if (gotQuoted) {
         source.extractToObject('space', param, 'trailingSpace');
      }

      getNextAttribute(source, options, params, deliverResults);
   });
}

export { parse };

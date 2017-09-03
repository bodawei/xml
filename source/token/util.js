/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

function textOrBlank(chunk) {
   return chunk ? chunk.text : '';
}

function textOrUndef(chunk) {
   return chunk && chunk.text;
}

module.exports = {
   textOrBlank,
   textOrUndef,
};

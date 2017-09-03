/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const ATTR_NO_CHUNKS = 'Attribute values have no chunks';
const ENTITYVAL_NO_CHUNKS = 'At declaration time, entity values have no chunks';
const SUBSET_NO_CHUNKS = 'Subset tokens never have chunks';

class XmlToken {

   constructor(chunks) {
      if (!chunks) {
         throw new Error('Must provide a chunks value to the token you are constructing.');
      }

      this.chunks = undefined;

      if (chunks !== ATTR_NO_CHUNKS && chunks !== ENTITYVAL_NO_CHUNKS && chunks !== SUBSET_NO_CHUNKS) {
         this.chunks = chunks;
      }
   }

}

module.exports = {
   Token: XmlToken,
};

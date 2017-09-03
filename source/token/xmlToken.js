/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const ATTR_NO_LTOKENS = 'Attribute values have no lTokens';
const ENTITYVAL_NO_LTOKENS = 'At declaration time, entity values have no lTokens';
const SUBSET_NO_LTOKENS = 'Subset tokens never have lTokens';

class XmlToken {

   constructor(lTokens) {
      if (!lTokens) {
         throw new Error('Must provide a lTokens value to the token you are constructing.');
      }

      this.lTokens = undefined;

      if (lTokens !== ATTR_NO_LTOKENS && lTokens !== ENTITYVAL_NO_LTOKENS && lTokens !== SUBSET_NO_LTOKENS) {
         this.lTokens = lTokens;
      }
   }

}

module.exports = {
   Token: XmlToken,
};

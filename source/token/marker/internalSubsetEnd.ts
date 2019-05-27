/* Copyright ® 2018 by 柏大衛. All rights reserved. */

/**********************************************************************\
 Defines a simple "marker" token that tracks the end of the internal
 subset.
\**********************************************************************/

const INTERNAL_SUBSET_END_TOKEN = 'INTERNAL_SUBSET_END_TOKEN';

class InternalSubsetEndToken {
   public readonly type: typeof INTERNAL_SUBSET_END_TOKEN = INTERNAL_SUBSET_END_TOKEN;
}

export {
   INTERNAL_SUBSET_END_TOKEN,
   InternalSubsetEndToken
};

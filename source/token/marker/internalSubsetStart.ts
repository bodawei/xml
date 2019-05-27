/* Copyright ® 2018 by 柏大衛. All rights reserved. */

/**********************************************************************\
 Defines a simple "marker" token that tracks the start of the internal
 subset.
\**********************************************************************/

const INTERNAL_SUBSET_START_TOKEN = 'INTERNAL_SUBSET_START_TOKEN';

class InternalSubsetStartToken {
   public readonly type: typeof INTERNAL_SUBSET_START_TOKEN = INTERNAL_SUBSET_START_TOKEN;
}

export {
   INTERNAL_SUBSET_START_TOKEN,
   InternalSubsetStartToken,
};

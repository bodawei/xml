/* Copyright ® 2018 by 柏大衛. All rights reserved. */

/**********************************************************************\
 Defines a simple "marker" token that tracks the end of the internal
 subset.
\**********************************************************************/

const INTERNAL_SUBSET_END_XTOKEN = 'INTERNAL_SUBSET_END_XTOKEN';

class InternalSubsetEndXToken {
   public readonly type: typeof INTERNAL_SUBSET_END_XTOKEN = INTERNAL_SUBSET_END_XTOKEN;
}

export {
   INTERNAL_SUBSET_END_XTOKEN,
   InternalSubsetEndXToken
};

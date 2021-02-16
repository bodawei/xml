/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { CharRefPToken, TextPToken } from 'pToken';
import { toSToken } from 'sToken';
import { EntityValuePToken } from 'token';

interface NameToEntityValue {
   [entityName: string]: EntityValuePToken;
}

// §4.6.0: This is our set of data to populate our "info" objects for the predefined entities.
const PREDEFINED_ENTITIES: NameToEntityValue = {
   lt: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('38'),
         close: toSToken(';'),
      }),
      new TextPToken({ text: toSToken('#60;') }),
   ],
   amp: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('38'),
         close: toSToken(';'),
      }),
      new TextPToken({ text: toSToken('#38;') }),
   ],
   gt: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('62'),
         close: toSToken(';'),
      }),
   ],
   apos: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('39'),
         close: toSToken(';'),
      }),
   ],
   quot: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('34'),
         close: toSToken(';'),
      }),
   ],
};

function lookupPredefinedEntityValue(name: string): EntityValuePToken | undefined {
   return PREDEFINED_ENTITIES[name];
}

export { lookupPredefinedEntityValue };

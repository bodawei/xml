/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { CharRefPToken, EntityValuePToken, TextPToken } from 'token';

type NameToEntityValue = { [entityName: string]: EntityValuePToken };

// §4.6.0: This is our set of data to populate our "info" objects for the predefined entities.
const PREDEFINED_ENTITIES: NameToEntityValue = {
   lt: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('38'),
      }),
      new TextPToken({ text: toSToken('#60;') }),
   ],
   amp: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('38'),
      }),
      new TextPToken({ text: toSToken('#38;') }),
   ],
   gt: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('62'),
      }),
   ],
   apos: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('39'),
      }),
   ],
   quot: [
      new CharRefPToken({
         open: toSToken('&#'),
         digits: toSToken('34'),
      }),
   ],
};

function lookupPredefinedEntityValue(name: string): EntityValuePToken | void {
   return PREDEFINED_ENTITIES[name];
}

export { lookupPredefinedEntityValue };

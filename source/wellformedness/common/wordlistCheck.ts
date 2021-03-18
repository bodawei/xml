/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { WellFormedError } from '../../wellformedness/error/WellFormedError';
import { WordListPToken } from 'token';

import { nmTokenCheck } from './nmTokenCheck';
import { nameCheck } from './nameCheck';

const ENUMERATION_PTOKEN = 'ENUMERATION_PTOKEN';
const WFEID = WellFormedError.ID;

function wordListCheck(
   pToken: WordListPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);

   if (pToken.words.length <= 0) {
      ec.setPos(undefined);
      ec.report(WFEID.WORDLIST_NO_WORDS);
   }

   let index = 0;
   for (const entry of pToken.words) {
      const isLast = index === pToken.words.length - 1;

      ec.setPos(entry.word);
      ec.check(!entry.word, WFEID.WORDLIST_NO_WORD, [index.toString()]);

      if (pToken.type === ENUMERATION_PTOKEN) {
         nmTokenCheck(entry.word, ec, confVer, WFEID.WORDLIST_INVALID_NMTOKEN);
      } else {
         nameCheck(entry.word, ec, confVer, WFEID.WORDLIST_INVALID_NAME);
      }

      ec.setPos(entry.wordSpace);
      ec.setPos(entry.connector);

      if (isLast) {
         ec.check(entry.connector, WFEID.WORDLIST_NO_WORD, [(index + 1).toString()]);
      } else {
         ec.check(!entry.connector, WFEID.WORDLIST_NO_CONNECTOR, [index.toString()]);
      }

      ec.setPos(entry.connectorSpace);

      index++;
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.WORDLIST_NO_CLOSE);
}

export { wordListCheck };

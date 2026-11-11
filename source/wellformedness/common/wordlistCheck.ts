/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { WordListPToken } from 'token';

import { wellFormedErrorCodes } from '../error/wellFormedError';
import { nameCheck } from './nameCheck';
import { nmTokenCheck } from './nmTokenCheck';

const ENUMERATION_PTOKEN = 'ENUMERATION_PTOKEN';
const WFEID = wellFormedErrorCodes.id;

function wordListCheck(
   pToken: WordListPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   collector.setPos(pToken.open);
   collector.setPos(pToken.openSpace);

   if (pToken.words.length <= 0) {
      collector.setPos(undefined);
      collector.report(WFEID.WORDLIST_NO_WORDS);
   }

   let index = 0;
   for (const entry of pToken.words) {
      const isLast = index === pToken.words.length - 1;

      collector.setPos(entry.word);
      collector.check(!entry.word, WFEID.WORDLIST_NO_WORD, [index.toString()]);

      if (pToken.type === ENUMERATION_PTOKEN) {
         nmTokenCheck(entry.word, collector, confVer, WFEID.WORDLIST_INVALID_NMTOKEN);
      } else {
         nameCheck(entry.word, collector, confVer, WFEID.WORDLIST_INVALID_NAME);
      }

      collector.setPos(entry.wordSpace);
      collector.setPos(entry.connector);

      if (isLast) {
         collector.check(entry.connector, WFEID.WORDLIST_NO_WORD, [(index + 1).toString()]);
      } else {
         collector.check(!entry.connector, WFEID.WORDLIST_NO_CONNECTOR, [index.toString()]);
      }

      collector.setPos(entry.connectorSpace);

      index++;
   }

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.WORDLIST_NO_CLOSE);
}

export { wordListCheck };

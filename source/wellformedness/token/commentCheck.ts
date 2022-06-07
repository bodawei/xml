/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector, Offset, rangeEndOffset } from 'basic';
import { CommentPToken } from 'token';

import { charCheck } from '../common/charCheck';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;

function commentCheck(
   pToken: CommentPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   collector.setPos(pToken.open);

   if (pToken.text.length === 0) {
      collector.setPos(undefined);
   } else
      for (let index = 0; index < pToken.text.length; index++) {
         const textSToken = pToken.text[index];
         const lastCharIsHyphen = textSToken.str.endsWith('-');
         const isLastElement = index === pToken.text.length - 1;
         const isDoubleHyphenPiece = textSToken.str === '--';

         collector.setPos(textSToken);
         charCheck(textSToken, collector, confVer, false);

         if (isDoubleHyphenPiece) {
            collector.report(WFEID.COMMENT_DOUBLE_HYPHEN, undefined, textSToken);
         } else if (lastCharIsHyphen && isLastElement) {
            const range = textSToken.lastRange;
            let offset;

            if (range) {
               const original = rangeEndOffset(range);
               // Adjust to the location of the hyphen
               offset = new Offset(
                  original.entityId,
                  original.index - 1,
                  original.row,
                  original.column - 1,
               );
            }

            collector.report(WFEID.COMMENT_ENDS_WITH_HYPHEN, undefined, offset);
         }
      }

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.COMMENT_NO_CLOSE);
}

export { commentCheck };

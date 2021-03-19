/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, Offset } from 'basic';
import { CommentPToken } from 'token';

import { charCheck } from '../common/charCheck';
import { WellFormedError } from '../error/WellFormedError';

const WFEID = WellFormedError.ID;

function commentCheck(
   pToken: CommentPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.open);

   if (pToken.text.length === 0) {
      ec.setPos(undefined);
   } else
      for (let index = 0; index < pToken.text.length; index++) {
         const textSToken = pToken.text[index];
         const lastCharIsHyphen = textSToken.str.endsWith('-');
         const isLastElement = index === pToken.text.length - 1;
         const isDoubleHyphenPiece = textSToken.str === '--';

         ec.setPos(textSToken);
         charCheck(textSToken, ec, confVer);

         if (isDoubleHyphenPiece) {
            ec.report(WFEID.COMMENT_DOUBLE_HYPHEN, undefined, textSToken);
         } else if (lastCharIsHyphen && isLastElement) {
            const range = textSToken.lastRange;
            let offset;

            if (range) {
               const original = range.getEndOffset();
               // Adjust to the location of the hyphen
               offset = new Offset(
                  original.entityId,
                  original.index - 1,
                  original.row,
                  original.column - 1,
               );
            }

            ec.report(WFEID.COMMENT_ENDS_WITH_HYPHEN, undefined, offset);
         }
      }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.COMMENT_NO_CLOSE);
}

export { commentCheck };

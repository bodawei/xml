/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, Offset } from 'basic';
import { WellFormedError } from 'error';
import { SToken, STokenSource, STokenArrayBuilder } from 'sToken';
import misc from './common/misc';

const COMMENT_PTOKEN = 'COMMENT_PTOKEN';
const COMMENT_XTOKEN = 'COMMENT_XTOKEN';
const WFEID = WellFormedError.ID;

type DeliverPToken = (pToken: CommentPToken) => void;

/**********************************************************************\
 The comment namespace contains the usual tools for processing XML
 comments
\**********************************************************************/

class CommentXToken {
   public readonly type: typeof COMMENT_XTOKEN = COMMENT_XTOKEN;
   public readonly text: string;
   public pToken?: CommentPToken;

   constructor(text: string, pToken?: CommentPToken) {
      this.text = text;
      this.pToken = pToken;
   }
}

/**********************************************************************\
 In practice, at this time, double hyphens in the input will be stored
 as separate STokens in the array.
\**********************************************************************/
class CommentPToken {
   public readonly type: typeof COMMENT_PTOKEN = COMMENT_PTOKEN;
   public readonly open: SToken;
   public readonly text: ReadonlyArray<SToken> = [];
   public readonly close?: SToken;

   constructor(param: CommentPToken | {open: SToken}) {
      Object.keys(param).forEach((key) => {
         if (key === 'type') {
            return;
         }
         (this as any)[key] = (param as any)[key];
      });

      this.open = param.open;
   }

   checkWellFormed(ec: ErrorCollector, confVer: ConformanceVersion) {
      return checkWellFormed(this, ec, confVer);
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray() {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parseComment() extracts a comment.
 Note that while comments are theoretically entirely opaque, a couple
 details should be pointed out:
   Version 1.0/2 and beyond (§2.5) says PE refs are not allowed

 PARAM
    commentOpen: An SToken for the opening <!--

 SYNTAX
   §2.5
      [15]    Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
         Lax: Comment ::= '<!--' Char* '-->'
   Lax:
      @@@@
\**********************************************************************/

function parseComment(source: STokenSource, commentOpen: SToken, deliverPToken: DeliverPToken) {
   const pToken = {
      open: commentOpen,
      text: [],
   };

   extractCommentContent(source, pToken, deliverPToken);
}

function extractCommentContent(source: STokenSource, pToken: { open: SToken; [key: string]: any }, deliverPToken: DeliverPToken) {
   source.extract('all', [ '--' ], (textSToken) => {
      if (textSToken) {
         pToken.text.push(textSToken);
      }

      source.extract('match', '-->', (sToken) => {
         pToken.close = sToken;

         if (sToken) {
            deliverPToken(new CommentPToken(pToken));
            return;
         }

         source.extract('match', '--', (dashToken) => {
            if (!dashToken) {
               deliverPToken(new CommentPToken(pToken));
            } else {
               pToken.text.push(dashToken);
               extractCommentContent(source, pToken, deliverPToken);
            }
         });
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: CommentPToken, ec: ErrorCollector, confVer: ConformanceVersion) {
   ec.setPos(pToken.open);

   if (!pToken.text || pToken.text.length === 0) {
      ec.setPos(undefined);
   } else for (let index = 0; index < pToken.text.length; index++) {
      const textSToken = pToken.text[index];
      const lastCharIsHyphen = textSToken.str[textSToken.str.length - 1] === '-';
      const isLastElement = index === pToken.text.length - 1;
      const isDoubleHyphenPiece = textSToken.str === '--';

      ec.setPos(textSToken);
      misc.checkCharWellFormed(textSToken, ec, confVer);

      if (isDoubleHyphenPiece) {
         ec.report(WFEID.COMMENT_DOUBLE_HYPHEN, undefined, textSToken);
      } else if (lastCharIsHyphen && isLastElement) {
         const range = textSToken.lastRange;
         let offset;

         if (range) {
            const originsl = range.getEndOffset();
            // Adjust to the location of the hyphen
            offset = new Offset(originsl.entityId, originsl.index - 1, originsl.row, originsl.column - 1);
         }

         ec.report(WFEID.COMMENT_ENDS_WITH_HYPHEN, undefined, offset);
      }
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.COMMENT_NO_CLOSE);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: CommentPToken) {
   const texts = pToken.text;
   const combinedTexts = texts.map((item) => item.str);

   return new CommentXToken(combinedTexts.join(''), pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: CommentPToken): ReadonlyArray<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open);
   builder.add(pToken.text.slice(0));
   builder.add(pToken.close);

   return builder.sTokenArray;
}

export {
   COMMENT_PTOKEN,
   COMMENT_XTOKEN,
   CommentPToken,
   CommentXToken,

   parseComment,
};

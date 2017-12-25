/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import misc from './common/misc.js';
import * as base from './base.js';

const COMMENT = 'COMMENT';
const WFEID = WellFormedError.ID;

/**********************************************************************\
 The comment namespace contains the usual tools for processing XML
 comments
\**********************************************************************/

class Comment extends base.XToken {

   constructor(text, sTokens) {
      super(sTokens);

      this.text = text;
   }

}

class CommentPToken extends base.PToken {
   constructor(props) {
      super(COMMENT, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray(this);

      results.pushSTokens(this.open);

      for (let index = 0; index < this.text.length; index++) {
         results.pushSTokens(this.text[index]);
      }

      results.pushSTokens(this.close);

      return results;
   }
}

/**********************************************************************\
 parse() extracts a comment.
 Note that while comments are theoretically entirely opaque, a couple
 details should be pointed out:
   Version 1.0/2 and beyond (§2.5) says PE refs are not allowed
   Implicitly, all newline transformation happens in comments
   Implicitly, GE refs are not allowed in these

 PARAM
 source: A STokenSource to read from
 commentOpen: An SToken for the opening <!--
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
\**********************************************************************/

function parse(source, commentOpen, deliverPToken) {
   const pToken = {
      type: COMMENT,
      open: commentOpen,
      text: [],
   };

   extractCommentContent(source, pToken, deliverPToken);
}

function extractCommentContent(source, pToken, deliverPToken) {
   source.extract('all', [ '--' ], (textToken) => {
      if (textToken) {
         pToken.text.push(textToken);
      }

      source.extract('match', '-->', (sToken) => {
         pToken.close = sToken;

         if (sToken) {
            deliverPToken(pToken);
            return;
         }

         source.extract('match', '--', (dashToken) => {
            if (!dashToken) {
               deliverPToken(pToken);
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

function checkWellFormed(pToken, ec, entityMetaData) {
   ec.setPos(pToken.open);

   if (!pToken.text || pToken.text.length === 0) {
      ec.setPos(undefined);
   } else for (let index = 0; index < pToken.text.length; index++) {
      const textItem = pToken.text[index];
      const lastChar = textItem.text[textItem.text.length - 1];
      const isLastItem = index === pToken.text.length - 1;

      ec.setPos(textItem);
      misc.checkWellFormedText(textItem, ec, entityMetaData);

      if (textItem.text.indexOf('--') !== -1) {
         ec.report(WFEID.COMMENT_DOUBLE_HYPHEN, undefined, textItem);
      } else if (lastChar === '-' && isLastItem) {
         const offset = textItem.range[textItem.range.length - 1].getEndOffset();
         offset.index --;
         offset.column --;
         ec.report(WFEID.COMMENT_ENDS_WITH_HYPHEN, undefined, offset);
      }
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.COMMENT_NO_CLOSE);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   const texts = pToken.text || [];
   const combinedTexts = texts.map((item) => item.text);
   return new Comment(combinedTexts.join(''), pToken);
}

export {
   COMMENT as PTYPE,
   Comment as XToken,
   CommentPToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};

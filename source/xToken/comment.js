/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   pushNonBottom,
} from './common/util.js';
import * as misc from './common/misc.js';
import { Token as XmlToken } from './xmlToken.js';

const COMMENT = 'COMMENT';
const WFEID = WellFormedError.ID;

/**********************************************************************\
 The comment namespace contains the usual tools for processing XML
 comments
\**********************************************************************/

class Comment extends XmlToken {

   constructor(text, lTokens) {
      super(lTokens);

      this.text = text;
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
 source: A LTokenSource to read from
 commentOpen: An LToken for the opening <!--
 deliverParsed: Callback to deliver the parsed LTokens

 SYNTAX
   [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
\**********************************************************************/

function parse(source, commentOpen, deliverParsed) {
   const parsed = {
      type: COMMENT,
      open: commentOpen,
      text: [],
   };

   extractCommentContent(source, parsed, deliverParsed);
}

function extractCommentContent(source, parsed, deliverParsed) {
   source.extract('all', [ '--' ], (textToken) => {
      if (textToken) {
         parsed.text.push(textToken);
      }

      source.extract('match', '-->', (lToken) => {
         parsed.close = lToken;

         if (lToken) {
            deliverParsed(parsed);
            return;
         }

         source.extract('match', '--', (dashToken) => {
            if (!dashToken) {
               deliverParsed(parsed);
            } else {
               parsed.text.push(dashToken);
               extractCommentContent(source, parsed, deliverParsed);
            }
         });
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   ec.setPos(parsed.open);

   if (!parsed.text || parsed.text.length === 0) {
      ec.setPos(undefined);
   } else for (let index = 0; index < parsed.text.length; index++) {
      const textItem = parsed.text[index];
      const lastChar = textItem.text[textItem.text.length - 1];
      const isLastItem = index === parsed.text.length - 1;

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

   ec.setPos(parsed.close);
   ec.check(!parsed.close, WFEID.COMMENT_NO_CLOSE);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   const texts = parsed.text || [];
   const combinedTexts = texts.map((item) => item.text);
   return new Comment(combinedTexts.join(''), getLTokens(parsed));
}

function getLTokens(parsed) {
   const texts = parsed.text || [];
   const results = [];

   pushNonBottom(results, parsed.open);

   for (let index = 0; index < texts.length; index++) {
      pushNonBottom(results, texts[index]);
   }

   pushNonBottom(results, parsed.close);

   return results;
}

export {
   COMMENT as TYPE,
   Comment as Token,
   parse,
   checkWellFormed,
   makeToken,
};

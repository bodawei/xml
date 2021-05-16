/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';

const COMMENT_PTOKEN = 'COMMENT_PTOKEN';

type DeliverPToken = (pToken: CommentPToken) => void;

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

export {
   COMMENT_PTOKEN,
   CommentPToken,

   parseComment,
};

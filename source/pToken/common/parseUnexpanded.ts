/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { doAsyncWhileLoop } from 'basic';
import { SToken, STokenSource } from 'basic';

import { parseParameterEntityReference } from '../token/parameterEntityReference';
import { TextPToken, parseText } from '../token/text';
import { UnexpandedMarkupDetails, UnexpandedMarkupToken } from '../types';

// This returns an array of textPTokens, some of which are quotes, others are runs of text.
function getText(
   source: STokenSource,
   callback: (textTokens: Array<UnexpandedMarkupToken> | undefined) => void,
): void {
   doAsyncWhileLoop<Array<UnexpandedMarkupToken>>(
      (callback) => {
         parseText(source, ["'", '"', '%', '>', ']'], (textPToken) => {
            source.extract('peekChar', (next) => {
               if (!next || (next.str !== '"' && next.str !== "'")) {
                  callback(textPToken ? [textPToken] : undefined);
                  return;
               }

               const textTokens: Array<UnexpandedMarkupToken> = textPToken ? [textPToken] : [];
               const container: { open?: SToken; text?: SToken } = {};

               source.extractToObject('match', next.str, container, 'open');
               source.extractToObject('all', [next.str], container, 'text');
               source.extract('match', next.str, (close) => {
                  if (container.open) {
                     textTokens.push(new TextPToken({ text: container.open }));
                  }

                  if (container.text) {
                     textTokens.push(new TextPToken({ text: container.text }));
                  }

                  if (close) {
                     textTokens.push(new TextPToken({ text: close }));
                  }

                  callback(textTokens);
               });
            });
         });
      },
      (textResults) => {
         const tokens: Array<UnexpandedMarkupToken> = [];

         for (const result of textResults) {
            tokens.push(...result);
         }

         callback(tokens.length > 0 ? tokens : undefined);
      },
   );
}

function parseUnexpanded(
   source: STokenSource,
   propName: string,
   done: (value: UnexpandedMarkupDetails | undefined) => void,
): void {
   source.extract('peekChar', (sToken) => {
      if (sToken?.str !== '%') {
         done(undefined);
         return;
      }

      function deliverResults(results: Array<Array<UnexpandedMarkupToken>>) {
         const tokens: Array<UnexpandedMarkupToken> = [];

         for (const result of results) {
            tokens.push(...result);
         }

         done({
            propName,
            tokens,
         });
      }

      doAsyncWhileLoop<Array<UnexpandedMarkupToken>>((callback) => {
         parseParameterEntityReference(source, (peRef) => {
            if (!peRef) {
               callback(undefined);
            } else {
               getText(source, (result) => {
                  callback(result ? [peRef, ...result] : [peRef]);
               });
            }
         });
      }, deliverResults);
   });
}

function parseUnexpandedAfterPeRef(
   source: STokenSource,
   propName: string,
   done: (value: UnexpandedMarkupDetails | undefined) => void,
): void {
   getText(source, (textTokens) => {
      parseUnexpanded(source, propName, (rest) => {
         if (!textTokens && !rest) {
            done(undefined);
            return;
         }

         const restTokens = rest?.tokens ?? [];

         done({
            propName,
            tokens: textTokens ? [...textTokens, ...restTokens] : restTokens,
         });
      });
   });
}

export { UnexpandedMarkupDetails, parseUnexpanded, parseUnexpandedAfterPeRef };

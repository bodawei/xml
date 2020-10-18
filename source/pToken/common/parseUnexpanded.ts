/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { doAsyncWhileLoop } from 'basic';
import { SToken, STokenSource } from 'sToken';
import { TextPToken, parseParameterEntityReference, parseText } from 'token';

import { UnexpandedMarkupDetails, UnexpandedMarkupToken } from '../types';

function getText(
   source: STokenSource,
   callback: (textTokens: Array<UnexpandedMarkupToken> | undefined) => void,
): void {
   doAsyncWhileLoop<Array<UnexpandedMarkupToken>>(
      (callback) => {
         parseText(source, ["'", '"', '%', '>'], (textPToken) => {
            source.extractNoParams('peekChar', (next) => {
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
   source.extractNoParams('peekChar', (sToken) => {
      if (!sToken || sToken.str !== '%') {
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

export { parseUnexpanded };

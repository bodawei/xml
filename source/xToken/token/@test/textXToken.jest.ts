/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { TextPToken } from 'pToken';
import { toSToken } from 'basic';

import { TextXToken, isTextXToken } from '../textXToken';

describe('TextXToken (unit)', () => {
   describe('construction', () => {
      it('constructs with a TextPToken', () => {
         const input = new TextPToken({
            text: toSToken('foo'),
         });

         const result = new TextXToken(input);

         expect(result).toMatchInlineSnapshot(`
            TextXToken {
              "pToken": TextPToken {
                "text": SToken {
                  "originalStr": "foo",
                  "ranges": [
                    Range {
                      "endColumn": 0,
                      "endIndex": 0,
                      "endRow": 0,
                      "entityId": EntityId {
                        "publicId": undefined,
                        "systemId": "",
                        "type": "ENTITY_ID",
                      },
                      "startColumn": 0,
                      "startIndex": 0,
                      "startRow": 0,
                    },
                  ],
                  "str": "foo",
                },
                "type": "TEXT_PTOKEN",
              },
              "text": "foo",
              "type": "TEXT_XTOKEN",
            }
         `);
      });

      it('constructs with a string', () => {
         const result = new TextXToken('bar');

         expect(result).toMatchInlineSnapshot(`
            TextXToken {
              "text": "bar",
              "type": "TEXT_XTOKEN",
            }
         `);
      });
   });

   describe('isTextXToken', () => {
      it('rejects an undefined value', () => {
         expect(isTextXToken(undefined)).toEqual(false);
      });

      it('rejects a string', () => {
         expect(isTextXToken('bad')).toEqual(false);
      });

      it('rejects a non-xtoken', () => {
         expect(isTextXToken({ bar: true })).toEqual(false);
      });

      it('accepts an TextXToken', () => {
         const result = new TextXToken('bar');

         expect(isTextXToken(result)).toEqual(true);
      });
   });
});

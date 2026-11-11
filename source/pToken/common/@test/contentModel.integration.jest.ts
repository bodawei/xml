/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { STokenSource, toSToken } from 'basic';

import { ContentModelP, parseContentModel } from '../contentModel';

describe('ContentModel (integration)', () => {
   let contentSpec: ContentModelP;

   beforeEach(() => {
      contentSpec = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         delimitedParticles: [
            {
               particle: {
                  name: toSToken('one'),
                  nameSpace: undefined,
                  repeat: toSToken('+'),
                  repeatSpace: toSToken(' '),
               },
               delimiter: toSToken('|'),
               delimiterSpace: toSToken(' '),
            },
            {
               particle: {
                  name: toSToken('two'),
                  nameSpace: undefined,
                  repeat: undefined,
                  repeatSpace: undefined,
               },
               delimiter: undefined,
               delimiterSpace: undefined,
            },
         ],
         close: toSToken(')'),
         closeSpace: undefined,
         repeat: toSToken('*'),
         repeatSpace: toSToken(' '),
      });
   });

   describe('parseContentModel()', () => {
      it('parses a basic content spec', (done) => {
         const source = new STokenSource();
         source.addText('( one+ | two)* ');
         source.endText();

         parseContentModel(source, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(contentSpec);
            done();
         });
      });

      it('parses content spec with a PE Ref in it', (done) => {
         const source = new STokenSource();
         source.addText('( one+ | %fred;');
         source.endText();

         parseContentModel(source, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(
               new ContentModelP({
                  open: toSToken('('),
                  openSpace: toSToken(' '),
                  delimitedParticles: [
                     {
                        particle: {
                           name: toSToken('one'),
                           nameSpace: undefined,
                           repeat: toSToken('+'),
                           repeatSpace: toSToken(' '),
                        },
                        delimiter: toSToken('|'),
                        delimiterSpace: toSToken(' '),
                     },
                  ],
                  close: undefined,
                  closeSpace: undefined,
                  repeat: undefined,
                  repeatSpace: undefined,
               }),
            );
            done();
         });
      });

      it('parses a nested content spec with various delimiters', (done) => {
         const source = new STokenSource();
         source.addText('( one+ | ( ( two | three)+ , four)? | five)');
         source.endText();

         parseContentModel(source, (result) => {
            expect(result).toMatchInlineSnapshot(`
               ContentModelP {
                 "close": SToken {
                   "originalStr": ")",
                   "ranges": [
                     Range {
                       "endColumn": 43,
                       "endIndex": 43,
                       "endRow": 0,
                       "entityId": EntityId {
                         "publicId": undefined,
                         "systemId": "",
                         "type": "ENTITY_ID",
                       },
                       "startColumn": 42,
                       "startIndex": 42,
                       "startRow": 0,
                     },
                   ],
                   "str": ")",
                 },
                 "closeSpace": undefined,
                 "delimitedParticles": [
                   {
                     "delimiter": SToken {
                       "originalStr": "|",
                       "ranges": [
                         Range {
                           "endColumn": 8,
                           "endIndex": 8,
                           "endRow": 0,
                           "entityId": EntityId {
                             "publicId": undefined,
                             "systemId": "",
                             "type": "ENTITY_ID",
                           },
                           "startColumn": 7,
                           "startIndex": 7,
                           "startRow": 0,
                         },
                       ],
                       "str": "|",
                     },
                     "delimiterSpace": SToken {
                       "originalStr": " ",
                       "ranges": [
                         Range {
                           "endColumn": 9,
                           "endIndex": 9,
                           "endRow": 0,
                           "entityId": EntityId {
                             "publicId": undefined,
                             "systemId": "",
                             "type": "ENTITY_ID",
                           },
                           "startColumn": 8,
                           "startIndex": 8,
                           "startRow": 0,
                         },
                       ],
                       "str": " ",
                     },
                     "particle": {
                       "name": SToken {
                         "originalStr": "one",
                         "ranges": [
                           Range {
                             "endColumn": 5,
                             "endIndex": 5,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 2,
                             "startIndex": 2,
                             "startRow": 0,
                           },
                         ],
                         "str": "one",
                       },
                       "nameSpace": undefined,
                       "repeat": SToken {
                         "originalStr": "+",
                         "ranges": [
                           Range {
                             "endColumn": 6,
                             "endIndex": 6,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 5,
                             "startIndex": 5,
                             "startRow": 0,
                           },
                         ],
                         "str": "+",
                       },
                       "repeatSpace": SToken {
                         "originalStr": " ",
                         "ranges": [
                           Range {
                             "endColumn": 7,
                             "endIndex": 7,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 6,
                             "startIndex": 6,
                             "startRow": 0,
                           },
                         ],
                         "str": " ",
                       },
                     },
                   },
                   {
                     "delimiter": SToken {
                       "originalStr": "|",
                       "ranges": [
                         Range {
                           "endColumn": 37,
                           "endIndex": 37,
                           "endRow": 0,
                           "entityId": EntityId {
                             "publicId": undefined,
                             "systemId": "",
                             "type": "ENTITY_ID",
                           },
                           "startColumn": 36,
                           "startIndex": 36,
                           "startRow": 0,
                         },
                       ],
                       "str": "|",
                     },
                     "delimiterSpace": SToken {
                       "originalStr": " ",
                       "ranges": [
                         Range {
                           "endColumn": 38,
                           "endIndex": 38,
                           "endRow": 0,
                           "entityId": EntityId {
                             "publicId": undefined,
                             "systemId": "",
                             "type": "ENTITY_ID",
                           },
                           "startColumn": 37,
                           "startIndex": 37,
                           "startRow": 0,
                         },
                       ],
                       "str": " ",
                     },
                     "particle": ContentModelP {
                       "close": SToken {
                         "originalStr": ")",
                         "ranges": [
                           Range {
                             "endColumn": 34,
                             "endIndex": 34,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 33,
                             "startIndex": 33,
                             "startRow": 0,
                           },
                         ],
                         "str": ")",
                       },
                       "closeSpace": undefined,
                       "delimitedParticles": [
                         {
                           "delimiter": SToken {
                             "originalStr": ",",
                             "ranges": [
                               Range {
                                 "endColumn": 28,
                                 "endIndex": 28,
                                 "endRow": 0,
                                 "entityId": EntityId {
                                   "publicId": undefined,
                                   "systemId": "",
                                   "type": "ENTITY_ID",
                                 },
                                 "startColumn": 27,
                                 "startIndex": 27,
                                 "startRow": 0,
                               },
                             ],
                             "str": ",",
                           },
                           "delimiterSpace": SToken {
                             "originalStr": " ",
                             "ranges": [
                               Range {
                                 "endColumn": 29,
                                 "endIndex": 29,
                                 "endRow": 0,
                                 "entityId": EntityId {
                                   "publicId": undefined,
                                   "systemId": "",
                                   "type": "ENTITY_ID",
                                 },
                                 "startColumn": 28,
                                 "startIndex": 28,
                                 "startRow": 0,
                               },
                             ],
                             "str": " ",
                           },
                           "particle": ContentModelP {
                             "close": SToken {
                               "originalStr": ")",
                               "ranges": [
                                 Range {
                                   "endColumn": 25,
                                   "endIndex": 25,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 24,
                                   "startIndex": 24,
                                   "startRow": 0,
                                 },
                               ],
                               "str": ")",
                             },
                             "closeSpace": undefined,
                             "delimitedParticles": [
                               {
                                 "delimiter": SToken {
                                   "originalStr": "|",
                                   "ranges": [
                                     Range {
                                       "endColumn": 18,
                                       "endIndex": 18,
                                       "endRow": 0,
                                       "entityId": EntityId {
                                         "publicId": undefined,
                                         "systemId": "",
                                         "type": "ENTITY_ID",
                                       },
                                       "startColumn": 17,
                                       "startIndex": 17,
                                       "startRow": 0,
                                     },
                                   ],
                                   "str": "|",
                                 },
                                 "delimiterSpace": SToken {
                                   "originalStr": " ",
                                   "ranges": [
                                     Range {
                                       "endColumn": 19,
                                       "endIndex": 19,
                                       "endRow": 0,
                                       "entityId": EntityId {
                                         "publicId": undefined,
                                         "systemId": "",
                                         "type": "ENTITY_ID",
                                       },
                                       "startColumn": 18,
                                       "startIndex": 18,
                                       "startRow": 0,
                                     },
                                   ],
                                   "str": " ",
                                 },
                                 "particle": {
                                   "name": SToken {
                                     "originalStr": "two",
                                     "ranges": [
                                       Range {
                                         "endColumn": 16,
                                         "endIndex": 16,
                                         "endRow": 0,
                                         "entityId": EntityId {
                                           "publicId": undefined,
                                           "systemId": "",
                                           "type": "ENTITY_ID",
                                         },
                                         "startColumn": 13,
                                         "startIndex": 13,
                                         "startRow": 0,
                                       },
                                     ],
                                     "str": "two",
                                   },
                                   "nameSpace": SToken {
                                     "originalStr": " ",
                                     "ranges": [
                                       Range {
                                         "endColumn": 17,
                                         "endIndex": 17,
                                         "endRow": 0,
                                         "entityId": EntityId {
                                           "publicId": undefined,
                                           "systemId": "",
                                           "type": "ENTITY_ID",
                                         },
                                         "startColumn": 16,
                                         "startIndex": 16,
                                         "startRow": 0,
                                       },
                                     ],
                                     "str": " ",
                                   },
                                   "repeat": undefined,
                                   "repeatSpace": undefined,
                                 },
                               },
                               {
                                 "delimiter": undefined,
                                 "delimiterSpace": undefined,
                                 "particle": {
                                   "name": SToken {
                                     "originalStr": "three",
                                     "ranges": [
                                       Range {
                                         "endColumn": 24,
                                         "endIndex": 24,
                                         "endRow": 0,
                                         "entityId": EntityId {
                                           "publicId": undefined,
                                           "systemId": "",
                                           "type": "ENTITY_ID",
                                         },
                                         "startColumn": 19,
                                         "startIndex": 19,
                                         "startRow": 0,
                                       },
                                     ],
                                     "str": "three",
                                   },
                                   "nameSpace": undefined,
                                   "repeat": undefined,
                                   "repeatSpace": undefined,
                                 },
                               },
                             ],
                             "open": SToken {
                               "originalStr": "(",
                               "ranges": [
                                 Range {
                                   "endColumn": 12,
                                   "endIndex": 12,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 11,
                                   "startIndex": 11,
                                   "startRow": 0,
                                 },
                               ],
                               "str": "(",
                             },
                             "openSpace": SToken {
                               "originalStr": " ",
                               "ranges": [
                                 Range {
                                   "endColumn": 13,
                                   "endIndex": 13,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 12,
                                   "startIndex": 12,
                                   "startRow": 0,
                                 },
                               ],
                               "str": " ",
                             },
                             "repeat": SToken {
                               "originalStr": "+",
                               "ranges": [
                                 Range {
                                   "endColumn": 26,
                                   "endIndex": 26,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 25,
                                   "startIndex": 25,
                                   "startRow": 0,
                                 },
                               ],
                               "str": "+",
                             },
                             "repeatSpace": SToken {
                               "originalStr": " ",
                               "ranges": [
                                 Range {
                                   "endColumn": 27,
                                   "endIndex": 27,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 26,
                                   "startIndex": 26,
                                   "startRow": 0,
                                 },
                               ],
                               "str": " ",
                             },
                           },
                         },
                         {
                           "delimiter": undefined,
                           "delimiterSpace": undefined,
                           "particle": {
                             "name": SToken {
                               "originalStr": "four",
                               "ranges": [
                                 Range {
                                   "endColumn": 33,
                                   "endIndex": 33,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 29,
                                   "startIndex": 29,
                                   "startRow": 0,
                                 },
                               ],
                               "str": "four",
                             },
                             "nameSpace": undefined,
                             "repeat": undefined,
                             "repeatSpace": undefined,
                           },
                         },
                       ],
                       "open": SToken {
                         "originalStr": "(",
                         "ranges": [
                           Range {
                             "endColumn": 10,
                             "endIndex": 10,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 9,
                             "startIndex": 9,
                             "startRow": 0,
                           },
                         ],
                         "str": "(",
                       },
                       "openSpace": SToken {
                         "originalStr": " ",
                         "ranges": [
                           Range {
                             "endColumn": 11,
                             "endIndex": 11,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 10,
                             "startIndex": 10,
                             "startRow": 0,
                           },
                         ],
                         "str": " ",
                       },
                       "repeat": SToken {
                         "originalStr": "?",
                         "ranges": [
                           Range {
                             "endColumn": 35,
                             "endIndex": 35,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 34,
                             "startIndex": 34,
                             "startRow": 0,
                           },
                         ],
                         "str": "?",
                       },
                       "repeatSpace": SToken {
                         "originalStr": " ",
                         "ranges": [
                           Range {
                             "endColumn": 36,
                             "endIndex": 36,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 35,
                             "startIndex": 35,
                             "startRow": 0,
                           },
                         ],
                         "str": " ",
                       },
                     },
                   },
                   {
                     "delimiter": undefined,
                     "delimiterSpace": undefined,
                     "particle": {
                       "name": SToken {
                         "originalStr": "five",
                         "ranges": [
                           Range {
                             "endColumn": 42,
                             "endIndex": 42,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 38,
                             "startIndex": 38,
                             "startRow": 0,
                           },
                         ],
                         "str": "five",
                       },
                       "nameSpace": undefined,
                       "repeat": undefined,
                       "repeatSpace": undefined,
                     },
                   },
                 ],
                 "open": SToken {
                   "originalStr": "(",
                   "ranges": [
                     Range {
                       "endColumn": 1,
                       "endIndex": 1,
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
                   "str": "(",
                 },
                 "openSpace": SToken {
                   "originalStr": " ",
                   "ranges": [
                     Range {
                       "endColumn": 2,
                       "endIndex": 2,
                       "endRow": 0,
                       "entityId": EntityId {
                         "publicId": undefined,
                         "systemId": "",
                         "type": "ENTITY_ID",
                       },
                       "startColumn": 1,
                       "startIndex": 1,
                       "startRow": 0,
                     },
                   ],
                   "str": " ",
                 },
                 "repeat": undefined,
                 "repeatSpace": undefined,
               }
            `);
            done();
         });
      });
   });
});

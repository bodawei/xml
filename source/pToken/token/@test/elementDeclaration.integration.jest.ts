/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';

import {
   ElementDeclarationPToken,
   parseElementDeclaration,
   resumeParseElementDeclaration,
} from '../elementDeclaration';

import { ParameterEntityReferencePToken } from 'token';

describe('elementDeclaration', () => {
   describe('parseElementDeclaration()', () => {
      it('parses a PERef (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('%foo;>');
         source.endText();

         parseElementDeclaration(source, { open: toSToken('<!') }, (result) => {
            const expected = new ElementDeclarationPToken({
               open: toSToken('<!'),
               unexpanded: {
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: undefined,
                        name: toSToken('foo'),
                        nameSpace: undefined,
                        close: toSToken(';'),
                     }),
                  ],
                  propName: 'name',
               },
               close: toSToken('>'),
            });

            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(result).toEqualRangeless(expected);
            done?.();
         });
      });

      it('parses a complex content model', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText(
            'AnElement ( one* | two +|(threeA,threeB?)+ | ( fourA, (fourB1 | fourB2)*, fourC))? >',
         );
         source.endText();

         parseElementDeclaration(source, { open: toSToken('<!') }, (result) => {
            expect(result).toMatchInlineSnapshot(`
               ElementDeclarationPToken {
                 "close": SToken {
                   "originalStr": ">",
                   "ranges": Array [
                     Range {
                       "endColumn": 84,
                       "endIndex": 84,
                       "endRow": 0,
                       "entityId": EntityId {
                         "publicId": undefined,
                         "systemId": "",
                         "type": "ENTITY_ID",
                       },
                       "startColumn": 83,
                       "startIndex": 83,
                       "startRow": 0,
                     },
                   ],
                   "str": ">",
                 },
                 "contentModel": ContentModelP {
                   "close": SToken {
                     "originalStr": ")",
                     "ranges": Array [
                       Range {
                         "endColumn": 81,
                         "endIndex": 81,
                         "endRow": 0,
                         "entityId": EntityId {
                           "publicId": undefined,
                           "systemId": "",
                           "type": "ENTITY_ID",
                         },
                         "startColumn": 80,
                         "startIndex": 80,
                         "startRow": 0,
                       },
                     ],
                     "str": ")",
                   },
                   "closeSpace": undefined,
                   "delimitedParticles": Array [
                     Object {
                       "delimiter": SToken {
                         "originalStr": "|",
                         "ranges": Array [
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
                         "ranges": Array [
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
                       "particle": Object {
                         "name": SToken {
                           "originalStr": "one",
                           "ranges": Array [
                             Range {
                               "endColumn": 15,
                               "endIndex": 15,
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
                           "str": "one",
                         },
                         "nameSpace": undefined,
                         "repeat": SToken {
                           "originalStr": "*",
                           "ranges": Array [
                             Range {
                               "endColumn": 16,
                               "endIndex": 16,
                               "endRow": 0,
                               "entityId": EntityId {
                                 "publicId": undefined,
                                 "systemId": "",
                                 "type": "ENTITY_ID",
                               },
                               "startColumn": 15,
                               "startIndex": 15,
                               "startRow": 0,
                             },
                           ],
                           "str": "*",
                         },
                         "repeatSpace": SToken {
                           "originalStr": " ",
                           "ranges": Array [
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
                       },
                     },
                     Object {
                       "delimiter": SToken {
                         "originalStr": "|",
                         "ranges": Array [
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
                         "str": "|",
                       },
                       "delimiterSpace": undefined,
                       "particle": Object {
                         "name": SToken {
                           "originalStr": "two",
                           "ranges": Array [
                             Range {
                               "endColumn": 22,
                               "endIndex": 22,
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
                           "str": "two",
                         },
                         "nameSpace": SToken {
                           "originalStr": " ",
                           "ranges": Array [
                             Range {
                               "endColumn": 23,
                               "endIndex": 23,
                               "endRow": 0,
                               "entityId": EntityId {
                                 "publicId": undefined,
                                 "systemId": "",
                                 "type": "ENTITY_ID",
                               },
                               "startColumn": 22,
                               "startIndex": 22,
                               "startRow": 0,
                             },
                           ],
                           "str": " ",
                         },
                         "repeat": SToken {
                           "originalStr": "+",
                           "ranges": Array [
                             Range {
                               "endColumn": 24,
                               "endIndex": 24,
                               "endRow": 0,
                               "entityId": EntityId {
                                 "publicId": undefined,
                                 "systemId": "",
                                 "type": "ENTITY_ID",
                               },
                               "startColumn": 23,
                               "startIndex": 23,
                               "startRow": 0,
                             },
                           ],
                           "str": "+",
                         },
                         "repeatSpace": undefined,
                       },
                     },
                     Object {
                       "delimiter": SToken {
                         "originalStr": "|",
                         "ranges": Array [
                           Range {
                             "endColumn": 44,
                             "endIndex": 44,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 43,
                             "startIndex": 43,
                             "startRow": 0,
                           },
                         ],
                         "str": "|",
                       },
                       "delimiterSpace": SToken {
                         "originalStr": " ",
                         "ranges": Array [
                           Range {
                             "endColumn": 45,
                             "endIndex": 45,
                             "endRow": 0,
                             "entityId": EntityId {
                               "publicId": undefined,
                               "systemId": "",
                               "type": "ENTITY_ID",
                             },
                             "startColumn": 44,
                             "startIndex": 44,
                             "startRow": 0,
                           },
                         ],
                         "str": " ",
                       },
                       "particle": ContentModelP {
                         "close": SToken {
                           "originalStr": ")",
                           "ranges": Array [
                             Range {
                               "endColumn": 41,
                               "endIndex": 41,
                               "endRow": 0,
                               "entityId": EntityId {
                                 "publicId": undefined,
                                 "systemId": "",
                                 "type": "ENTITY_ID",
                               },
                               "startColumn": 40,
                               "startIndex": 40,
                               "startRow": 0,
                             },
                           ],
                           "str": ")",
                         },
                         "closeSpace": undefined,
                         "delimitedParticles": Array [
                           Object {
                             "delimiter": SToken {
                               "originalStr": ",",
                               "ranges": Array [
                                 Range {
                                   "endColumn": 33,
                                   "endIndex": 33,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 32,
                                   "startIndex": 32,
                                   "startRow": 0,
                                 },
                               ],
                               "str": ",",
                             },
                             "delimiterSpace": undefined,
                             "particle": Object {
                               "name": SToken {
                                 "originalStr": "threeA",
                                 "ranges": Array [
                                   Range {
                                     "endColumn": 32,
                                     "endIndex": 32,
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
                                 "str": "threeA",
                               },
                               "nameSpace": undefined,
                               "repeat": undefined,
                               "repeatSpace": undefined,
                             },
                           },
                           Object {
                             "delimiter": undefined,
                             "delimiterSpace": undefined,
                             "particle": Object {
                               "name": SToken {
                                 "originalStr": "threeB",
                                 "ranges": Array [
                                   Range {
                                     "endColumn": 39,
                                     "endIndex": 39,
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
                                 "str": "threeB",
                               },
                               "nameSpace": undefined,
                               "repeat": SToken {
                                 "originalStr": "?",
                                 "ranges": Array [
                                   Range {
                                     "endColumn": 40,
                                     "endIndex": 40,
                                     "endRow": 0,
                                     "entityId": EntityId {
                                       "publicId": undefined,
                                       "systemId": "",
                                       "type": "ENTITY_ID",
                                     },
                                     "startColumn": 39,
                                     "startIndex": 39,
                                     "startRow": 0,
                                   },
                                 ],
                                 "str": "?",
                               },
                               "repeatSpace": undefined,
                             },
                           },
                         ],
                         "open": SToken {
                           "originalStr": "(",
                           "ranges": Array [
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
                           "str": "(",
                         },
                         "openSpace": undefined,
                         "repeat": SToken {
                           "originalStr": "+",
                           "ranges": Array [
                             Range {
                               "endColumn": 42,
                               "endIndex": 42,
                               "endRow": 0,
                               "entityId": EntityId {
                                 "publicId": undefined,
                                 "systemId": "",
                                 "type": "ENTITY_ID",
                               },
                               "startColumn": 41,
                               "startIndex": 41,
                               "startRow": 0,
                             },
                           ],
                           "str": "+",
                         },
                         "repeatSpace": SToken {
                           "originalStr": " ",
                           "ranges": Array [
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
                           "str": " ",
                         },
                       },
                     },
                     Object {
                       "delimiter": undefined,
                       "delimiterSpace": undefined,
                       "particle": ContentModelP {
                         "close": SToken {
                           "originalStr": ")",
                           "ranges": Array [
                             Range {
                               "endColumn": 80,
                               "endIndex": 80,
                               "endRow": 0,
                               "entityId": EntityId {
                                 "publicId": undefined,
                                 "systemId": "",
                                 "type": "ENTITY_ID",
                               },
                               "startColumn": 79,
                               "startIndex": 79,
                               "startRow": 0,
                             },
                           ],
                           "str": ")",
                         },
                         "closeSpace": undefined,
                         "delimitedParticles": Array [
                           Object {
                             "delimiter": SToken {
                               "originalStr": ",",
                               "ranges": Array [
                                 Range {
                                   "endColumn": 53,
                                   "endIndex": 53,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 52,
                                   "startIndex": 52,
                                   "startRow": 0,
                                 },
                               ],
                               "str": ",",
                             },
                             "delimiterSpace": SToken {
                               "originalStr": " ",
                               "ranges": Array [
                                 Range {
                                   "endColumn": 54,
                                   "endIndex": 54,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 53,
                                   "startIndex": 53,
                                   "startRow": 0,
                                 },
                               ],
                               "str": " ",
                             },
                             "particle": Object {
                               "name": SToken {
                                 "originalStr": "fourA",
                                 "ranges": Array [
                                   Range {
                                     "endColumn": 52,
                                     "endIndex": 52,
                                     "endRow": 0,
                                     "entityId": EntityId {
                                       "publicId": undefined,
                                       "systemId": "",
                                       "type": "ENTITY_ID",
                                     },
                                     "startColumn": 47,
                                     "startIndex": 47,
                                     "startRow": 0,
                                   },
                                 ],
                                 "str": "fourA",
                               },
                               "nameSpace": undefined,
                               "repeat": undefined,
                               "repeatSpace": undefined,
                             },
                           },
                           Object {
                             "delimiter": SToken {
                               "originalStr": ",",
                               "ranges": Array [
                                 Range {
                                   "endColumn": 73,
                                   "endIndex": 73,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 72,
                                   "startIndex": 72,
                                   "startRow": 0,
                                 },
                               ],
                               "str": ",",
                             },
                             "delimiterSpace": SToken {
                               "originalStr": " ",
                               "ranges": Array [
                                 Range {
                                   "endColumn": 74,
                                   "endIndex": 74,
                                   "endRow": 0,
                                   "entityId": EntityId {
                                     "publicId": undefined,
                                     "systemId": "",
                                     "type": "ENTITY_ID",
                                   },
                                   "startColumn": 73,
                                   "startIndex": 73,
                                   "startRow": 0,
                                 },
                               ],
                               "str": " ",
                             },
                             "particle": ContentModelP {
                               "close": SToken {
                                 "originalStr": ")",
                                 "ranges": Array [
                                   Range {
                                     "endColumn": 71,
                                     "endIndex": 71,
                                     "endRow": 0,
                                     "entityId": EntityId {
                                       "publicId": undefined,
                                       "systemId": "",
                                       "type": "ENTITY_ID",
                                     },
                                     "startColumn": 70,
                                     "startIndex": 70,
                                     "startRow": 0,
                                   },
                                 ],
                                 "str": ")",
                               },
                               "closeSpace": undefined,
                               "delimitedParticles": Array [
                                 Object {
                                   "delimiter": SToken {
                                     "originalStr": "|",
                                     "ranges": Array [
                                       Range {
                                         "endColumn": 63,
                                         "endIndex": 63,
                                         "endRow": 0,
                                         "entityId": EntityId {
                                           "publicId": undefined,
                                           "systemId": "",
                                           "type": "ENTITY_ID",
                                         },
                                         "startColumn": 62,
                                         "startIndex": 62,
                                         "startRow": 0,
                                       },
                                     ],
                                     "str": "|",
                                   },
                                   "delimiterSpace": SToken {
                                     "originalStr": " ",
                                     "ranges": Array [
                                       Range {
                                         "endColumn": 64,
                                         "endIndex": 64,
                                         "endRow": 0,
                                         "entityId": EntityId {
                                           "publicId": undefined,
                                           "systemId": "",
                                           "type": "ENTITY_ID",
                                         },
                                         "startColumn": 63,
                                         "startIndex": 63,
                                         "startRow": 0,
                                       },
                                     ],
                                     "str": " ",
                                   },
                                   "particle": Object {
                                     "name": SToken {
                                       "originalStr": "fourB1",
                                       "ranges": Array [
                                         Range {
                                           "endColumn": 61,
                                           "endIndex": 61,
                                           "endRow": 0,
                                           "entityId": EntityId {
                                             "publicId": undefined,
                                             "systemId": "",
                                             "type": "ENTITY_ID",
                                           },
                                           "startColumn": 55,
                                           "startIndex": 55,
                                           "startRow": 0,
                                         },
                                       ],
                                       "str": "fourB1",
                                     },
                                     "nameSpace": SToken {
                                       "originalStr": " ",
                                       "ranges": Array [
                                         Range {
                                           "endColumn": 62,
                                           "endIndex": 62,
                                           "endRow": 0,
                                           "entityId": EntityId {
                                             "publicId": undefined,
                                             "systemId": "",
                                             "type": "ENTITY_ID",
                                           },
                                           "startColumn": 61,
                                           "startIndex": 61,
                                           "startRow": 0,
                                         },
                                       ],
                                       "str": " ",
                                     },
                                     "repeat": undefined,
                                     "repeatSpace": undefined,
                                   },
                                 },
                                 Object {
                                   "delimiter": undefined,
                                   "delimiterSpace": undefined,
                                   "particle": Object {
                                     "name": SToken {
                                       "originalStr": "fourB2",
                                       "ranges": Array [
                                         Range {
                                           "endColumn": 70,
                                           "endIndex": 70,
                                           "endRow": 0,
                                           "entityId": EntityId {
                                             "publicId": undefined,
                                             "systemId": "",
                                             "type": "ENTITY_ID",
                                           },
                                           "startColumn": 64,
                                           "startIndex": 64,
                                           "startRow": 0,
                                         },
                                       ],
                                       "str": "fourB2",
                                     },
                                     "nameSpace": undefined,
                                     "repeat": undefined,
                                     "repeatSpace": undefined,
                                   },
                                 },
                               ],
                               "open": SToken {
                                 "originalStr": "(",
                                 "ranges": Array [
                                   Range {
                                     "endColumn": 55,
                                     "endIndex": 55,
                                     "endRow": 0,
                                     "entityId": EntityId {
                                       "publicId": undefined,
                                       "systemId": "",
                                       "type": "ENTITY_ID",
                                     },
                                     "startColumn": 54,
                                     "startIndex": 54,
                                     "startRow": 0,
                                   },
                                 ],
                                 "str": "(",
                               },
                               "openSpace": undefined,
                               "repeat": SToken {
                                 "originalStr": "*",
                                 "ranges": Array [
                                   Range {
                                     "endColumn": 72,
                                     "endIndex": 72,
                                     "endRow": 0,
                                     "entityId": EntityId {
                                       "publicId": undefined,
                                       "systemId": "",
                                       "type": "ENTITY_ID",
                                     },
                                     "startColumn": 71,
                                     "startIndex": 71,
                                     "startRow": 0,
                                   },
                                 ],
                                 "str": "*",
                               },
                               "repeatSpace": undefined,
                             },
                           },
                           Object {
                             "delimiter": undefined,
                             "delimiterSpace": undefined,
                             "particle": Object {
                               "name": SToken {
                                 "originalStr": "fourC",
                                 "ranges": Array [
                                   Range {
                                     "endColumn": 79,
                                     "endIndex": 79,
                                     "endRow": 0,
                                     "entityId": EntityId {
                                       "publicId": undefined,
                                       "systemId": "",
                                       "type": "ENTITY_ID",
                                     },
                                     "startColumn": 74,
                                     "startIndex": 74,
                                     "startRow": 0,
                                   },
                                 ],
                                 "str": "fourC",
                               },
                               "nameSpace": undefined,
                               "repeat": undefined,
                               "repeatSpace": undefined,
                             },
                           },
                         ],
                         "open": SToken {
                           "originalStr": "(",
                           "ranges": Array [
                             Range {
                               "endColumn": 46,
                               "endIndex": 46,
                               "endRow": 0,
                               "entityId": EntityId {
                                 "publicId": undefined,
                                 "systemId": "",
                                 "type": "ENTITY_ID",
                               },
                               "startColumn": 45,
                               "startIndex": 45,
                               "startRow": 0,
                             },
                           ],
                           "str": "(",
                         },
                         "openSpace": SToken {
                           "originalStr": " ",
                           "ranges": Array [
                             Range {
                               "endColumn": 47,
                               "endIndex": 47,
                               "endRow": 0,
                               "entityId": EntityId {
                                 "publicId": undefined,
                                 "systemId": "",
                                 "type": "ENTITY_ID",
                               },
                               "startColumn": 46,
                               "startIndex": 46,
                               "startRow": 0,
                             },
                           ],
                           "str": " ",
                         },
                         "repeat": undefined,
                         "repeatSpace": undefined,
                       },
                     },
                   ],
                   "open": SToken {
                     "originalStr": "(",
                     "ranges": Array [
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
                     "str": "(",
                   },
                   "openSpace": SToken {
                     "originalStr": " ",
                     "ranges": Array [
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
                     "str": " ",
                   },
                   "repeat": SToken {
                     "originalStr": "?",
                     "ranges": Array [
                       Range {
                         "endColumn": 82,
                         "endIndex": 82,
                         "endRow": 0,
                         "entityId": EntityId {
                           "publicId": undefined,
                           "systemId": "",
                           "type": "ENTITY_ID",
                         },
                         "startColumn": 81,
                         "startIndex": 81,
                         "startRow": 0,
                       },
                     ],
                     "str": "?",
                   },
                   "repeatSpace": SToken {
                     "originalStr": " ",
                     "ranges": Array [
                       Range {
                         "endColumn": 83,
                         "endIndex": 83,
                         "endRow": 0,
                         "entityId": EntityId {
                           "publicId": undefined,
                           "systemId": "",
                           "type": "ENTITY_ID",
                         },
                         "startColumn": 82,
                         "startIndex": 82,
                         "startRow": 0,
                       },
                     ],
                     "str": " ",
                   },
                 },
                 "contentSpec": undefined,
                 "contentSpecSpace": undefined,
                 "declType": undefined,
                 "declTypeSpace": undefined,
                 "extra": undefined,
                 "name": SToken {
                   "originalStr": "AnElement",
                   "ranges": Array [
                     Range {
                       "endColumn": 9,
                       "endIndex": 9,
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
                   "str": "AnElement",
                 },
                 "nameSpace": SToken {
                   "originalStr": " ",
                   "ranges": Array [
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
                   "str": " ",
                 },
                 "open": SToken {
                   "originalStr": "<!",
                   "ranges": Array [
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
                   "str": "<!",
                 },
                 "openSpace": undefined,
                 "type": "ELEMENT_DECLARATION_PTOKEN",
                 "unexpanded": undefined,
               }
            `);
            done?.();
         });
      });
   });

   describe('resumeParseElementDeclaration()', () => {
      it('resumes an entity declaration from the start', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('foobar ANY');
         source.endText();

         resumeParseElementDeclaration(
            source,
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               unexpanded: {
                  tokens: [],
                  propName: 'name',
               },
               close: toSToken('>'),
            }),
            (result) => {
               const expected = new ElementDeclarationPToken({
                  open: toSToken('<!'),
                  name: toSToken('foobar'),
                  nameSpace: toSToken(' '),
                  contentSpec: toSToken('ANY'),
                  unexpanded: {
                     tokens: [],
                     propName: 'name',
                  },
                  close: toSToken('>'),
               });

               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(expected);
               done?.();
            },
         );
      });

      it('resumes an entity declaration from the start', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('\ta | ( c, d ))');
         source.endText();

         resumeParseElementDeclaration(
            source,
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               contentModel: {
                  open: toSToken('('),
                  delimitedParticles: [],
               },
               unexpanded: {
                  tokens: [],
                  propName: 'midSpec',
               },
               close: toSToken('>'),
            }),
            (result) => {
               const expected = new ElementDeclarationPToken({
                  open: toSToken('<!'),
                  contentModel: {
                     open: toSToken('('),
                     openSpace: toSToken('\t'),
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('a'),
                              nameSpace: toSToken(' '),
                              repeat: undefined,
                              repeatSpace: undefined,
                           },
                           delimiter: toSToken('|'),
                           delimiterSpace: toSToken(' '),
                        },
                        {
                           particle: {
                              open: toSToken('('),
                              openSpace: toSToken(' '),
                              delimitedParticles: [
                                 {
                                    particle: {
                                       name: toSToken('c'),
                                       nameSpace: undefined,
                                       repeat: undefined,
                                       repeatSpace: undefined,
                                    },
                                    delimiter: toSToken(','),
                                    delimiterSpace: toSToken(' '),
                                 },
                                 {
                                    particle: {
                                       name: toSToken('d'),
                                       nameSpace: toSToken(' '),
                                       repeat: undefined,
                                       repeatSpace: undefined,
                                    },
                                    delimiter: undefined,
                                    delimiterSpace: undefined,
                                 },
                              ],
                              close: toSToken(')'),
                              closeSpace: undefined,
                              repeat: undefined,
                              repeatSpace: undefined,
                           },
                           delimiter: undefined,
                           delimiterSpace: undefined,
                        },
                     ],
                     close: toSToken(')'),
                     closeSpace: undefined,
                     repeat: undefined,
                     repeatSpace: undefined,
                  },
                  unexpanded: {
                     tokens: [],
                     propName: 'midSpec',
                  },
                  close: toSToken('>'),
               });

               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(expected);
               done?.();
            },
         );
      });
   });
});

/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import {
   makeAttListDeclaration,
   makeCdata,
   makeCharData,
   makeCharRef,
   makeComment,
   makeConditionalClose,
   makeConditionalStart,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclaration,
   makeElementEmpty,
   makeElementEnd,
   makeElementStart,
   makeGeneralEntityDeclaration,
   makeGeneralEntityReference,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterEntityReference,
   makeProcessingInstruction,
   makeSpace,
   makeTextDecl,
   makeTextPToken,
   makeUnknownDeclaration,
   makeXmlDecl,
} from 'token-test';

import { convertPTokenToSTokens } from '../convertPTokenToSTokens';
import { Warning } from 'wellformedness'; // ick

describe('convertPTokenToSTokens (integration)', () => {
   it('returns an AttListDeclaration', () => {
      expect(convertPTokenToSTokens(makeAttListDeclaration())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<!",
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
             "str": "<!",
           },
           SToken {
             "originalStr": "elStart",
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
             "str": "elStart",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "att1",
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
             "str": "att1",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "CDATA",
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
             "str": "CDATA",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "#REQUIRED",
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
             "str": "#REQUIRED",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": """,
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
             "str": """,
           },
           SToken {
             "originalStr": "x",
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
             "str": "x",
           },
           SToken {
             "originalStr": """,
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
             "str": """,
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a CDataPToken', () => {
      expect(convertPTokenToSTokens(makeCdata())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<![",
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
             "str": "<![",
           },
           SToken {
             "originalStr": "CDATA",
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
             "str": "CDATA",
           },
           SToken {
             "originalStr": "[",
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
             "str": "[",
           },
           SToken {
             "originalStr": "test text",
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
             "str": "test text",
           },
           SToken {
             "originalStr": "]]>",
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
             "str": "]]>",
           },
         ]
      `);
   });

   it('returns a CharData', () => {
      expect(convertPTokenToSTokens(makeCharData())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "test text",
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
             "str": "test text",
           },
         ]
      `);
   });

   it('returns a CharRef', () => {
      expect(convertPTokenToSTokens(makeCharRef())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "&#",
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
             "str": "&#",
           },
           SToken {
             "originalStr": "68",
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
             "str": "68",
           },
           SToken {
             "originalStr": ";",
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
             "str": ";",
           },
         ]
      `);
   });

   it('returns a Comment', () => {
      expect(convertPTokenToSTokens(makeComment())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<!--",
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
             "str": "<!--",
           },
           SToken {
             "originalStr": "commentText",
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
             "str": "commentText",
           },
           SToken {
             "originalStr": "-->",
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
             "str": "-->",
           },
         ]
      `);
   });

   it('returns a ConditionalStart', () => {
      expect(convertPTokenToSTokens(makeConditionalStart())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<[",
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
             "str": "<[",
           },
         ]
      `);
   });

   it('returns a conditionalEnd', () => {
      expect(convertPTokenToSTokens(makeConditionalClose())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "]]>",
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
             "str": "]]>",
           },
         ]
      `);
   });

   it('returns a doctype end', () => {
      expect(convertPTokenToSTokens(makeDocTypeEnd())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "]",
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
             "str": "]",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a doctype start', () => {
      expect(convertPTokenToSTokens(makeDocTypeStart())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<!",
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
             "str": "<!",
           },
           SToken {
             "originalStr": "DOCTYPE",
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
             "str": "DOCTYPE",
           },
           SToken {
             "originalStr": "root",
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
             "str": "root",
           },
           SToken {
             "originalStr": "[",
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
             "str": "[",
           },
         ]
      `);
   });

   it('returns a element declaration', () => {
      expect(convertPTokenToSTokens(makeElementDeclaration())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<!",
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
             "str": "<!",
           },
           SToken {
             "originalStr": "ELEMENT",
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
             "str": "ELEMENT",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "elementName",
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
             "str": "elementName",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "ANY",
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
             "str": "ANY",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a element end', () => {
      expect(convertPTokenToSTokens(makeElementEnd())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "</",
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
             "str": "</",
           },
           SToken {
             "originalStr": "elStart",
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
             "str": "elStart",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a element start', () => {
      expect(convertPTokenToSTokens(makeElementStart())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<",
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
             "str": "<",
           },
           SToken {
             "originalStr": "elStart",
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
             "str": "elStart",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a element empty', () => {
      expect(convertPTokenToSTokens(makeElementEmpty())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<",
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
             "str": "<",
           },
           SToken {
             "originalStr": "elStart",
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
             "str": "elStart",
           },
           SToken {
             "originalStr": "/>",
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
             "str": "/>",
           },
         ]
      `);
   });

   it('returns a general entity declaration', () => {
      expect(convertPTokenToSTokens(makeGeneralEntityDeclaration())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<!",
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
             "str": "<!",
           },
           SToken {
             "originalStr": "geDecl",
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
             "str": "geDecl",
           },
           SToken {
             "originalStr": "blah",
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
             "str": "blah",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a general entity reference', () => {
      expect(convertPTokenToSTokens(makeGeneralEntityReference())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "&",
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
             "str": "&",
           },
           SToken {
             "originalStr": "testRef",
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
             "str": "testRef",
           },
           SToken {
             "originalStr": ";",
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
             "str": ";",
           },
         ]
      `);
   });

   it('returns a notation declaration', () => {
      expect(convertPTokenToSTokens(makeNotationDeclaration())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<!",
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
             "str": "<!",
           },
           SToken {
             "originalStr": "NOTATION",
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
             "str": "NOTATION",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "notationName",
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
             "str": "notationName",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a parameter entity declaration', () => {
      expect(convertPTokenToSTokens(makeParameterEntityDeclaration())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<!",
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
             "str": "<!",
           },
           SToken {
             "originalStr": "%",
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
             "str": "%",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "entityName",
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
             "str": "entityName",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": """,
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
             "str": """,
           },
           SToken {
             "originalStr": "value",
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
             "str": "value",
           },
           SToken {
             "originalStr": """,
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
             "str": """,
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a parameter entity reference', () => {
      expect(convertPTokenToSTokens(makeParameterEntityReference())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "&",
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
             "str": "&",
           },
           SToken {
             "originalStr": "entityName",
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
             "str": "entityName",
           },
           SToken {
             "originalStr": ";",
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
             "str": ";",
           },
         ]
      `);
   });

   it('returns a processing instruction', () => {
      expect(convertPTokenToSTokens(makeProcessingInstruction())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<?",
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
             "str": "<?",
           },
           SToken {
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
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "blah",
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
             "str": "blah",
           },
           SToken {
             "originalStr": "?>",
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
             "str": "?>",
           },
         ]
      `);
   });

   it('returns a space token', () => {
      expect(convertPTokenToSTokens(makeSpace())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
         ]
      `);
   });

   it('returns a text token', () => {
      expect(convertPTokenToSTokens(makeTextPToken('foo'))).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "foo",
             "ranges": [],
             "str": "foo",
           },
         ]
      `);
   });

   it('returns a text declaration', () => {
      expect(convertPTokenToSTokens(makeTextDecl())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<?",
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
             "str": "<?",
           },
           SToken {
             "originalStr": "xml",
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
             "str": "xml",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "version",
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
             "str": "version",
           },
           SToken {
             "originalStr": "=",
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
             "str": "=",
           },
           SToken {
             "originalStr": "1.1",
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
             "str": "1.1",
           },
           SToken {
             "originalStr": "?>",
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
             "str": "?>",
           },
         ]
      `);
   });

   it('returns a unknown declaration', () => {
      expect(convertPTokenToSTokens(makeUnknownDeclaration())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "",
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
             "str": "",
           },
         ]
      `);
   });

   it('returns a xml declaration', () => {
      expect(convertPTokenToSTokens(makeXmlDecl())).toMatchInlineSnapshot(`
         [
           SToken {
             "originalStr": "<?",
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
             "str": "<?",
           },
           SToken {
             "originalStr": "xml",
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
             "str": "xml",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "version",
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
             "str": "version",
           },
           SToken {
             "originalStr": "=",
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
             "str": "=",
           },
           SToken {
             "originalStr": "1.1",
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
             "str": "1.1",
           },
           SToken {
             "originalStr": "?>",
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
             "str": "?>",
           },
         ]
      `);
   });

   it('returns an empty array when encountering an error', () => {
      expect(convertPTokenToSTokens(new Warning('foobar'))).toMatchInlineSnapshot(`[]`);
   });
});

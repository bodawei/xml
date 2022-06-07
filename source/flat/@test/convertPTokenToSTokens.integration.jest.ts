/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

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
         Array [
           SToken {
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
           SToken {
             "originalStr": "elStart",
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
             "str": "elStart",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "att1",
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
             "str": "att1",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "CDATA",
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
             "str": "CDATA",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "#REQUIRED",
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
             "str": "#REQUIRED",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "\\"",
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
             "str": "\\"",
           },
           SToken {
             "originalStr": "x",
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
             "str": "x",
           },
           SToken {
             "originalStr": "\\"",
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
             "str": "\\"",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a CDataPToken', () => {
      expect(convertPTokenToSTokens(makeCdata())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "<![",
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
             "str": "<![",
           },
           SToken {
             "originalStr": "CDATA",
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
             "str": "CDATA",
           },
           SToken {
             "originalStr": "[",
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
             "str": "[",
           },
           SToken {
             "originalStr": "test text",
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
             "str": "test text",
           },
           SToken {
             "originalStr": "]]>",
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
             "str": "]]>",
           },
         ]
      `);
   });

   it('returns a CharData', () => {
      expect(convertPTokenToSTokens(makeCharData())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "test text",
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
             "str": "test text",
           },
         ]
      `);
   });

   it('returns a CharRef', () => {
      expect(convertPTokenToSTokens(makeCharRef())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "&#",
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
             "str": "&#",
           },
           SToken {
             "originalStr": "68",
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
             "str": "68",
           },
           SToken {
             "originalStr": ";",
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
             "str": ";",
           },
         ]
      `);
   });

   it('returns a Comment', () => {
      expect(convertPTokenToSTokens(makeComment())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "<!--",
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
             "str": "<!--",
           },
           SToken {
             "originalStr": "commentText",
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
             "str": "commentText",
           },
           SToken {
             "originalStr": "-->",
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
             "str": "-->",
           },
         ]
      `);
   });

   it('returns a ConditionalStart', () => {
      expect(convertPTokenToSTokens(makeConditionalStart())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "<[",
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
             "str": "<[",
           },
         ]
      `);
   });

   it('returns a conditionalEnd', () => {
      expect(convertPTokenToSTokens(makeConditionalClose())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "]]>",
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
             "str": "]]>",
           },
         ]
      `);
   });

   it('returns a doctype end', () => {
      expect(convertPTokenToSTokens(makeDocTypeEnd())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "]",
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
             "str": "]",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a doctype start', () => {
      expect(convertPTokenToSTokens(makeDocTypeStart())).toMatchInlineSnapshot(`
         Array [
           SToken {
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
           SToken {
             "originalStr": "DOCTYPE",
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
             "str": "DOCTYPE",
           },
           SToken {
             "originalStr": "root",
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
             "str": "root",
           },
           SToken {
             "originalStr": "[",
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
             "str": "[",
           },
         ]
      `);
   });

   it('returns a element declaration', () => {
      expect(convertPTokenToSTokens(makeElementDeclaration())).toMatchInlineSnapshot(`
         Array [
           SToken {
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
           SToken {
             "originalStr": "ELEMENT",
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
             "str": "ELEMENT",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "elementName",
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
             "str": "elementName",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "ANY",
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
             "str": "ANY",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a element end', () => {
      expect(convertPTokenToSTokens(makeElementEnd())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "</",
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
             "str": "</",
           },
           SToken {
             "originalStr": "elStart",
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
             "str": "elStart",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a element start', () => {
      expect(convertPTokenToSTokens(makeElementStart())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "<",
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
             "str": "<",
           },
           SToken {
             "originalStr": "elStart",
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
             "str": "elStart",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a element empty', () => {
      expect(convertPTokenToSTokens(makeElementEmpty())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "<",
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
             "str": "<",
           },
           SToken {
             "originalStr": "elStart",
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
             "str": "elStart",
           },
           SToken {
             "originalStr": "/>",
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
             "str": "/>",
           },
         ]
      `);
   });

   it('returns a general entity declaration', () => {
      expect(convertPTokenToSTokens(makeGeneralEntityDeclaration())).toMatchInlineSnapshot(`
         Array [
           SToken {
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
           SToken {
             "originalStr": "geDecl",
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
             "str": "geDecl",
           },
           SToken {
             "originalStr": "blah",
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
             "str": "blah",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a general entity reference', () => {
      expect(convertPTokenToSTokens(makeGeneralEntityReference())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "&",
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
             "str": "&",
           },
           SToken {
             "originalStr": "testRef",
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
             "str": "testRef",
           },
           SToken {
             "originalStr": ";",
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
             "str": ";",
           },
         ]
      `);
   });

   it('returns a notation declaration', () => {
      expect(convertPTokenToSTokens(makeNotationDeclaration())).toMatchInlineSnapshot(`
         Array [
           SToken {
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
           SToken {
             "originalStr": "NOTATION",
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
             "str": "NOTATION",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "notationName",
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
             "str": "notationName",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a parameter entity declaration', () => {
      expect(convertPTokenToSTokens(makeParameterEntityDeclaration())).toMatchInlineSnapshot(`
         Array [
           SToken {
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
           SToken {
             "originalStr": "%",
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
             "str": "%",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "entityName",
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
             "str": "entityName",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "\\"",
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
             "str": "\\"",
           },
           SToken {
             "originalStr": "value",
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
             "str": "value",
           },
           SToken {
             "originalStr": "\\"",
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
             "str": "\\"",
           },
           SToken {
             "originalStr": ">",
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
             "str": ">",
           },
         ]
      `);
   });

   it('returns a parameter entity reference', () => {
      expect(convertPTokenToSTokens(makeParameterEntityReference())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "&",
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
             "str": "&",
           },
           SToken {
             "originalStr": "entityName",
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
             "str": "entityName",
           },
           SToken {
             "originalStr": ";",
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
             "str": ";",
           },
         ]
      `);
   });

   it('returns a processing instruction', () => {
      expect(convertPTokenToSTokens(makeProcessingInstruction())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "<?",
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
             "str": "<?",
           },
           SToken {
             "originalStr": "foo",
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
             "str": "foo",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "blah",
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
             "str": "blah",
           },
           SToken {
             "originalStr": "?>",
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
             "str": "?>",
           },
         ]
      `);
   });

   it('returns a space token', () => {
      expect(convertPTokenToSTokens(makeSpace())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
         ]
      `);
   });

   it('returns a text token', () => {
      expect(convertPTokenToSTokens(makeTextPToken('foo'))).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "foo",
             "ranges": Array [],
             "str": "foo",
           },
         ]
      `);
   });

   it('returns a text declaration', () => {
      expect(convertPTokenToSTokens(makeTextDecl())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "<?",
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
             "str": "<?",
           },
           SToken {
             "originalStr": "xml",
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
             "str": "xml",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "version",
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
             "str": "version",
           },
           SToken {
             "originalStr": "=",
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
             "str": "=",
           },
           SToken {
             "originalStr": "1.1",
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
             "str": "1.1",
           },
           SToken {
             "originalStr": "?>",
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
             "str": "?>",
           },
         ]
      `);
   });

   it('returns a unknown declaration', () => {
      expect(convertPTokenToSTokens(makeUnknownDeclaration())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "",
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
             "str": "",
           },
         ]
      `);
   });

   it('returns a xml declaration', () => {
      expect(convertPTokenToSTokens(makeXmlDecl())).toMatchInlineSnapshot(`
         Array [
           SToken {
             "originalStr": "<?",
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
             "str": "<?",
           },
           SToken {
             "originalStr": "xml",
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
             "str": "xml",
           },
           SToken {
             "originalStr": " ",
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
             "str": " ",
           },
           SToken {
             "originalStr": "version",
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
             "str": "version",
           },
           SToken {
             "originalStr": "=",
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
             "str": "=",
           },
           SToken {
             "originalStr": "1.1",
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
             "str": "1.1",
           },
           SToken {
             "originalStr": "?>",
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
             "str": "?>",
           },
         ]
      `);
   });

   it('returns an empty array when encountering an error', () => {
      expect(convertPTokenToSTokens(new Warning('foobar'))).toMatchInlineSnapshot('Array []');
   });
});

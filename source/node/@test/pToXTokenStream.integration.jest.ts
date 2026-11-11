/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { STokenSource } from 'basic';
import { describe, expect, it } from 'vitest';

import { PTokenStream } from '../pTokenStream';
import { PToXTokenStream } from '../pToXTokenStream';
import { gatherStream } from './helpers';

describe('PToXTokenStream (integration)', () => {
   let source: STokenSource;
   let parseStream: PTokenStream;
   let pToXTokenStream: PToXTokenStream;

   beforeEach(() => {
      source = new STokenSource();
      parseStream = new PTokenStream(source);
      pToXTokenStream = new PToXTokenStream({});
   });

   it('converts a many featured document into a series of XTokens', () =>
      new Promise<void>((done) => {
         source.addText(`<?xml version="1.0" ?>
      <!DOCTYPE test [
         <!ELEMENT test ANY>
      ]>
      <!-- Demonstrates basic proessing -->
      <doc>
         This is a test.
      </doc>`);
         source.endText();
         parseStream.pipe(pToXTokenStream);

         gatherStream(
            pToXTokenStream,
            (results) => {
               const noPTokens = results.map((token) => {
                  if ('pToken' in token) {
                     delete token.pToken;
                  }

                  return token;
               });

               expect(noPTokens).toMatchInlineSnapshot(`
               [
                 ConformanceVersion {
                   "edition": 5,
                   "type": "CONFORMANCE_VERSION",
                   "version": 1,
                 },
                 EntityId {
                   "publicId": undefined,
                   "systemId": "./document.xml",
                   "type": "ENTITY_ID",
                 },
                 XmlDeclarationXToken {
                   "encoding": "utf-8",
                   "standalone": false,
                   "type": "XMLDECL_XTOKEN",
                   "version": 1,
                 },
                 SpaceXToken {
                   "text": "
                     ",
                   "type": "SPACE_XTOKEN",
                 },
                 DocTypeStartXToken {
                   "externalId": undefined,
                   "name": "test",
                   "type": "DOCTYPE_START_XTOKEN",
                 },
                 SpaceXToken {
                   "text": "
                        ",
                   "type": "SPACE_XTOKEN",
                 },
                 ElementDeclarationXToken {
                   "contentModel": undefined,
                   "contentSpec": "ANY",
                   "name": "test",
                   "type": "ELEMENT_DECLARATION_XTOKEN",
                 },
                 SpaceXToken {
                   "text": "
                     ",
                   "type": "SPACE_XTOKEN",
                 },
                 DocTypeEndXToken {
                   "type": "DOCTYPE_END_XTOKEN",
                 },
                 SpaceXToken {
                   "text": "
                     ",
                   "type": "SPACE_XTOKEN",
                 },
                 CommentXToken {
                   "text": " Demonstrates basic proessing ",
                   "type": "COMMENT_XTOKEN",
                 },
                 SpaceXToken {
                   "text": "
                     ",
                   "type": "SPACE_XTOKEN",
                 },
                 ElementStartXToken {
                   "attributes": [],
                   "name": "doc",
                   "type": "ELEMENT_START_XTOKEN",
                 },
                 CharDataXToken {
                   "text": "
                        This is a test.
                     ",
                   "type": "CHARDATA_XTOKEN",
                 },
                 ElementEndXToken {
                   "name": "doc",
                   "type": "ELEMENT_END_XTOKEN",
                 },
               ]
            `);
            },
            done!,
         );
      }));
});

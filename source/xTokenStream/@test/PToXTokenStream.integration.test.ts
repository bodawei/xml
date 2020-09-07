/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range, EntityId } from 'basic';
import { SToken, STokenSource } from 'sToken';
import {
   declaration,

   attListDeclaration,
   elementDeclaration,

   CdataXToken,
   CharDataXToken,
   CommentXToken,
   DocTypeEndXToken,
   DocTypeStartXToken,
   ElementEndXToken,
   ElementStartXToken,
   ElementEmptyXToken,
      GeneralEntityDeclarationXToken,
   NotationDeclarationXToken,
   
   ProcessingInstructionXToken,
   SpaceXToken,
   TextXToken,
   TextPToken,
} from 'token';

import { PTokenStream } from '../../pTokenStream';
import PToXTokenStream from '../PToXTokenStream';
import { ParameterEntityReferenceXToken, XmlDeclarationXToken } from 'xToken';
import { GeneralEntityReferenceXToken } from 'source/xToken/token/generalEntityReferenceXToken';
import { ExternalIdXToken } from 'source/xToken/token/externalIdXToken';
import { defaultExtractors } from 'extractor';

type Token = { type: string, pToken?: any };
type TokenArray = Array<Token>;

describe('PToXTokenStream (integration)', () => {
   let pTokenStream: PTokenStream;
   let tokenStream: PToXTokenStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream(new STokenSource(defaultExtractors));
      tokenStream = new PToXTokenStream();
      pTokenStream.pipe(tokenStream);
   });

   function expectInputToProduce(inputDocument: string, expecteds: TokenArray | Token, done: () => void) {
      const results: TokenArray = [];

      pTokenStream.addText(inputDocument);
      pTokenStream.endText();

      tokenStream.on('data', (data: Token) => results.push(data));
      tokenStream.on('end', () => {
         if (!Array.isArray(expecteds)) {
            expecteds = [ expecteds ];
         }

         expecteds.forEach((expected) => {
            const actuals = results.filter((actual) => actual instanceof expected.constructor);

            delete actuals[0].pToken;
            delete expected.pToken;

            expect(actuals[0]).toEqual(expected);
         });
         done();
      });
   }

   it('tokenizes an UNKNOWN declaration', (done) => {
      expectInputToProduce('<!BOGUS', [
         new declaration.XToken(),
      ], done);
   });

   it('tokenizes an ATTLIST declaration', (done) => {
      expectInputToProduce('<!ATTLIST elementName atOne IDREF atTwo ENTITY>', [
         new attListDeclaration.XToken('elementName', [{
            name: 'atOne',
            type: 'IDREF',
            defaultType: '',
            value: [],
         }, {
            name: 'atTwo',
            type: 'ENTITY',
            defaultType: '',
            value: [],
         }], new attListDeclaration.PToken({ open: SToken.fromString('<!') })),
      ], done);
   });

   it('tokenizes a CDATA element', (done) => {
      expectInputToProduce('<![CDATA[zowie<one> ]]>', new CdataXToken('zowie<one> '), done);
   });

   it('tokenizes a charData', (done) => {
      expectInputToProduce('some$ text ', new CharDataXToken('some$ text '), done);
   });

   it('tokenizes a comment', (done) => {
      expectInputToProduce('<!--foo-->', new CommentXToken('foo'), done);
   });

   it('tokenizes a DOCTYPE start and end', (done) => {
      expectInputToProduce('<!DOCTYPE one>', [
         new DocTypeStartXToken('one', undefined as any, false),
         new DocTypeEndXToken(),
      ], done);
   });

   it('tokenizes an element start', (done) => {
      expectInputToProduce('<elementName>', [
         new ElementStartXToken('elementName', []),
      ], done);
   });

   it('tokenizes an empty element', (done) => {
      expectInputToProduce('<elementName/>', [
         new ElementEmptyXToken('elementName', []),
      ], done);
   });

   it('tokenizes an element end', (done) => {
      expectInputToProduce('</elementName>', [
         new ElementEndXToken('elementName'),
      ], done);
   });

   it('tokenizes an ELEMENT declaration', (done) => {
      expectInputToProduce('<!ELEMENT myElement (one,two+)*>', [
         new elementDeclaration.XToken('myElement', 'CHILDREN', {
            names: [{
               name: 'one',
               repeat: 'ONE',
            }, {
               name: 'two',
               repeat: 'ONEPLUS',
            }],
            listType: 'SEQUENCE',
            repeat: 'ZEROPLUS',
          }),
      ], done);
   });

   it('tokenizes an ENTITY declaration', (done) => {
      const pToken = new TextPToken({ text: new SToken('value', 'value', new Range(new EntityId(), 21, 0, 21, 26, 0, 26)) });

      expectInputToProduce('<!ENTITY entityName "value">', [
         new GeneralEntityDeclarationXToken('entityName', [ pToken ], undefined, ''),
      ], done);
   });

   it('tokenizes an entity reference', (done) => {
      expectInputToProduce('&entityRef;', [
         new GeneralEntityReferenceXToken('entityRef'),
      ], done);
   });

   it('tokenizes a parameter entity reference', (done) => {
      expectInputToProduce('%peRef;', [
         new ParameterEntityReferenceXToken('peRef'),
      ], done);
   });

   it('nokenizes a NOTATION declaration', (done) => {
      expectInputToProduce('<!NOTATION myNotation PUBLIC "pub.xml"     "sys.xml" >', [
         new NotationDeclarationXToken('myNotation', new ExternalIdXToken('sys.xml', 'pub.xml')),
      ], done);
   });

   it('tokenizes a processing instruction', (done) => {
      expectInputToProduce('<?frozboz askfhasdfkh kje  adsf ?>', [
         new ProcessingInstructionXToken('frozboz', 'askfhasdfkh kje  adsf '),
      ], done);
   });

   it('tokenizes spaces', (done) => {
      expectInputToProduce('<?xml version="1.0"?>   <one></one>', [
         new SpaceXToken('   '),
      ], done);
   });

   it('tokenizes text', (done) => {
      const results: TokenArray = [];
      tokenStream.write(new TextPToken({ text: SToken.fromString('foo') }));
      tokenStream.end();
      tokenStream.on('data', (xToken: Token) => results.push(xToken));

      tokenStream.on('end', () => {
         expect((results[0] as TextXToken).text).toEqual('foo');
         done();
      });
   });

   it('tokenized an Xml Declaration', (done) => {
      expectInputToProduce('<?xml version="1.0"?>', [
         new XmlDeclarationXToken(1.0) ], done);
   });

});

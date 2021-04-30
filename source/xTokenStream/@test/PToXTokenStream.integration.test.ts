/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { gatherStreamResults } from 'basic-test';
import { STokenSource, toSToken } from 'sToken';
import {
   AttListDeclarationXToken,
   AttDefinitionType,
   CdataXToken,
   CharDataXToken,
   CommentXToken,
   DocTypeEndXToken,
   ElementEndXToken,
   ElementEmptyXToken,
   ElementStartXToken,
   ExternalIdX,
   GeneralEntityDeclarationXToken,
   ParameterEntityReferenceXToken,
   ProcessingInstructionXToken,
   XmlDeclarationXToken,
   NotationDeclarationXToken,
   GeneralEntityReferenceXToken,
   SpaceXToken,
   TextXToken,
} from 'xToken';
import { stripPTokens } from 'xToken-test';
import {
   declaration,
   DocTypeStartXToken,
} from 'token';

import { PTokenStream } from '../../pTokenStream';
import PToXTokenStream from '../PToXTokenStream';
import { TextPToken } from 'pToken';

type Token = unknown;

describe('PToXTokenStream (integration)', () => {
   let pTokenStream: PTokenStream;
   let tokenStream: PToXTokenStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream(new STokenSource());
      tokenStream = new PToXTokenStream();
      pTokenStream.pipe(tokenStream);
   });

   function expectInputToProduce(inputDocument: string, expecteds: Array<Token> | Token, done: () => void) {
      pTokenStream.addText(inputDocument);
      pTokenStream.endText();

      gatherStreamResults<Token>(tokenStream, (results) => {
         let arrExpected: Array<Token>;

         if (!Array.isArray(expecteds)) {
            arrExpected = [ expecteds ];
         } else {
            arrExpected = expecteds;
         }

         arrExpected.forEach((expected) => {
            const actuals = results.filter((actual) => actual instanceof (expected as any).constructor);

            stripPTokens(actuals);
            stripPTokens(expected);

            expect(actuals[0]).toEqual(expected as any);
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
         new AttListDeclarationXToken('elementName', [{
            name: 'atOne',
            type: AttDefinitionType.IDREF,
            defaultType: undefined,
            value: [],
         }, {
            name: 'atTwo',
            type: AttDefinitionType.ENTITY,
            defaultType: undefined,
            value: [],
         }]),
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

   // it('tokenizes an ELEMENT declaration', (done) => {
   //    expectInputToProduce('<!ELEMENT myElement (one,two+)*>', [
   //       new ElementDeclarationXToken('myElement', 'CHILDREN', {
   //          particles: [{
   //             name: 'one',
   //             repeat: CpRepeat.ONE,
   //          }, {
   //             name: 'two',
   //             repeat: CpRepeat.ONEPLUS,
   //          }],
   //          listType: CpType.SEQUENCE,
   //          repeat: CpRepeat.ZEROPLUS,
   //        }),
   //    ], done);
   // });

   it('tokenizes an ENTITY declaration', (done) => {
      expectInputToProduce('<!ENTITY entityName "value">', [
         new GeneralEntityDeclarationXToken('entityName', [ 'value' ], undefined, ''),
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

   it('tokenizes a NOTATION declaration', (done) => {
      expectInputToProduce('<!NOTATION myNotation PUBLIC "pub.xml"     "sys.xml" >', [
         new NotationDeclarationXToken('myNotation', new ExternalIdX('sys.xml', 'pub.xml')),
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
      tokenStream.write(new TextPToken({ text: toSToken('foo') }));
      tokenStream.end();
      gatherStreamResults<Token>(tokenStream, (results) => {
         expect((results[0] as TextXToken).text).toEqual('foo');
         done();
      });
   });

   it('tokenized an Xml Declaration', (done) => {
      expectInputToProduce('<?xml version="1.0"?>', [
         new XmlDeclarationXToken(1.0) ], done);
   });

});

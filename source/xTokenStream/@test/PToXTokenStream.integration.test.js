/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../basic';
import { PTokenStream } from '../../pTokenStream';
import {
   declaration,
   envelope,

   attListDeclaration,
   cdata,
   charData,
   comment,
   docTypeStart,
   docTypeEnd,
   entityDeclaration,
   elementEnd,
   elementStart,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
   text,
   xmlDeclaration,
} from '../../token';
import { SToken } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import PToXTokenStream from '../PToXTokenStream.js';

describe('PToXTokenStream (integration)', () => {
   let pTokenStream;
   let tokenStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream();
      tokenStream = new PToXTokenStream();
      pTokenStream.pipe(tokenStream);
   });

   function expectInputToProduce(inputDocument, expecteds, done) {
      const results = [];

      pTokenStream.addText(inputDocument);
      pTokenStream.endText();

      tokenStream.on('data', (data) => results.push(data));
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
         new declaration.XToken([]),
      ], done);
   });

   it('tokenizes an UNKNOWN envelope', (done) => {
      expectInputToProduce('<![BOGUS[', [
         new envelope.XToken([]),
      ], done);
   });

   it('tokenizes an ATTLIST declaration', (done) => {
      expectInputToProduce('<!ATTLIST elementName >', [
         new attListDeclaration.XToken('elementName', [], new attListDeclaration.PToken()),
      ], done);
   });

   it('tokenizes a CDATA element', (done) => {
      expectInputToProduce('<![CDATA[zowie<one> ]]>', new cdata.XToken('zowie<one> ', []), done);
   });

   it('tokenizes a charData', (done) => {
      expectInputToProduce('some$ text ', new charData.XToken('some$ text ', []), done);
   });

   it('tokenizes a comment', (done) => {
      expectInputToProduce('<!--foo-->', new comment.XToken('foo', []), done);
   });

   it('tokenizes a DOCTYPE start and end', (done) => {
      expectInputToProduce('<!DOCTYPE one>', [
         new docTypeStart.XToken('one', undefined, false, []),
         new docTypeEnd.XToken([]),
      ], done);
   });

   it('tokenizes an element start', (done) => {
      expectInputToProduce('<elementName>', [
         new elementStart.XToken('elementName', [], []),
      ], done);
   });

   it('tokenizes an empty element', (done) => {
      expectInputToProduce('<elementName/>', [
         new elementStart.EmptyToken('elementName', [], []),
      ], done);
   });

   it('tokenizes an element end', (done) => {
      expectInputToProduce('</elementName>', [
         new elementEnd.XToken('elementName', []),
      ], done);
   });

   it('tokenizes an ENTITY declaration', (done) => {
      const pToken = new text.PToken();
      pToken.text = new SToken('value', 'value', new Range(new EntityLocation(), 21, 0, 21, 26, 0, 26));

      expectInputToProduce('<!ENTITY entityName "value">', [
         new entityDeclaration.XToken('entityName', [ pToken ], undefined, '', []),
      ], done);
   });

   it('tokenizes an entity reference', (done) => {
      expectInputToProduce('&entityRef;', [
         new entityReference.XToken('entityRef', []),
      ], done);
   });

   it('tokenizes a parameter entity reference', (done) => {
      expectInputToProduce('%peRef;', [
         new entityReference.ParamXToken('peRef', []),
      ], done);
   });

   it('nokenizes a NOTATION declaration', (done) => {
      expectInputToProduce('<!NOTATION myNotation PUBLIC "pub.xml"     "sys.xml" >', [
         new notationDeclaration.XToken('myNotation', new EntityLocation('sys.xml', 'pub.xml'), []),
      ], done);
   });

   it('tokenizes a processing instruction', (done) => {
      expectInputToProduce('<?frozboz askfhasdfkh kje  adsf ?>', [
         new processingInstruction.XToken('frozboz', 'askfhasdfkh kje  adsf ', []),
      ], done);
   });

   it('tokenizes spaces', (done) => {
      expectInputToProduce('<?xml version="1.0"?>   <one></one>', [
         new space.XToken('   ', []),
      ], done);
   });

   it('tokenizes text', (done) => {
      const results = [];
      const sTokenMaker = makeSTokenMaker();
      tokenStream.write({
         type: text.PTYPE,
         text: sTokenMaker('foo'),
      });
      tokenStream.end();
      tokenStream.on('data', (xToken) => results.push(xToken));

      tokenStream.on('end', () => {
         expect(results[0].text).toEqual('foo');
         done();
      });
   });

   it('tokenized an Xml Declaration', (done) => {
      expectInputToProduce('<?xml version="1.0"?>', [
         new xmlDeclaration.XToken([ {
            name: 'version',
            value: '1.0',
         } ], []) ], done);
   });

});

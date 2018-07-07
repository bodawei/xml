/* Copyright ® 2017-2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { PTokenStream } from '../../pTokenStream';
import { PToXTokenStream } from '../../xTokenStream';
import { SToken } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';
import * as tokenNs from '../../token';

import EntityManager from '../EntityManager.js';
import NodeStream from '../NodeStream.js';

describe('NodeStream (integration)', () => {

   function matchTokenTypes(actual, expected) {
      let expectedIndex = 0;

      for (let actualIndex = 0; actualIndex < actual.length; actualIndex++) {
         if (actual[actualIndex].type === EntityMetaData.TYPE ||
            actual[actualIndex] instanceof tokenNs.space.XToken) {
            continue;
         }

         expect(actual[actualIndex] instanceof expected[expectedIndex]).toEqual(true);
         expectedIndex++;
      }
   }

   it('adds two levels of entities', (done) => {
      const results = [];
      const manager = new EntityManager();
      const pTokenStream = new PTokenStream();
      const xTokenStream = new PToXTokenStream();
      const node = new NodeStream(manager);
      pTokenStream.pipe(xTokenStream).pipe(node);

      node.on('data', (token) => results.push(token));
      node.on('end', () => {
         matchTokenTypes(results, [
            tokenNs.xmlDeclaration.XToken,
            tokenNs.docTypeStart.XToken,
            tokenNs.entityDeclaration.XToken,
            tokenNs.docTypeEnd.XToken,
            tokenNs.elementStart.XToken,
            tokenNs.entityStart.XToken,
            tokenNs.entityStart.XToken,
            tokenNs.charData.XToken,
            tokenNs.entityEnd.XToken,
            tokenNs.charData.XToken,
            tokenNs.entityStart.XToken,
            tokenNs.charData.XToken,
            tokenNs.entityEnd.XToken,
            tokenNs.entityEnd.XToken,
            tokenNs.elementEnd.XToken,
         ]);
         done();
      });
      pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one ' +
         '[<!ENTITY child "&quot;grandchild&quot;">]><one>&child;</one>');
      pTokenStream.endText();
   });

   it('adds the content of parameter entities, which can declare general entities', (done) => {
      const results = [];
      const manager = new EntityManager();
      const pTokenStream = new PTokenStream();
      const xTokenStream = new PToXTokenStream();
      const node = new NodeStream(manager);
      pTokenStream.pipe(xTokenStream).pipe(node);

      node.on('data', (token) => results.push(token));
      node.on('end', () => {
         /* eslint-disable indent */
         matchTokenTypes(results, [
            tokenNs.xmlDeclaration.XToken,
            tokenNs.docTypeStart.XToken,
               tokenNs.entityDeclaration.ParamXToken,
               tokenNs.entityStart.ParamXToken,
                  tokenNs.entityDeclaration.XToken,
               tokenNs.entityEnd.ParamXToken,
            tokenNs.docTypeEnd.XToken,
            tokenNs.elementStart.XToken,
               tokenNs.entityStart.XToken,
                  tokenNs.charData.XToken,
               tokenNs.entityEnd.XToken,
            tokenNs.elementEnd.XToken,
         ]);
         /* eslint-enable indent */
         done();
      });
      pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % pEntity "<!ENTITY genEntity 'foo'>">
            %pEntity;
         ]>
         <one>
            &genEntity;
         </one>`);
      pTokenStream.endText();
   });

   describe('ATTLIST declaration processing', () => {

      it('expands an parameter entity that makes up the attlist declaration body', (done) => {
         const results = [];
         const manager = new EntityManager();
         const pTokenStream = new PTokenStream();
         const xTokenStream = new PToXTokenStream();
         const node = new NodeStream(manager);
         pTokenStream.pipe(xTokenStream).pipe(node);
         node.on('data', (token) => results.push(token));
         node.on('end', () => {
            const attListDecl = results[4];

            expect(attListDecl.elementName).toEqual('foo');
            done();
         });

         pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % middle "foo">' +
            '<!ATTLIST %middle;>' +
         ']>');
         pTokenStream.endText();
      });

      it('expands an parameter entity that makes up an ENUMERATION', (done) => {
         const results = [];
         const manager = new EntityManager();
         const pTokenStream = new PTokenStream();
         const xTokenStream = new PToXTokenStream();
         const node = new NodeStream(manager);
         pTokenStream.pipe(xTokenStream).pipe(node);
         node.on('data', (token) => results.push(token));
         node.on('end', () => {
            const attListDecl = results[5];

            expect(attListDecl.attDefs[0]).toEqual({
               name: 'attr1',
               type: 'ENUMERATION',
               enumeration: {
                  names: [{
                     name: 'four',
                     repeat: 'ONE',
                  }, {
                     name: 'five',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ONE',
               },
               defaultType: '#REQUIRED',
               value: [],
            });
            done();
         });

         pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ELEMENT one ANY>' +
            '<!ENTITY % goodies "( four | five ) #REQUIRED">' +
            '<!ATTLIST one attr1 %goodies;>' +
         ']>');
         pTokenStream.endText();
      });

   });

   describe('ELEMENT declaration processing', () => {

      it('expands a parameter entity embedded in the content spec', (done) => {
         const results = [];
         const manager = new EntityManager();
         const pTokenStream = new PTokenStream();
         const xTokenStream = new PToXTokenStream();
         const node = new NodeStream(manager);
         pTokenStream.pipe(xTokenStream).pipe(node);
         node.on('data', (token) => results.push(token));
         node.on('end', () => {
            const elementDecl = results[4];

            expect(elementDecl.name).toEqual('one');
            expect(elementDecl.children).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ONE',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               }, {
                  name: 'three',
                  repeat: 'ONE',
               } ],
               listType: 'CHOICE',
               repeat: 'ONE'
            });
            done();
         });

         pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % middle "two">' +
            '<!ELEMENT one ( one | %middle; | three)>' +
         ']>');
         pTokenStream.endText();
      });

   });

   describe('ENTITY declaration processing', () => {

      it('expands an parameter entity values in an EntityValue', (done) => {
         const results = [];
         const manager = new EntityManager();
         const pTokenStream = new PTokenStream();
         const xTokenStream = new PToXTokenStream();
         const node = new NodeStream(manager);
         pTokenStream.pipe(xTokenStream).pipe(node);
   
         node.on('data', (token) => results.push(token));
         node.on('end', () => {
            const valueArray = results[4].value;
            expect(valueArray[0].text.str).toEqual('one');
            expect(valueArray[1]).toEqual(new tokenNs.entityStart.ParamPToken({ refPToken: valueArray[1].refPToken }));
            expect(valueArray[2].text.str).toEqual('two');
            expect(valueArray[3]).toEqual(new tokenNs.entityEnd.ParamPToken({ refPToken: valueArray[1].refPToken }));
            done();
         });
         pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one ' +
            '[<!ENTITY % peOne "two"><!ENTITY child "one%peOne;">]>');
         pTokenStream.endText();
      });
  
      it('expands an parameter entity inside a parameter entity inside the EntityValue', (done) => {
         const results = [];
         const manager = new EntityManager();
         const pTokenStream = new PTokenStream();
         const xTokenStream = new PToXTokenStream();
         const node = new NodeStream(manager);
         pTokenStream.pipe(xTokenStream).pipe(node);
   
         node.on('data', (token) => results.push(token));
         node.on('end', () => {
            const valueArray = results[5].value;
            expect(valueArray[0].text.str).toEqual('[');
            expect(valueArray[1]).toEqual(new tokenNs.entityStart.ParamPToken({ refPToken: valueArray[1].refPToken }));
            expect(valueArray[2].text.str).toEqual('(');
            expect(valueArray[3]).toEqual(new tokenNs.entityStart.ParamPToken({ refPToken: valueArray[3].refPToken }));
            expect(valueArray[4].text.str).toEqual('inner');
            expect(valueArray[5]).toEqual(new tokenNs.entityEnd.ParamPToken({ refPToken: valueArray[3].refPToken }));
            expect(valueArray[6].text.str).toEqual(')');
            expect(valueArray[7]).toEqual(new tokenNs.entityEnd.ParamPToken({ refPToken: valueArray[1].refPToken }));
            expect(valueArray[8].text.str).toEqual(']');
            done();
         });
         pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % peTwo "inner">' +
            '<!ENTITY % peOne "(%peTwo;)">' +
            '<!ENTITY child "[%peOne;]">' +
         ']>');
         pTokenStream.endText();
      });
  
      it('expands a parameter entity that makes up the entity declaration body', (done) => {
         const results = [];
         const manager = new EntityManager();
         const pTokenStream = new PTokenStream();
         const xTokenStream = new PToXTokenStream();
         const node = new NodeStream(manager);
         pTokenStream.pipe(xTokenStream).pipe(node);
         node.on('data', (token) => results.push(token));
         node.on('end', () => {
            const entityDecl = results[6];
            const values = entityDecl.value;

            expect(entityDecl.name).toEqual('child');
            expect(values[0].text.str).toEqual('[(inner)]');
            done();
         });

         pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % peTwo "inner">' +
            '<!ENTITY % peOne "(%peTwo;)">' +
            '<!ENTITY % body \'child "[%peOne;]"\'>' +
            '<!ENTITY %body;>' +
         ']>');
         pTokenStream.endText();
      });
  
   });

   describe('NOTATION declaration processing', () => {

      it('expands an parameter entity that makes up the notation declaration body', (done) => {
         const results = [];
         const manager = new EntityManager();
         const pTokenStream = new PTokenStream();
         const xTokenStream = new PToXTokenStream();
         const node = new NodeStream(manager);
         pTokenStream.pipe(xTokenStream).pipe(node);
         node.on('data', (token) => results.push(token));
         node.on('end', () => {
            const notationDecl = results[5];

            expect(notationDecl.name).toEqual('foo');
            expect(notationDecl.externalId.publicId).toEqual('http://somewhere.com');
            done();
         });

         pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % url "http://somewhere.com">' +
            '<!ENTITY % middle \'PUBLIC "%url;"\'>' +
            '<!NOTATION foo %middle;>' +
         ']>');
         pTokenStream.endText();
      });

   });

   describe('element start processing', () => {
      let pTokenStream;
      let node;
      let makeSToken;

      beforeEach(() => {
         pTokenStream = new PTokenStream();

         const manager = new EntityManager();
         const xTokenStream = new PToXTokenStream();
         node = new NodeStream(manager);

         pTokenStream.pipe(xTokenStream).pipe(node);

         makeSToken = makeSTokenMaker();
      });

      function expectProcessing(input, check) {
         const results = [];

         node.on('data', (token) => results.push(token));
         node.on('end', () => {
            check(results);
         });

         pTokenStream.addText(input);
         pTokenStream.endText();
      }

      it('expands general entity references in attributes', (done) => {
         expectProcessing('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY child "(child)">' +
         ']>' +
         '<one child="&child;"/>', (results) => {
            const element = results[5];

            expect(element.attributes[0].value).toEqual([
               new tokenNs.entityStart.XToken('child'),
               new tokenNs.text.XToken('(child)', new tokenNs.text.PToken({
                  text: makeSToken('(child)'),
               })),
               new tokenNs.entityEnd.XToken('child'),
            ]);
            done();
         });
      });

      it('expands a nested entity reference', (done) => {
         const makeChildSToken = makeSTokenMaker();
         const childStoken = makeChildSToken('(child)');

         expectProcessing('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY child "(child)">' +
            '<!ENTITY parent "pre&child;mid&child;post">' +
         ']>' +
         '<one child="&child;" parent="&parent;"/>', (results) => {
            const element = results[6];

            expect(element.attributes[1].value).toEqual([
               new tokenNs.entityStart.XToken('parent'),
               new tokenNs.text.XToken('pre', new tokenNs.text.PToken({
                  text: new SToken('pre', 'pre', new Range(new EntityLocation(),
                     0, 0, 0, 3, 0, 3)),
               })),
               new tokenNs.entityStart.XToken('child'),
               new tokenNs.text.XToken('(child)', new tokenNs.text.PToken({
                  text: childStoken,
               })),
               new tokenNs.entityEnd.XToken('child'),
               new tokenNs.text.XToken('mid', new tokenNs.text.PToken({
                  text: new SToken('mid', 'mid', new Range(new EntityLocation(),
                     10, 0, 10, 13, 0, 13)),
               })),
               new tokenNs.entityStart.XToken('child'),
               new tokenNs.text.XToken('(child)', new tokenNs.text.PToken({
                  text: childStoken,
               })),
               new tokenNs.entityEnd.XToken('child'),
               new tokenNs.text.XToken('post', new tokenNs.text.PToken({
                  text: new SToken('post', 'post', new Range(new EntityLocation(),
                     20, 0, 20, 24, 0, 24)),
               })),
               new tokenNs.entityEnd.XToken('parent'),
            ]);
            done();
         });
      });

   });

});

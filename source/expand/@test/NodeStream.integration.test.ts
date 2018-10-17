/* Copyright ® 2017-2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { ValidityError } from '../../error/index';
import { PTokenStream } from '../../pTokenStream';
import { PToXTokenStream } from '../../xTokenStream';
import { SToken } from '../../sToken';
import { makeSTokenMaker, STokenMaker } from '../../sToken/@test/helper';
import * as tokenNs from '../../token';
import { AttListXToken } from '../../token/attListDeclaration'; // hack
import { ElementStart } from '../../token/elementStart'; // hack
import { ElementDeclaration } from '../../token/elementDeclaration'; // hack
import { EntityDeclaration } from '../../token/entityDeclaration'; // hack
import { NotationDeclaration } from  '../../token/notationDeclaration'; // hack
import {
   GeneralEntityEndXToken,
   ParameterEntityEndPToken,
   ParameterEntityEndXToken
} from '../../token';

import EntityManager from '../EntityManager';
import NodeStream from '../NodeStream';

type Token = { type: string };
type TokenArray = Array<Token>;

describe('NodeStream (integration)', () => {
   let pTokenStream: PTokenStream;
   let node: NodeStream;

   beforeEach(() => {
      const manager = new EntityManager();
      pTokenStream = new PTokenStream(new EntityMetaData());
      const xTokenStream = new PToXTokenStream();
      node = new NodeStream(manager);
      pTokenStream.pipe(xTokenStream).pipe(node);
   });

   function matchTokenTypes(actual: TokenArray, expected: Array<any>) { // typeHack
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

   function expectProcessing(input: string, check: (results: TokenArray) => void) {
      const results: TokenArray = [];

      node.on('data', (token: Token) => results.push(token));
      node.on('end', () => {
         check(results);
      });

      pTokenStream.addText(input);
      pTokenStream.endText();
   }

   it('adds two levels of entities', (done) => {
      expectProcessing('<?xml version="1.0"?><!DOCTYPE one ' +
         '[<!ENTITY child "&quot;grandchild&quot;">]><one>&child;</one>', (results) => {
         matchTokenTypes(results, [
            tokenNs.xmlDeclaration.XToken,
            tokenNs.docTypeStart.XToken,
            tokenNs.entityDeclaration.XToken,
            tokenNs.docTypeEnd.XToken,
            tokenNs.elementStart.XToken,
            tokenNs.entityStart.XToken,
            tokenNs.entityStart.XToken,
            tokenNs.charData.XToken,
            GeneralEntityEndXToken,
            tokenNs.charData.XToken,
            tokenNs.entityStart.XToken,
            tokenNs.charData.XToken,
            GeneralEntityEndXToken,
            GeneralEntityEndXToken,
            tokenNs.elementEnd.XToken,
         ]);
         done();
      });
   });

   it('adds the content of parameter entities, which can declare general entities', (done) => {
      expectProcessing(`<?xml version="1.0"?>
      <!DOCTYPE one [
         <!ENTITY % pEntity "<!ENTITY genEntity 'foo'>">
         %pEntity;
      ]>
      <one>
         &genEntity;
      </one>`, (results) => {
         /* eslint-disable indent */
         matchTokenTypes(results, [
            tokenNs.xmlDeclaration.XToken,
            tokenNs.docTypeStart.XToken,
               tokenNs.entityDeclaration.ParamXToken,
               tokenNs.entityStart.ParamXToken,
                  tokenNs.entityDeclaration.XToken,
               ParameterEntityEndXToken,
            tokenNs.docTypeEnd.XToken,
            tokenNs.elementStart.XToken,
               tokenNs.charData.XToken,
               tokenNs.entityStart.XToken,
                  tokenNs.charData.XToken,
               GeneralEntityEndXToken,
               tokenNs.charData.XToken,
            tokenNs.elementEnd.XToken,
         ]);
         /* eslint-enable indent */
         done();
      });
   });

   describe('ATTLIST declaration processing', () => {

      it('expands an parameter entity that makes up the attlist declaration body', (done) => {
         expectProcessing(`<?xml version="1.0"?><!DOCTYPE one [
            <!ENTITY % middle "foo">
            <!ATTLIST %middle;>
         ]>`, (tokens) => {
            const attListDecl = tokens[6] as AttListXToken; // typeHack

            expect(attListDecl.elementName).toEqual('foo');
            done();
         })
      });

      it('expands an parameter entity that makes up an ENUMERATION', (done) => {
         expectProcessing(`<?xml version="1.0"?><!DOCTYPE one [
            <!ELEMENT one ANY>
            <!ENTITY % goodies "( four | five ) #REQUIRED">
            <!ATTLIST one attr1 %goodies;>
         ]>`, (tokens) => {
            const attListDecl = tokens[8] as AttListXToken; // typeHack

            expect(attListDecl.attDefs[0]).toEqual({
               name: 'attr1',
               type: 'ENUMERATION',
               enumeration: ['four', 'five'],
               defaultType: '#REQUIRED',
               value: [],
            });
            done();
         })
      });

      it('expands entity references in attribute values', (done) => {
         expectProcessing(`<?xml version="1.0"?><!DOCTYPE one [
            <!ELEMENT one ANY>
            <!ENTITY test "foo#">
            <!ATTLIST one
               attr1 CDATA "#&test;bar#">
         ]>`, (tokens) => {
            const attListDecl = tokens[8] as AttListXToken; // typeHack

            expect(attListDecl.attDefs[0]).toEqual({
               name: 'attr1',
               type: 'CDATA',
               defaultType: '',
               value: [
                  new tokenNs.text.XToken('#', new tokenNs.text.PToken({
                     text: new SToken('#', '#', new Range(new EntityLocation(), 156, 4, 152, 157, 4, 153)),
                  })),
                  new tokenNs.entityStart.XToken('test'),
                  new tokenNs.text.XToken('foo#', new tokenNs.text.PToken({
                     text: new SToken('foo#', 'foo#', new Range(new EntityLocation(), 0, 0, 0, 4, 0, 4)),
                  })),
                  new GeneralEntityEndXToken('test'),
                  new tokenNs.text.XToken('bar#', new tokenNs.text.PToken({
                     text: new SToken('bar#', 'bar#', new Range(new EntityLocation(), 163, 4, 159, 167, 4, 163)),
                  })),
               ],
            });
            done();
         })
      });

   });

   describe('ELEMENT declaration processing', () => {

      it('expands a parameter entity embedded in the content spec', (done) => {
         expectProcessing('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % middle "two">' +
            '<!ELEMENT one ( one | %middle; | three)>' +
         ']>', (results) => {
            const elementDecl = results[4] as ElementDeclaration;

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
      });

      it('reports a warning if entities are not paremthesis-balanced (§3.2.1)', (done) => {
         expectProcessing('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % last ")">' +
            '<!ELEMENT one ( one | %last;>' +
         ']>', (results) => {
            const error = results[4] as ValidityError;

            expect(error.id).toEqual(ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED);
            done();
         });
      });

   });

   describe('ENTITY declaration processing', () => {

      it('expands an parameter entity values in an EntityValue', (done) => {
         expectProcessing('<?xml version="1.0"?><!DOCTYPE one ' +
            '[<!ENTITY % peOne "two"><!ENTITY child "one%peOne;">]>', (results) => {
            const valueArray = (results[4] as EntityDeclaration).value; // typeHack
            expect(valueArray[0].text.str).toEqual('one');
            expect(valueArray[1]).toEqual(new tokenNs.entityStart.ParamPToken({ refPToken: valueArray[1].refPToken }));
            expect(valueArray[2].text.str).toEqual('two');
            expect(valueArray[3]).toEqual(new ParameterEntityEndPToken(valueArray[1].refPToken));
            done();
         });
      });
  
      it('expands an parameter entity inside a parameter entity inside the EntityValue', (done) => {
         expectProcessing('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % peTwo "inner">' +
            '<!ENTITY % peOne "(%peTwo;)">' +
            '<!ENTITY child "[%peOne;]">' +
         ']>', (results) => {
            const valueArray = (results[5] as EntityDeclaration).value; // typeHack
            expect(valueArray[0].text.str).toEqual('[');
            expect(valueArray[1]).toEqual(new tokenNs.entityStart.ParamPToken({ refPToken: valueArray[1].refPToken }));
            expect(valueArray[2].text.str).toEqual('(');
            expect(valueArray[3]).toEqual(new tokenNs.entityStart.ParamPToken({ refPToken: valueArray[3].refPToken }));
            expect(valueArray[4].text.str).toEqual('inner');
            expect(valueArray[5]).toEqual(new ParameterEntityEndPToken(valueArray[3].refPToken));
            expect(valueArray[6].text.str).toEqual(')');
            expect(valueArray[7]).toEqual(new ParameterEntityEndPToken(valueArray[1].refPToken));
            expect(valueArray[8].text.str).toEqual(']');
            done();
         });
      });
  
      it('expands a parameter entity that makes up the entity declaration body', (done) => {
         expectProcessing('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % peTwo "inner">' +
            '<!ENTITY % peOne "(%peTwo;)">' +
            '<!ENTITY % body \'child "[%peOne;]"\'>' +
            '<!ENTITY %body;>' +
         ']>', (results) => {
            const entityDecl = results[6] as EntityDeclaration; // typeHack
            const values = entityDecl.value;

            expect(entityDecl.name).toEqual('child');
            expect(values[0].text.str).toEqual('[(inner)]');
            done();
         });
      });
  
   });

   describe('NOTATION declaration processing', () => {

      it('expands an parameter entity that makes up the notation declaration body', (done) => {
         expectProcessing('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY % url "http://somewhere.com">' +
            '<!ENTITY % middle \'PUBLIC "%url;"\'>' +
            '<!NOTATION foo %middle;>' +
         ']>', (results) => {
            const notationDecl = results[5] as NotationDeclaration; // typeHack

            expect(notationDecl.name).toEqual('foo');
            expect((notationDecl.externalId as any).publicId).toEqual('http://somewhere.com'); // typeHack
            done();
         });
      });

   });

   describe('element start processing', () => {
      let makeSToken: STokenMaker;

      beforeEach(() => {
         makeSToken = makeSTokenMaker();
      });

      it('expands general entity references in attributes', (done) => {
         expectProcessing('<?xml version="1.0"?><!DOCTYPE one [' +
            '<!ENTITY child "(child)">' +
         ']>' +
         '<one child="&child;"/>', (results) => {
            const element = results[5] as ElementStart; // typeHack

            expect(element.attributes[0].value).toEqual([
               new tokenNs.entityStart.XToken('child'),
               new tokenNs.text.XToken('(child)', new tokenNs.text.PToken({
                  text: makeSToken('(child)'),
               })),
               new GeneralEntityEndXToken('child'),
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
            const element = results[6] as ElementStart; // typeHack

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
               new GeneralEntityEndXToken('child'),
               new tokenNs.text.XToken('mid', new tokenNs.text.PToken({
                  text: new SToken('mid', 'mid', new Range(new EntityLocation(),
                     10, 0, 10, 13, 0, 13)),
               })),
               new tokenNs.entityStart.XToken('child'),
               new tokenNs.text.XToken('(child)', new tokenNs.text.PToken({
                  text: childStoken,
               })),
               new GeneralEntityEndXToken('child'),
               new tokenNs.text.XToken('post', new tokenNs.text.PToken({
                  text: new SToken('post', 'post', new Range(new EntityLocation(),
                     20, 0, 20, 24, 0, 24)),
               })),
               new GeneralEntityEndXToken('parent'),
            ]);
            done();
         });
      });

   });

});

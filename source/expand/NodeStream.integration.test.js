/* Copyright ® 2017 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { PTokenStream } from '../pTokenStream';
import { PToXTokenStream } from '../xTokenStream';
import * as tokenNs from '../token';

import EntityManager from './EntityManager.js';
import NodeStream from './NodeStream.js';

describe('NodeStream (integration)', () => {

   function matchTokenTypes(actual, expected) {
      let expectedIndex = 0;

      for (let actualIndex = 0; actualIndex < actual.length; actualIndex++) {
         if (actual[actualIndex].type === 'ENTITY_META_DATA' ||
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

   it('expands an parameter entity values in an EntityValue', (done) => {
      const results = [];
      const manager = new EntityManager();
      const pTokenStream = new PTokenStream();
      const xTokenStream = new PToXTokenStream();
      const node = new NodeStream(manager);
      pTokenStream.pipe(xTokenStream).pipe(node);

      node.on('data', (token) => results.push(token));
      node.on('end', () => {
         matchTokenTypes(results[4].value, [
            tokenNs.text.XToken,
            tokenNs.entityStart.ParamXToken,
            tokenNs.text.XToken,
            tokenNs.entityEnd.ParamXToken,
         ]);
         done();
      });
      pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one ' +
         '[<!ENTITY % peOne "two"><!ENTITY child "one%peOne;">]>');
      pTokenStream.endText();
   });

   it('expands an parameter entity inside a parameter entity', (done) => {
      const results = [];
      const manager = new EntityManager();
      const pTokenStream = new PTokenStream();
      const xTokenStream = new PToXTokenStream();
      const node = new NodeStream(manager);
      pTokenStream.pipe(xTokenStream).pipe(node);

      node.on('data', (token) => results.push(token));
      node.on('end', () => {
         matchTokenTypes(results[5].value, [
            tokenNs.text.XToken,
            tokenNs.entityStart.ParamXToken,
            tokenNs.text.XToken,
            tokenNs.entityStart.ParamXToken,
            tokenNs.text.XToken,
            tokenNs.entityEnd.ParamXToken,
            tokenNs.text.XToken,
            tokenNs.entityEnd.ParamXToken,
            tokenNs.text.XToken,
         ]);
         done();
      });
      pTokenStream.addText('<?xml version="1.0"?><!DOCTYPE one [' +
         '<!ENTITY % peTwo "inner">' +
         '<!ENTITY % peOne "(%peTwo;)">' +
         '<!ENTITY child "[%peOne;]">' +
      ']>');
      pTokenStream.endText();
   });

});

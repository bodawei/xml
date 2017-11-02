/* Copyright ® 2017 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { ParsedStream } from '../pToken';
import { TokenStream } from '../tokenize';
import * as xtoken from '../xToken';

import EntityManager from './EntityManager.js';
import NodeStream from './NodeStream.js';

describe('NodeStream (integration)', () => {

   function matchTokenTypes(actual, expected) {
      let expectedIndex = 0;

      for (let actualIndex = 0; actualIndex < actual.length; actualIndex++) {
         if (actual[actualIndex].type === 'ENTITY_META_DATA' ||
            actual[actualIndex] instanceof xtoken.space.Token) {
            continue;
         }

         expect(actual[actualIndex] instanceof expected[expectedIndex]).toEqual(true);
         expectedIndex++;
      }
   }

   it('adds two levels of entities', (done) => {
      const results = [];
      const manager = new EntityManager();
      const parsed = new ParsedStream();
      const token = new TokenStream();
      const node = new NodeStream(manager);
      parsed.pipe(token).pipe(node);

      node.on('data', (token) => results.push(token));
      node.on('end', () => {
         matchTokenTypes(results, [
            xtoken.xmlDeclaration.Token,
            xtoken.docTypeStart.Token,
            xtoken.entityDeclaration.Token,
            xtoken.docTypeEnd.Token,
            xtoken.elementStart.Token,
            xtoken.entityStart.Token,
            xtoken.entityStart.Token,
            xtoken.charData.Token,
            xtoken.entityEnd.Token,
            xtoken.charData.Token,
            xtoken.entityStart.Token,
            xtoken.charData.Token,
            xtoken.entityEnd.Token,
            xtoken.entityEnd.Token,
            xtoken.elementEnd.Token,
         ]);
         done();
      });
      parsed.addText('<?xml version="1.0"?><!DOCTYPE one ' +
         '[<!ENTITY child "&quot;grandchild&quot;">]><one>&child;</one>');
      parsed.endText();
   });

   it('adds the content of parameter entities, which can declare general entities', (done) => {
      const results = [];
      const manager = new EntityManager();
      const parsed = new ParsedStream();
      const token = new TokenStream();
      const node = new NodeStream(manager);
      parsed.pipe(token).pipe(node);

      node.on('data', (token) => results.push(token));
      node.on('end', () => {
         /* eslint-disable indent */
         matchTokenTypes(results, [
            xtoken.xmlDeclaration.Token,
            xtoken.docTypeStart.Token,
               xtoken.entityDeclaration.ParamToken,
               xtoken.entityStart.ParamToken,
                  xtoken.entityDeclaration.Token,
               xtoken.entityEnd.ParamToken,
            xtoken.docTypeEnd.Token,
            xtoken.elementStart.Token,
               xtoken.entityStart.Token,
                  xtoken.charData.Token,
               xtoken.entityEnd.Token,
            xtoken.elementEnd.Token,
         ]);
         /* eslint-enable indent */
         done();
      });
      parsed.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % pEntity "<!ENTITY genEntity 'foo'>">
            %pEntity;
         ]>
         <one>
            &genEntity;
         </one>`);
      parsed.endText();
   });

   it('expands an parameter entity values in an EntityValue', (done) => {
      const results = [];
      const manager = new EntityManager();
      const pTokenStream = new ParsedStream();
      const xTokenStream = new TokenStream();
      const node = new NodeStream(manager);
      pTokenStream.pipe(xTokenStream).pipe(node);

      node.on('data', (token) => results.push(token));
      node.on('end', () => {
         matchTokenTypes(results[4].value, [
            xtoken.text.Token,
            xtoken.entityStart.ParamToken,
            xtoken.text.Token,
            xtoken.entityEnd.ParamToken,
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
      const pTokenStream = new ParsedStream();
      const xTokenStream = new TokenStream();
      const node = new NodeStream(manager);
      pTokenStream.pipe(xTokenStream).pipe(node);

      node.on('data', (token) => results.push(token));
      node.on('end', () => {
         matchTokenTypes(results[5].value, [
            xtoken.text.Token,
            xtoken.entityStart.ParamToken,
            xtoken.text.Token,
            xtoken.entityEnd.ParamToken,
            xtoken.text.Token,
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

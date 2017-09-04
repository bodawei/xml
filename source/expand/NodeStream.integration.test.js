/* Copyright ® 2017 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { ParsedStream } from '../parse';
import { TokenStream } from '../tokenize';
import * as xtoken from '../xToken';

import EntityManager from './EntityManager.js';
import NodeStream from './NodeStream.js';

describe('NodeStream', () => {

   function matchTokenTypes(actual, expected) {
      let expectedIndex = 0;

      for (let actualIndex = 0; actualIndex < actual.length; actualIndex++) {
         if (actual[actualIndex].type === 'ENTITY_META_DATA') {
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

});

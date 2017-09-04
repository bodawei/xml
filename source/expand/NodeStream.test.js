/* Copyright ® 2016 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import * as xToken from '../xToken';

import NodeStream from './NodeStream.js';
import EntityManager from './EntityManager.js';

describe('NodeStream', () => {

   describe('does recursive', () => {

      it('throws an error if not passed an entity manager', () => {
         expect(() => {
            new NodeStream();
         }).toThrowError('Must call with an EntityManager instance.');
      });

   });

   describe('_transform()', () => {
      let entityManager;
      let nodeStream;

      beforeEach(() => {
         entityManager = new EntityManager();
         nodeStream = new NodeStream(entityManager);
      });

      it('adds any entity declarations to the entity manager', () => {
         spyOn(entityManager, 'addEntityFromInternalSubset');
         const token = new xToken.entityDeclaration.Token('fred', [], undefined, undefined, []);

         nodeStream.write(token);

         expect(entityManager.addEntityFromInternalSubset).toHaveBeenCalledWith(token);
      });

      it('passes tokens through', () => {
         const token = new xToken.elementStart.Token('fred', undefined, []);

         nodeStream.write(token);

         expect(nodeStream.read()).toEqual(token);
      });

      it('passes an unknown reference through', () => {
         const token = new xToken.entityReference.Token('testReference', []);

         nodeStream.write(token);

         expect(nodeStream.read()).toEqual(token);
      });

      describe('sub-stream processing', () => {

         it('adds a start entity token to the stream', () => {
            const declToken = new xToken.entityDeclaration.Token('test', [], undefined, undefined, []);
            const refToken = new xToken.entityReference.Token('test', []);

            nodeStream.write(declToken);
            nodeStream.write(refToken);

            nodeStream.read(); // decl token
            expect(nodeStream.read()).toEqual(new xToken.entityStart.Token('test'));
         });

      });

   });

});

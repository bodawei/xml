/* Copyright ® 2016 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import * as xToken from '../token';

import NodeStream from './NodeStream.js';
import EntityManager from './EntityManager.js';

describe('NodeStream (unit)', () => {

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

      it('adds any general entity declarations to the entity manager', () => {
         spyOn(entityManager, 'addEntityFromInternalSubset');
         const token = new xToken.entityDeclaration.XToken('fred', [], undefined, undefined, []);

         nodeStream.write(token);

         expect(entityManager.addEntityFromInternalSubset).toHaveBeenCalledWith(token);
      });

      it('adds any parameter entity declarations to the entity manager', () => {
         spyOn(entityManager, 'addParameterEntityFromInternalSubset');
         const token = new xToken.entityDeclaration.ParamXToken('fred', [], undefined, undefined, []);

         nodeStream.write(token);

         expect(entityManager.addParameterEntityFromInternalSubset).toHaveBeenCalledWith(token);
      });

      it('passes tokens through', () => {
         const token = new xToken.elementStart.XToken('fred', undefined, []);

         nodeStream.write(token);

         expect(nodeStream.read()).toEqual(token);
      });

      it('passes an unknown reference through', () => {
         const token = new xToken.entityReference.XToken('testReference', []);

         nodeStream.write(token);

         expect(nodeStream.read()).toEqual(token);
      });

      describe('sub-stream processing', () => {

         it('adds a start entity token to the stream', () => {
            const declToken = new xToken.entityDeclaration.XToken('test', [], undefined, undefined, []);
            const refToken = new xToken.entityReference.XToken('test', []);

            nodeStream.write(declToken);
            nodeStream.write(refToken);

            nodeStream.read(); // decl token
            expect(nodeStream.read()).toEqual(new xToken.entityStart.XToken('test'));
         });

         it('adds a start entity token to the stream when it encounters a parameter entity ref', () => {
            const declToken = new xToken.entityDeclaration.ParamXToken('test', [], undefined, undefined, []);
            const refToken = new xToken.entityReference.ParamXToken('test', []);

            nodeStream.write(declToken);
            nodeStream.write(refToken);

            nodeStream.read(); // decl token
            expect(nodeStream.read()).toEqual(new xToken.entityStart.ParamXToken('test'));
         });

         it('passes a reference with no referent straight through', () => {
            const declToken = new xToken.entityDeclaration.ParamXToken('test', [], undefined, undefined, []);
            const refToken = new xToken.entityReference.ParamXToken('test', []);
            declToken.value.push(refToken);

            nodeStream.write(declToken);

            const actualDecl = nodeStream.read();
            expect(actualDecl.value[0]).toEqual(new xToken.entityReference.ParamXToken('test', []));
         });

      });

   });

});

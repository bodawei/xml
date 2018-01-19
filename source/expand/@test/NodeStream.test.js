/* Copyright ® 2016 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../basic';
import { SToken } from '../../sToken';
import * as xToken from '../../token';

import NodeStream from '../NodeStream.js';
import EntityManager from '../EntityManager.js';

describe('NodeStream (unit)', () => {

   function gatherResults(stream, expect) {
      stream.on('data', (item) => {
         expect(item);
      });
   }

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

      it('passes a notification delcaration through', () => {
         const token = new xToken.notationDeclaration.XToken('fred', undefined, {});

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
            const refToken = new xToken.entityReference.ParamPToken({ name: SToken.fromString('test') });
            declToken.value.push(refToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.value[0]).toEqual(refToken);
            });
         });

         it('does not expand an entity reference that has no name', () => {
            const declToken = new xToken.entityDeclaration.ParamXToken('test', [], undefined, undefined, []);
            const refToken = new xToken.entityReference.ParamPToken({ name: undefined });
            declToken.value.push(refToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.value[0]).toEqual(refToken);
            });
         });

      });

      describe('unassigned processing', () => {

         it('does nothing if the unassigned has no PERefs', (done) => {
            const pToken = {
               externalId: {
                  unassigned: [ xToken.unassigned.spaceFromSToken(SToken.fromString(' ')) ],
               },
            };
            const declToken = new xToken.notationDeclaration.XToken('test', undefined, pToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.pToken.externalId.unassigned)
                  .toEqual([ xToken.unassigned.spaceFromSToken(SToken.fromString(' ')) ]);
               done();
            });
         });

         it('does not replace a peref with a pestart if it is not in the entity manager', (done) => {
            const peref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('testRef'),
               close: SToken.fromString(';'),
            });
            const pToken = {
               externalId: {
                  unassigned: [ peref ],
               },
            };
            const declToken = new xToken.notationDeclaration.XToken('test', undefined, pToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.pToken.externalId.unassigned).toEqual([ peref ]);
               done();
            });
         });

         it('does not replace a peref if it has no name', (done) => {
            const peref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: undefined,
               close: SToken.fromString(';'),
            });
            const pToken = {
               externalId: {
                  unassigned: [ peref ],
               },
            };
            const declToken = new xToken.notationDeclaration.XToken('test', undefined, pToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.pToken.externalId.unassigned).toEqual([ peref ]);
               done();
            });
         });

         it('does not replace a peref if it has an empty name', (done) => {
            const peref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString(''),
               close: SToken.fromString(';'),
            });
            const pToken = {
               externalId: {
                  unassigned: [ peref ],
               },
            };
            const declToken = new xToken.notationDeclaration.XToken('test', undefined, pToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.pToken.externalId.unassigned).toEqual([ peref ]);
               done();
            });
         });

         it('replaces a peref with a pestart, word and peend item in unassigned', (done) => {
            const peref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('testRef'),
               close: SToken.fromString(';'),
            });
            const declarationPToken = new xToken.entityDeclaration.ParamPToken({
               name: SToken.fromString('testRef'),
               value: [ new xToken.text.PToken({ text: SToken.fromString('theValue') }) ],
            });
            const entityToken = xToken.entityDeclaration.pTokenToXToken(declarationPToken);
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(entityToken);
            const pToken = {
               externalId: {
                  unassigned: [ peref ],
               },
            };
            const declToken = new xToken.notationDeclaration.XToken('test', undefined, pToken);
            // parsing introduces a range!
            const unassignedWord = xToken.unassigned.wordFromSToken(
               new SToken('theValue', 'theValue', new Range(new EntityLocation(), 0, 0, 0, 8, 0, 8)));

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.pToken.externalId.unassigned).toEqual([
                  new xToken.entityStart.ParamPToken({ refPToken: peref }),
                  unassignedWord,
                  new xToken.entityEnd.ParamPToken({ refPToken: peref }) ]);
               done();
            });
         });

         it('replaces a peref that references another peref', (done) => {
            const parentPeref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('parentDecl'),
               close: SToken.fromString(';'),
            });
            const childPeref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('childDecl'),
               close: SToken.fromString(';'),
            });
            const unassignedWord = xToken.unassigned.wordFromSToken(
               new SToken('theValue', 'theValue', new Range(new EntityLocation(), 0, 0, 0, 8, 0, 8)));
            const declarationPToken1 = new xToken.entityDeclaration.ParamPToken({
               name: SToken.fromString('parentDecl'),
               value: [
                  new xToken.entityStart.ParamPToken({ refPToken: childPeref }),
                  unassignedWord,
                  new xToken.entityEnd.ParamPToken({ refPToken: childPeref }),
               ],
            });
            const entityToken1 = xToken.entityDeclaration.pTokenToXToken(declarationPToken1);
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(entityToken1);
            const pToken = {
               externalId: {
                  unassigned: [ parentPeref ],
               },
            };
            const declToken = new xToken.notationDeclaration.XToken('test', undefined, pToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.pToken.externalId.unassigned).toEqual([
                  new xToken.entityStart.ParamPToken({ refPToken: parentPeref }),
                  new xToken.entityStart.ParamPToken({ refPToken: childPeref }),
                  unassignedWord,
                  new xToken.entityEnd.ParamPToken({ refPToken: childPeref }),
                  new xToken.entityEnd.ParamPToken({ refPToken: parentPeref }),
               ]);

               done();
            });
         });

      });

   });
});

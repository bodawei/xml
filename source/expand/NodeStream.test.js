/* Copyright ® 2016 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../basic';
import { SToken } from '../sToken';
import * as xToken from '../token';

import NodeStream from './NodeStream.js';
import EntityManager from './EntityManager.js';

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
            const refToken = new xToken.entityReference.ParamXToken('test', []);
            declToken.value.push(refToken);

            nodeStream.write(declToken);

            const actualDecl = nodeStream.read();
            expect(actualDecl.value[0]).toEqual(new xToken.entityReference.ParamXToken('test', []));
         });

      });

      describe('incomplete processing', () => {

         it('does nothing if the incomplete has no PERefs', (done) => {
            const pToken = {
               externalId: {
                  incomplete: [ {
                     type: 'space',
                     item: new SToken(' ', ' '),
                  } ],
               },
            };
            const declToken = new xToken.notationDeclaration.XToken('test', undefined, pToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.pToken.externalId.incomplete).toEqual(pToken.externalId.incomplete);
               done();
            });
         });

         it('replaces a peref with a pestart, word and peend item in incomplete', (done) => {
            const peref = new xToken.entityReference.ParamPToken({
               open: new SToken('%', '%'),
               name: new SToken('testRef', 'testRef'),
               close: new SToken(';', ';'),
            });
            const declarationPToken = new xToken.entityDeclaration.ParamPToken({
               name: new SToken('testRef', 'testRef'),
               value: [ new xToken.text.PToken({ text: new SToken('theValue', 'theValue') }) ],
            });
            const entityToken = xToken.entityDeclaration.pTokenToXToken(declarationPToken);
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(entityToken);
            const pToken = {
               externalId: {
                  incomplete: [ peref ],
               },
            };
            const declToken = new xToken.notationDeclaration.XToken('test', undefined, pToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.pToken.externalId.incomplete).toEqual([ {
                  type: 'pestart',
                  item: peref,
               }, {
                  type: 'word',
                  word: new SToken('theValue', 'theValue', new Range(new EntityLocation(), 0, 0, 0, 8, 0, 8)),
               }, {
                  type: 'peend',
                  item: peref,
               } ]);
               done();
            });
         });

         it('replaces a peref that references another peref', (done) => {
            const parentPeref = new xToken.entityReference.ParamPToken({
               open: new SToken('%', '%'),
               name: new SToken('parentRef', 'parentRef'),
               close: new SToken(';', ';'),
            });
            const childPeref = new xToken.entityReference.ParamPToken({
               open: new SToken('%', '%'),
               name: new SToken('testRef', 'testRef'),
               close: new SToken(';', ';'),
            });
            const declarationPToken1 = new xToken.entityDeclaration.ParamPToken({
               name: new SToken('parentRef', 'parentRef'),
               value: [ childPeref ],
            });
            const declarationPToken2 = new xToken.entityDeclaration.ParamPToken({
               name: new SToken('testRef', 'testRef'),
               value: [ new xToken.text.PToken({ text: new SToken('testValue', 'testValue') }) ],
            });
            const entityToken1 = xToken.entityDeclaration.pTokenToXToken(declarationPToken1);
            const entityToken2 = xToken.entityDeclaration.pTokenToXToken(declarationPToken2);
            spyOn(entityManager, 'getParameterEntityToken').and.callFake((param) => {
               if (param === 'parentRef') {
                  return entityToken1;
               } else {
                  return entityToken2;
               }
            });
            const pToken = {
               externalId: {
                  incomplete: [ parentPeref ],
               },
            };
            const declToken = new xToken.notationDeclaration.XToken('test', undefined, pToken);

            nodeStream.write(declToken);

            gatherResults(nodeStream, (result) => {
               expect(result.pToken.externalId.incomplete).toEqual([ {
                  type: 'pestart',
                  item: parentPeref,
               }, {
                  type: 'pestart',
                  item: childPeref,
               }, {
                  type: 'word',
                  word: new SToken('testValue', 'testValue', new Range(new EntityLocation(), 0, 0, 0, 9, 0, 9)),
               }, {
                  type: 'peend',
                  item: childPeref,
               }, {
                  type: 'peend',
                  item: parentPeref,
               } ]);

               done();
            });
         });

      });

   });
});

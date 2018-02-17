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

   describe('.write()', () => {
      let entityManager;
      let nodeStream;

      beforeEach(() => {
         entityManager = new EntityManager();
         nodeStream = new NodeStream(entityManager);
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

      describe('entity declaration processing', () => {

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
   
         it('leaves a simple EntityValue untouched', (done) => {
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [
                  xToken.unassigned.wordFromSToken(SToken.fromString('value')),
               ],
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, (token) => {
               expect(token.value).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('value')),
               ]);

               done();
            });
         });
   
         it('leaves an undefined entity reference in the entity value unexpanded', (done) => {
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(undefined);
            const parentPeref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('parentDecl'),
               close: SToken.fromString(';'),
            });
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [ parentPeref ],
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, (token) => {
               expect(token.value).toEqual([
                  parentPeref,
               ]);

               done();
            });
         });
   
         it('leaves an entity declaration with no value unprocessed', (done) => {
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(undefined);
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               name: SToken.fromString('generalEntityDeclaration'),
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, (token) => {
               expect(token.value).toEqual([]);

               done();
            });
         });
   
         it('leaves an EntityValue-less entity reference unexpanded', (done) => {
            // Define the pe declaration we will reference
            const parentDeclaration = new xToken.entityDeclaration.ParamPToken({
               name: SToken.fromString('parentDecl'),
            });
            const parentToken = xToken.entityDeclaration.pTokenToXToken(parentDeclaration);
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(parentToken);
            // The reference to the above declaration
            const parentPeref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('parentDecl'),
               close: SToken.fromString(';'),
            });
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [ parentPeref ],
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, (token) => {
               expect(token.value).toEqual([
                  parentPeref
               ]);

               done();
            });
         });

         it('expands a PERefs that has no actual data in it', (done) => {
            // Define the pe declaration we will reference
            const parentDeclaration = new xToken.entityDeclaration.ParamPToken({
               name: SToken.fromString('parentDecl'),
               value: [],
            });
            const parentToken = xToken.entityDeclaration.pTokenToXToken(parentDeclaration);
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(parentToken);
            // The reference to the above declaration
            const parentPeref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('parentDecl'),
               close: SToken.fromString(';'),
            });
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [ parentPeref ],
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, (token) => {
               expect(token.value).toEqual([
                  new xToken.entityStart.ParamPToken({ refPToken: parentPeref }),
                  new xToken.entityEnd.ParamPToken({ refPToken: parentPeref }),
               ]);

               done();
            });
         });

         it('expands PERefs in the EntityValue', (done) => {
            // Define the pe declaration we will reference
            const parentDeclaration = new xToken.entityDeclaration.ParamPToken({
               name: SToken.fromString('parentDecl'),
               value: [
                  new xToken.entityStart.ParamPToken({}),
                  xToken.unassigned.wordFromSToken(
                     new SToken('childValue', 'childValue', new Range(new EntityLocation(), 0, 0, 0, 9, 0, 9))),
                  new xToken.entityEnd.ParamPToken({}),
               ],
            });
            const parentToken = xToken.entityDeclaration.pTokenToXToken(parentDeclaration);
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(parentToken);
            // The reference to the above declaration
            const parentPeref = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('parentDecl'),
               close: SToken.fromString(';'),
            });
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [ parentPeref ],
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, (token) => {
               expect(token.value).toEqual([
                  new xToken.entityStart.ParamPToken({ refPToken: parentPeref }),
                  new xToken.entityStart.ParamPToken({}),
                  parentDeclaration.value[1],
                  new xToken.entityEnd.ParamPToken({}),
                  new xToken.entityEnd.ParamPToken({ refPToken: parentPeref }),
               ]);

               done();
            });
         });

         it('handles unassigned values', (done) => {
            spyOn(xToken.entityDeclaration, 'assignUnassigned').and.callFake((pToken) => {
               pToken.name = SToken.fromString('newName');
               delete pToken.unassigned;
            });
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               unassigned: [
                  xToken.unassigned.wordFromSToken(SToken.fromString('thename')),
               ],
               nextParamName: 'parameter',
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, (token) => {
               expect(token).toEqual(new xToken.entityDeclaration.XToken('newName', [], undefined, '', {
                  name: SToken.fromString('newName'),
                  nextParamName: 'parameter',
               }));

               done();
            });
         });

         it('does not expand a PERef in the unassigned values if there is no definition', (done) => {
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(undefined);
            const peRef = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('testDecl'),
               close: SToken.fromString(';'),
            });

            spyOn(xToken.entityDeclaration, 'assignUnassigned').and.callFake(() => {});
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               unassigned: [
                  peRef
               ],
               nextParamName: 'parameter',
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, (token) => {
               expect(token).toEqual(new xToken.entityDeclaration.XToken('', [], undefined, '', {
                     unassigned: [
                        peRef
                     ],
                     nextParamName: 'parameter',
                  }));

               done();
            });
         });

         it('does not expand a PERef in the unassigned values if it has no value', (done) => {
            const valuelessToken = new xToken.entityDeclaration.ParamPToken({
               name: SToken.fromString('testRef'),
            });
            const entityToken = xToken.entityDeclaration.pTokenToXToken(valuelessToken);
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(entityToken);
            const peRef = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('testDecl'),
               close: SToken.fromString(';'),
            });

            spyOn(xToken.entityDeclaration, 'assignUnassigned').and.callFake(() => {});
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               unassigned: [
                  peRef
               ],
               nextParamName: 'parameter',
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, (token) => {
               expect(token).toEqual(new xToken.entityDeclaration.XToken('', [], undefined, '', {
                     unassigned: [
                        peRef
                     ],
                     nextParamName: 'parameter',
                  }));

               done();
            });
         });

         it('expands a series of PERefs that themselves have no content', (done) => {
            const refToMissing = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('third'),
               close: SToken.fromString(';'),
            });
            const secondDeclPToken = new xToken.entityDeclaration.ParamPToken({
               name: SToken.fromString('second'),
               value: [ refToMissing ],
            });
            const secondDeclXToken = xToken.entityDeclaration.pTokenToXToken(secondDeclPToken);
            const refToSecond = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('second'),
               close: SToken.fromString(';'),
            });
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               unassigned: [
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')),
                  refToSecond
               ],
               nextParamName: 'parameter',
            });
            spyOn(entityManager, 'getParameterEntityToken').and.callFake((name) => {
               if (name === 'second') {
                  return secondDeclXToken;
               }
            });
            spyOn(xToken.entityDeclaration, 'assignUnassigned').and.callFake((pToken) => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')),
                  new xToken.entityStart.ParamPToken({ refPToken: refToSecond }),
                  // the reference is eaten, because it really generates no data.
                  new xToken.entityEnd.ParamPToken({ refPToken: refToSecond }),
               ]);
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, done);
         });

         it('expands a series of PERefs that have content', (done) => {
            const refToThird = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('third'),
               close: SToken.fromString(';'),
            });
            const secondDeclPToken = new xToken.entityDeclaration.ParamPToken({
               name: SToken.fromString('second'),
               value: [
                  xToken.unassigned.wordFromSToken(SToken.fromString('SYSTEM')),
                  // third was expanded ealier in place.
                  new xToken.entityStart.ParamPToken({ refPToken: refToThird }),
                  new xToken.text.PToken({ text: SToken.fromString('"http://somewhere.com"') }),
                  new xToken.entityEnd.ParamPToken({ refPToken: refToThird }),
               ],
            });
            const secondDeclXToken = xToken.entityDeclaration.pTokenToXToken(secondDeclPToken);
            const refToSecond = new xToken.entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('second'),
               close: SToken.fromString(';'),
            });
            const declToken = new xToken.entityDeclaration.pTokenToXToken({
               unassigned: [
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')),
                  refToSecond
               ],
               nextParamName: 'parameter',
            });
            spyOn(entityManager, 'getParameterEntityToken').and.callFake((name) => {
               if (name === 'second') {
                  return secondDeclXToken;
               } else if (name === 'third') {
                  return thirdDeclXToken;
               }
            });
            spyOn(xToken.unassigned, 'parseAllValues').and.callFake((source, callback) => {
               callback([
                  xToken.unassigned.wordFromSToken(SToken.fromString('SYSTEM')),
                  {
                     type: 'literal',
                     openQuote: SToken.fromString('"'),
                     value: [ SToken.fromString('http://somewhere.com') ],
                     closeQuote: SToken.fromString('"'),
                  },
               ]);
            });
            spyOn(xToken.entityDeclaration, 'assignUnassigned').and.callFake((pToken) => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')),
                  new xToken.entityStart.ParamPToken({ refPToken: refToSecond }),
                  xToken.unassigned.wordFromSToken(SToken.fromString('SYSTEM')),
                  {
                     type: 'literal',
                     openQuote: SToken.fromString('"'),
                     value: [ SToken.fromString('http://somewhere.com') ],
                     closeQuote: SToken.fromString('"'),
                  },
                  new xToken.entityEnd.ParamPToken({ refPToken: refToSecond }),
               ]);
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, done);
         });

      });

      describe('notation declaration processing', () => {

         it('processes through the unassigned values', (done) => {
            const unassignedVals = [ xToken.unassigned.spaceFromSToken(SToken.fromString('public')) ];
            const pToken = {
               name: SToken.fromString('test'),
               unassigned: unassignedVals,
               externalId: {
                  nextParamName: 'idType',
                  unassigned: unassignedVals,
               },
            };
            const declToken = new xToken.notationDeclaration.pTokenToXToken(pToken);
            spyOn(xToken.notationDeclaration, 'assignUnassigned').and.callFake((pToken) => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.spaceFromSToken(SToken.fromString('public')),
               ]);
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, done);
         });

         it('handles the lack of an externalId', (done) => {
            const unassignedVals = [ xToken.unassigned.spaceFromSToken(SToken.fromString('theName')) ];
            const pToken = {
               unassigned: unassignedVals,
               nextPropName: 'name',
            };
            const declToken = new xToken.notationDeclaration.pTokenToXToken(pToken);
            spyOn(xToken.notationDeclaration, 'assignUnassigned').and.callFake((pToken) => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.spaceFromSToken(SToken.fromString('theName')),
               ]);
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, done);
         });

         // Other testing is implicitly covered in entity declaration testing

      });

      describe('attlist declaration processing', () => {

         it('processes through the unassigned values', (done) => {
            const unassignedVals = [ xToken.unassigned.wordFromSToken(SToken.fromString('elName')) ];
            const pToken = {
               attDefs: [],
               unassigned: unassignedVals,
            };
            const declToken = new xToken.attListDeclaration.pTokenToXToken(pToken);
            spyOn(xToken.attListDeclaration, 'assignUnassigned').and.callFake((pToken) => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('elName')),
               ]);
            });

            nodeStream.write(declToken);

            gatherResults(nodeStream, done);
         });

         it('passes a complete ATTLIST token through', () => {
            const pToken = {
               attDefs: [],
            };
            const declToken = new xToken.attListDeclaration.pTokenToXToken(pToken);
            spyOn(nodeStream, 'push');

            nodeStream.write(declToken);

            expect(nodeStream.push).toHaveBeenCalledWith(declToken);
         });

         // Other testing is implicitly covered in entity declaration testing

      });

   });

});

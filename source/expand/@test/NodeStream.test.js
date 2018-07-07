/* Copyright ® 2016-2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../basic';
import { WellFormedError } from '../../error';
import { SToken } from '../../sToken';
import * as xToken from '../../token';

import NodeStream from '../NodeStream.js';
import EntityManager from '../EntityManager.js';

describe('NodeStream (unit)', () => {

   function gatherResult(stream, expect) {
      stream.on('data', (item) => {
         expect(item);
      });
   }

   function gatherResults(stream, expect) {
      const cache = [];
      stream.on('data', (item) => {
         cache.push(item);
      });

      stream.on('end', () => {
         expect(cache);
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

            gatherResult(nodeStream, (result) => {
               expect(result.value[0]).toEqual(refToken);
            });
         });

         it('does not expand an entity reference that has no name', () => {
            const declToken = new xToken.entityDeclaration.ParamXToken('test', [], undefined, undefined, []);
            const refToken = new xToken.entityReference.ParamPToken({ name: undefined });
            declToken.value.push(refToken);

            nodeStream.write(declToken);

            gatherResult(nodeStream, (result) => {
               expect(result.value[0]).toEqual(refToken);
            });
         });

      });

      describe('element declaration processing', () => {

         it('passes the element declaration through if there are no unassigned', (done) => {
            const pToken = {
               name: SToken.fromString('test'),
            };
            const declToken = new xToken.elementDeclaration.pTokenToXToken(pToken);

            nodeStream.write(declToken);

            gatherResult(nodeStream, (token) => {
               expect(token).toEqual(declToken);
               done();
            });
         });

         it('processes through the unassigned values', (done) => {
            const unassignedVals = [ xToken.unassigned.wordFromSToken(SToken.fromString('ANY')) ];
            const pToken = {
               name: SToken.fromString('test'),
               unassigned: unassignedVals,
            };
            const declToken = new xToken.elementDeclaration.pTokenToXToken(pToken);
            spyOn(xToken.elementDeclaration, 'assignUnassigned').and.callFake((pToken) => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('ANY')),
               ]);
            });

            nodeStream.write(declToken);

            gatherResult(nodeStream, done);
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

            gatherResult(nodeStream, (token) => {
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

            gatherResult(nodeStream, (token) => {
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

            gatherResult(nodeStream, (token) => {
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

            gatherResult(nodeStream, (token) => {
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

            gatherResult(nodeStream, (token) => {
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

            gatherResult(nodeStream, (token) => {
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

            gatherResult(nodeStream, (token) => {
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

            gatherResult(nodeStream, (token) => {
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

            gatherResult(nodeStream, (token) => {
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
                  {
                     type: 'reference',
                     token: refToSecond,
                  },
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
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')), {
                     type: 'entityStart',
                     token: new xToken.entityStart.ParamPToken({ refPToken: refToSecond }),
                  },
                  // the reference is eaten, because it really generates no data.
                  {
                     type: 'entityEnd',
                     token: new xToken.entityEnd.ParamPToken({ refPToken: refToSecond }),
                  },
               ]);
            });

            nodeStream.write(declToken);

            gatherResult(nodeStream, done);
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
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')), {
                     type: 'reference',
                     token: refToSecond,
                  },
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
            spyOn(xToken.unassigned, 'parseAllValues').and.callFake((source, _2, callback) => {
               callback([
                  xToken.unassigned.wordFromSToken(SToken.fromString('SYSTEM')),
                  {
                     type: 'literal',
                     token: {
                        openQuote: SToken.fromString('"'),
                        value: [ SToken.fromString('http://somewhere.com') ],
                        closeQuote: SToken.fromString('"'),
                     }
                  },
               ]);
            });
            spyOn(xToken.entityDeclaration, 'assignUnassigned').and.callFake((pToken) => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')), {
                     type: 'entityStart',
                     token: new xToken.entityStart.ParamPToken({ refPToken: refToSecond }),
                  }, xToken.unassigned.wordFromSToken(SToken.fromString('SYSTEM')),
                  {
                     type: 'literal',
                     token: {
                        openQuote: SToken.fromString('"'),
                        value: [ SToken.fromString('http://somewhere.com') ],
                        closeQuote: SToken.fromString('"'),
                     }
                  }, {
                     type: 'entityEnd',
                     token: new xToken.entityEnd.ParamPToken({ refPToken: refToSecond }),
                  }
               ]);
            });

            nodeStream.write(declToken);

            gatherResult(nodeStream, done);
         });

      });

      describe('notation declaration processing', () => {

         it('processes through the unassigned values', (done) => {
            const unassignedVals = [ xToken.unassigned.wordFromSToken(SToken.fromString('public')) ];
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
                  xToken.unassigned.wordFromSToken(SToken.fromString('public')),
               ]);
            });

            nodeStream.write(declToken);

            gatherResult(nodeStream, done);
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

            gatherResult(nodeStream, done);
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

            gatherResult(nodeStream, done);
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

      describe('element processing', () => {

         it('processes an element with no attributes without problems', (done) => {
            const elementStart = new xToken.elementStart.XToken('one', [], {});
            const expected = new xToken.elementStart.XToken('one', [], {});

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         it('passes attributes through with no content', (done) => {
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [],
            }], {});
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [],
            }], {});

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         it('passes attributes through that are only text', (done) => {
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [ new xToken.text.XToken('one', {}) ],
            }, {
               name: 'two',
               value: [ new xToken.text.XToken('foo', {}) ],
            }], {});
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [ new xToken.text.XToken('one', {}) ],
            }, {
               name: 'two',
               value: [ new xToken.text.XToken('foo', {}) ],
            }], {});

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         it('replaces a general entity', (done) => {
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: true,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1, _2, cb) => {
               cb([ new xToken.text.PToken() ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               return [ new xToken.text.XToken('one', {}) ];
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new xToken.entityReference.XToken('refName', {}),
               ],
            }], {});
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new xToken.entityStart.XToken('refName'),
                  new xToken.text.XToken('one', {}),
                  new xToken.entityEnd.XToken('refName'),
               ],
            }], {});

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         // Our routines are not always async. and the tests here all exercise sync code.
         // This test switches the low level parsing to being async so we can
         // make sure the higher level code still handles this.
         it('replaces a general entity asynchronously', (done) => {
            let asyncCallback;
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: true,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1, _2, cb) => {
               asyncCallback = cb;
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible')
               .and.returnValue([ new xToken.text.XToken('one', {}) ]);
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new xToken.entityReference.XToken('refName', {}),
               ],
            }], {});
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new xToken.entityStart.XToken('refName'),
                  new xToken.text.XToken('one', {}),
                  new xToken.entityEnd.XToken('refName'),
               ],
            }], {});

            nodeStream.write(elementStart);

            asyncCallback([ new xToken.text.PToken() ]);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         it('replaces values in multiple attributes', (done) => {
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: true,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1, _2, cb) => {
               cb([ new xToken.text.PToken() ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               return [ new xToken.text.XToken('one', {}) ];
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'firstAttribute',
               value: [
                  new xToken.entityReference.XToken('refName', {}),
               ],
            }, {
               name: 'secondAttribute',
               value: [
                  new xToken.entityReference.XToken('refName', {}),
               ],
            }], {});
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'firstAttribute',
               value: [
                  new xToken.entityStart.XToken('refName'),
                  new xToken.text.XToken('one', {}),
                  new xToken.entityEnd.XToken('refName'),
               ],
            }, {
               name: 'secondAttribute',
               value: [
                  new xToken.entityStart.XToken('refName'),
                  new xToken.text.XToken('one', {}),
                  new xToken.entityEnd.XToken('refName'),
               ],
            }], {});

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         it('replaces values in attributes which are a mix of references and text', (done) => {
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: true,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1, _2, cb) => {
               cb([ new xToken.text.PToken() ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               return [ new xToken.text.XToken('one', {}) ];
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'firstAttribute',
               value: [
                  new xToken.text.XToken('some text', {}),
                  new xToken.entityReference.XToken('refName', {}),
                  new xToken.text.XToken('more text', {}),
               ],
            }], {});
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'firstAttribute',
               value: [
                  new xToken.text.XToken('some text', {}),
                  new xToken.entityStart.XToken('refName'),
                  new xToken.text.XToken('one', {}),
                  new xToken.entityEnd.XToken('refName'),
                  new xToken.text.XToken('more text', {}),
               ],
            }], {});

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         it('replaces references in references', (done) => {
            let callCount = 0;
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: true,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1, _2, cb) => {
               cb([ /* PTokens for text, entity ref and text */ ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               callCount ++;
               if (callCount === 1) {
                  return [
                     new xToken.text.XToken('pre ', {}),
                     new xToken.entityReference.XToken('child', {}),
                     new xToken.text.XToken(' post', {}),
                  ];
               } else {
                  return [ new xToken.text.XToken('inner', {}) ];
               }
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'testAttribute',
               value: [
                  new xToken.text.XToken('some text', {}),
                  new xToken.entityReference.XToken('parent', {}),
                  new xToken.text.XToken('more text', {}),
               ],
            }], {});
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'testAttribute',
               value: [
                  new xToken.text.XToken('some text', {}),
                  new xToken.entityStart.XToken('parent'),
                  new xToken.text.XToken('pre ', {}),
                  new xToken.entityStart.XToken('child'),
                  new xToken.text.XToken('inner', {}),
                  new xToken.entityEnd.XToken('child'),
                  new xToken.text.XToken(' post', {}),
                  new xToken.entityEnd.XToken('parent'),
                  new xToken.text.XToken('more text', {}),
               ],
            }], {});

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         it('reports an error if there is a "<" in the replacement text of any attribute value', (done) => {
            let callCount = 0;
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: true,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1, _2, cb) => {
               cb([ /* PTokens for text, entity ref and text */ ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               callCount ++;
               if (callCount === 1) {
                  return [
                     new xToken.text.XToken('pre ', {}),
                     new xToken.entityReference.XToken('child', {}),
                     new xToken.text.XToken(' post', {}),
                  ];
               } else {
                  return [ new xToken.text.XToken('inn<er', {}) ];
               }
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'testAttribute',
               value: [
                  new xToken.text.XToken('some text', {}),
                  new xToken.entityReference.XToken('parent', {}),
                  new xToken.text.XToken('more text', {}),
               ],
            }], {});
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_VALUE,
               [ 'testAttribute' ]);

            nodeStream.write(elementStart);
            nodeStream.end();

            gatherResults(nodeStream, (results) => {
               expect(results[0]).toEqual(expected);
               done();
            });
         });

         it('reports an error if a referenced entity is an external one', (done) => {
            let asyncCallback;
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: false,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1, _2, cb) => {
               asyncCallback = cb;
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible')
               .and.returnValue([ new xToken.text.XToken('one', {}) ]);
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new xToken.entityReference.XToken('refName', {}),
               ],
            }], {});
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
               [ 'refName' ]);

            nodeStream.write(elementStart);
            nodeStream.end();

            asyncCallback([ new xToken.text.PToken() ]);

            gatherResults(nodeStream, (results) => {
               expect(results[0]).toEqual(expected);
               done();
            });
         });

         it('does not mind if the pToken has been removed by the time it processes', (done) => {
            let asyncCallback;
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: false,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1, _2, cb) => {
               asyncCallback = cb;
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible')
               .and.returnValue([ new xToken.text.XToken('one', {}) ]);
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new xToken.entityReference.XToken('refName', {}),
               ],
            }], {});
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
               [ 'refName' ]);
            delete elementStart.attributes[0].value[0].pToken;

            nodeStream.write(elementStart);
            nodeStream.end();

            asyncCallback([ new xToken.text.PToken() ]);

            gatherResults(nodeStream, (results) => {
               expect(results[0]).toEqual(expected);
               done();
            });
         });

      });

      describe('references', () => {

         it('passes an unknown reference through', () => {
            const token = new xToken.entityReference.XToken('testReference', []);
   
            nodeStream.write(token);
            nodeStream.read(); // skip the error
   
            expect(nodeStream.read()).toEqual(token);
         });

         it('reports an error if an unknown reference is found', () => {
            const token = new xToken.entityReference.XToken('testReference', {});
   
            nodeStream.write(token);
   
            expect(nodeStream.read()).toEqual(new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION,
               [ token.name ]));
         });
   
      });

   });

});

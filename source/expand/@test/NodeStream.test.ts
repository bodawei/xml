/* Copyright ® 2016-2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import stream from 'readable-stream';

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { ErrorCollector, ValidityError, WellFormedError, XmlWarning } from '../../error';
import { SToken, STokenSource } from '../../sToken';
import * as langAttribute from '../../token/common/langAttribute';
import { UnassignedType } from '../../token/common/unassigned';
import { AttListPToken, AttDefXToken } from '../../token/attListDeclaration'; // hack
import { ElementDeclarationPToken } from '../../token/elementDeclaration'; // hack

import NodeStream from '../NodeStream';
import EntityManager from '../EntityManager';
import { DocTypeStartXToken } from 'source/token/docTypeStart';
import { DocTypeEndXToken } from 'source/token/docTypeEnd';
import {
   ExternalSubsetEndXToken,
   ExternalSubsetStartXToken,
   GeneralEntityEndXToken,
   GeneralEntityStartXToken,
   InternalSubsetEndXToken,
   InternalSubsetStartXToken,
   ParameterEntityEndPToken,
   ParameterEntityStartXToken,
   ParameterEntityStartPToken,
   XmlDeclarationXToken,
   GeneralEntityDeclarationXToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   GeneralEntityReferenceXToken,
   NotationDeclarationPToken,
   NotationDeclarationXToken,
   ParameterEntityDeclarationXToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferenceXToken,
   ParameterEntityReferencePToken,
} from '../../token';
import * as xToken from '../../token';

type Token = { type: string };
type TokenArray = Array<Token>;

describe('NodeStream (unit)', () => {

   function gatherResult(stream: stream.Transform, expect: (result: Token) => void) {
      stream.on('data', (item: Token) => {
         expect(item);
      });
   }

   function gatherResults(stream: stream.Transform, expect: (results: TokenArray) => void) {
      const cache: TokenArray = [];
      stream.on('data', (item: Token) => {
         cache.push(item);
      });

      stream.on('end', () => {
         expect(cache);
      });
   }

   describe('.write()', () => {
      let entityManager: EntityManager;
      let nodeStream: NodeStream;

      beforeEach(() => {
         entityManager = new EntityManager();
         nodeStream = new NodeStream(entityManager);
      });

      it('passes tokens through', () => {
         const token = new xToken.elementStart.XToken('fred', []);

         nodeStream.write(token);

         expect(nodeStream.read()).toEqual(token);
      });

      it('passes a notification delcaration through', () => {
         const token = new NotationDeclarationXToken('fred', undefined);

         nodeStream.write(token);

         expect(nodeStream.read()).toEqual(token);
      });

      describe('sub-stream processing', () => {

         it('adds a start entity token to the stream', () => {
            const declToken = new xToken.GeneralEntityDeclarationXToken('test', [], undefined, undefined);
            const refToken = new GeneralEntityReferenceXToken('test');

            nodeStream.write(declToken);
            nodeStream.write(refToken);

            nodeStream.read(); // decl token
            expect(nodeStream.read()).toEqual(new GeneralEntityStartXToken('test'));
         });

         it('adds a start entity token to the stream when it encounters a parameter entity ref', () => {
            const declToken = new xToken.ParameterEntityDeclarationXToken('test', [], undefined, undefined);
            const refToken = new ParameterEntityReferenceXToken('test');

            nodeStream.write(declToken);
            nodeStream.write(refToken);

            nodeStream.read(); // decl token
            expect(nodeStream.read()).toEqual(new ParameterEntityStartXToken('test'));
         });

         it('passes a reference with no referent straight through', () => {
            const declToken = new xToken.ParameterEntityDeclarationXToken('test', [], undefined, undefined);
            const refToken: any = new ParameterEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('test') });
            (declToken.value  as any).push(refToken);

            nodeStream.write(declToken);

            gatherResult(nodeStream, (result: any) => {
               expect(result.value[0]).toEqual(refToken);
            });
         });

         it('does not expand an entity reference that has no name', () => {
            const declToken = new xToken.ParameterEntityDeclarationXToken('test', [], undefined, undefined);
            const refToken = new ParameterEntityReferencePToken({ open: SToken.fromString('&'), name: undefined });
            (declToken.value  as any).push(refToken);

            nodeStream.write(declToken);

            gatherResult(nodeStream, (result: any) => {
               expect(result.value[0]).toEqual(refToken);
            });
         });

      });

      describe('DOCTYPE processing', () => {

         it('adds an internal subset marker to the stream when there is an internal subset', () => {
            const declToken = new DocTypeStartXToken('test', undefined, true);

            nodeStream.write(declToken);
            nodeStream.end;

            nodeStream.read(); // decl token
            expect(nodeStream.read()).toEqual(new InternalSubsetStartXToken());
         });

         it('adds no internal subset marker to the stream when there is no internal subset', () => {
            const declToken = new DocTypeStartXToken('test', undefined, false);

            nodeStream.write(declToken);
            nodeStream.end;

            nodeStream.read(); // decl token
            expect(nodeStream.read()).toEqual(null)
         });

         it('adds an end of internal subset marker when there is an internal subset', () => {
            const declToken = new DocTypeStartXToken('test', undefined, true);
            const declEndToken = new DocTypeEndXToken();

            nodeStream.write(declToken);
            nodeStream.write(declEndToken);
            nodeStream.end;

            nodeStream.read(); // decl token
            nodeStream.read(); // internal start
            expect(nodeStream.read()).toEqual(new InternalSubsetEndXToken())
         });

         it('adds an end of internal subset marker when there is no internal subset', () => {
            const declToken = new DocTypeStartXToken('test', undefined, false);
            const declEndToken = new DocTypeEndXToken();

            nodeStream.write(declToken);
            nodeStream.write(declEndToken);
            nodeStream.end;

            nodeStream.read(); // decl token
            expect(nodeStream.read()).toEqual(declEndToken)
         });

         it('adds an external subset start marker if there is one', () => {
            const declToken = new DocTypeStartXToken('test', new EntityLocation(), false);
            const declEndToken = new DocTypeEndXToken();

            nodeStream.write(declToken);
            nodeStream.write(declEndToken);
            nodeStream.end;

            nodeStream.read(); // decl token
            expect(nodeStream.read()).toEqual(new ExternalSubsetStartXToken())
         });

         it('adds an external subset end marker if there is one', () => {
            const declToken = new DocTypeStartXToken('test', new EntityLocation(), false);
            const declEndToken = new DocTypeEndXToken();

            nodeStream.write(declToken);
            nodeStream.write(declEndToken);
            nodeStream.end;

            nodeStream.read(); // decl token
            nodeStream.read(); // external start
            expect(nodeStream.read()).toEqual(new ExternalSubsetEndXToken());
         });

         it('orders internal and external subsets properly', () => {
            const declToken = new DocTypeStartXToken('test', new EntityLocation(), true);
            const declEndToken = new DocTypeEndXToken();

            nodeStream.write(declToken);
            nodeStream.write(declEndToken);
            nodeStream.end;

            expect(nodeStream.read()).toEqual(declToken);
            expect(nodeStream.read()).toEqual(new InternalSubsetStartXToken());
            expect(nodeStream.read()).toEqual(new InternalSubsetEndXToken());
            expect(nodeStream.read()).toEqual(new ExternalSubsetStartXToken());
            expect(nodeStream.read()).toEqual(new ExternalSubsetEndXToken());
            expect(nodeStream.read()).toEqual(declEndToken);
         });

      });

      describe('element declaration processing', () => {

         it('passes the element declaration through if there are no unassigned', (done) => {
            const pToken = new ElementDeclarationPToken({
               name: SToken.fromString('test'),
            });
            const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);

            nodeStream.write(declToken);

            gatherResult(nodeStream, (token) => {
               expect(token).toEqual(declToken);
               done();
            });
         });

         it('processes through the unassigned values', (done) => {
            const unassignedVals = [ xToken.unassigned.wordFromSToken(SToken.fromString('ANY')) ];
            const pToken = new ElementDeclarationPToken({
               name: SToken.fromString('test'),
               unassigned: unassignedVals,
            });
            const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
            spyOn(xToken.elementDeclaration, 'assignUnassigned').and.callFake((pToken: ElementDeclarationPToken) => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('ANY')),
               ]);
            });

            nodeStream.write(declToken);

            gatherResult(nodeStream, done);
         });

         it('ignores PE Reference processing if there is no pToken', (done) => {
            const pToken = new ElementDeclarationPToken({
               name: SToken.fromString('test'),
               unassigned: [],
            });
            const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
            delete declToken.pToken;

            nodeStream.write(declToken);

            gatherResult(nodeStream, done);
         });

         // describe('parameter entity validation', () => {

         //    beforeEach(() => {
         //       spyOn(xToken.elementDeclaration, 'assignUnassigned');
         //    });

         //    it('does no checks if the content spec is already closed', (done) => {
         //       const pToken = new ElementDeclarationPToken({
         //          open: SToken.fromString('<!'),
         //          name: SToken.fromString('test'),
         //          children: {
         //             open: SToken.fromString('('),
         //             close: SToken.fromString(')'),
         //             names: [],
         //          },
         //          unassigned: [{
         //             type: UnassignedType.ENTITY_START,
         //             token: new xToken.elementStart.PToken({ name: SToken.fromString('testPE') }),
         //          }, {
         //             type: 'word',
         //             token: new xToken.text.PToken({ text: SToken.fromString('x') }),
         //          }, {
         //             type: 'space',
         //             token: new xToken.text.PToken({ text: SToken.fromString(' ') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new xToken.elementEnd.PToken({ name: SToken.fromString('testPE') }),
         //          }],
         //       });
         //       const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
         //       spyOn(xToken.elementDeclaration, 'pTokenToXToken').and.callFake(() => ({ type: 'test' }));

         //       nodeStream.write(declToken);
         //       nodeStream.end();

         //       gatherResults(nodeStream, (tokens) => {
         //          expect(tokens).toEqual([{ type: 'test' }]);
         //          done();
         //       });
         //    });

         //    it('reports no warnings with a syntactically ok expansion', (done) => {
         //       const pToken = new ElementDeclarationPToken({
         //          open: SToken.fromString('<!'),
         //          name: SToken.fromString('test'),
         //          children: {
         //             open: SToken.fromString('('),
         //             names: [],
         //          },
         //          unassigned: [{
         //             type: UnassignedType.ENTITY_START,
         //             token: new xToken.elementStart.PToken({ name: SToken.fromString('testPE') }),
         //          }, {
         //             type: 'word',
         //             token: new xToken.text.PToken({ text: SToken.fromString('x') }),
         //          }, {
         //             type: 'space',
         //             token: new xToken.text.PToken({ text: SToken.fromString(' ') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new xToken.elementEnd.PToken({ name: SToken.fromString('testPE') }),
         //          }],
         //       });
         //       const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
         //       spyOn(xToken.elementDeclaration, 'pTokenToXToken').and.callFake(() => ({ type: 'test' }));

         //       nodeStream.write(declToken);
         //       nodeStream.end();

         //       gatherResults(nodeStream, (tokens) => {
         //          expect(tokens).toEqual([{ type: 'test' }]);
         //          done();
         //       });
         //    });

         //    it('reports a warning if the parameter entity expansion is empty', (done) => {
         //       const pToken = new ElementDeclarationPToken({
         //          open: SToken.fromString('<!'),
         //          name: SToken.fromString('test'),
         //          children: {
         //             open: SToken.fromString('('),
         //             names: [],
         //          },
         //          unassigned: [{
         //             type: UnassignedType.ENTITY_START,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }],
         //       });
         //       const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
         //       const expected = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
         //          [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open); // typeHack
         //       spyOn(xToken.elementDeclaration, 'pTokenToXToken').and.callFake((x: ElementDeclarationPToken) => x);

         //       nodeStream.write(declToken);
         //       nodeStream.end();

         //       gatherResults(nodeStream, (tokens) => {
         //          expect(tokens[0]).toEqual(expected);
         //          done();
         //       });
         //    });

         //    it('reports a warning if the parameter entity expansion is only white space', (done) => {
         //       const pToken = new ElementDeclarationPToken({
         //          open: SToken.fromString('<!'),
         //          name: SToken.fromString('test'),
         //          children: {
         //             open: SToken.fromString('('),
         //             names: [],
         //          },
         //          unassigned: [{
         //             type: UnassignedType.ENTITY_START,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }, {
         //             type: 'space',
         //             token: new xToken.text.PToken({ text: SToken.fromString(' ') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }],
         //       });
         //       const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
         //       const expected = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
         //          [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open);
         //       spyOn(xToken.elementDeclaration, 'pTokenToXToken').and.callFake((x: ElementDeclarationPToken) => x);

         //       nodeStream.write(declToken);
         //       nodeStream.end();

         //       gatherResults(nodeStream, (tokens) => {
         //          expect(tokens[0]).toEqual(expected);
         //          done();
         //       });
         //    });

         //    it('reports no error when there is a literal and whitespace in the unassigned', (done) => {
         //       const pToken = new ElementDeclarationPToken({
         //          open: SToken.fromString('<!'),
         //          name: SToken.fromString('test'),
         //          children: {
         //             open: SToken.fromString('('),
         //             names: [],
         //          },
         //          unassigned: [{
         //             type: UnassignedType.ENTITY_START,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }, {
         //             type: 'literal',
         //             token: {},
         //          }, {
         //             type: 'space',
         //             token: new xToken.text.PToken({ text: SToken.fromString(' ') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }],
         //       });
         //       const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
         //       spyOn(xToken.elementDeclaration, 'pTokenToXToken').and.callFake(() => ({ type: 'test' }));

         //       nodeStream.write(declToken);
         //       nodeStream.end();

         //       gatherResults(nodeStream, (tokens) => {
         //          expect(tokens).toEqual([{ type: 'test' }]);
         //          done();
         //       });
         //    });

         //    it('reports a warning if the parameter entity expansion ends with a |', (done) => {
         //       const pToken = new ElementDeclarationPToken({
         //          open: SToken.fromString('<!'),
         //          name: SToken.fromString('test'),
         //          children: {
         //             open: SToken.fromString('('),
         //             names: [],
         //          },
         //          unassigned: [{
         //             type: UnassignedType.ENTITY_START,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }, {
         //             type: 'word',
         //             token: new xToken.text.PToken({ text: SToken.fromString('|') }),
         //          }, {
         //             type: 'space',
         //             token: new xToken.text.PToken({ text: SToken.fromString(' ') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }],
         //       });
         //       const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
         //       const expected = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_TRAILING_CONNECTOR,
         //          [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open);
         //       spyOn(xToken.elementDeclaration, 'pTokenToXToken').and.callFake((x: ElementDeclarationPToken) => x);

         //       nodeStream.write(declToken);
         //       nodeStream.end();

         //       gatherResults(nodeStream, (tokens) => {
         //          expect(tokens[0]).toEqual(expected);
         //          done();
         //       });
         //    });

         //    it('reports a warning if the parameter entity expansion ends with a ,', (done) => {
         //       const pToken = new ElementDeclarationPToken({
         //          open: SToken.fromString('<!'),
         //          name: SToken.fromString('test'),
         //          children: {
         //             open: SToken.fromString('('),
         //             names: [],
         //          },
         //          unassigned: [{
         //             type: UnassignedType.ENTITY_START,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }, {
         //             type: 'word',
         //             token: new xToken.text.PToken({ text: SToken.fromString(',') }),
         //          }, {
         //             type: 'space',
         //             token: new xToken.text.PToken({ text: SToken.fromString(' ') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }],
         //       });
         //       const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
         //       const expected = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_TRAILING_CONNECTOR,
         //          [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open);
         //       spyOn(xToken.elementDeclaration, 'pTokenToXToken').and.callFake((x: ElementDeclarationPToken) => x);

         //       nodeStream.write(declToken);
         //       nodeStream.end();

         //       gatherResults(nodeStream, (tokens) => {
         //          expect(tokens[0]).toEqual(expected);
         //          done();
         //       });
         //    });

         //    it('reports a validation error if parentheses are not balanced in the top entity', (done) => {
         //       const pToken = new ElementDeclarationPToken({
         //          open: SToken.fromString('<!'),
         //          name: SToken.fromString('test'),
         //          children: {
         //             open: SToken.fromString('('),
         //             names: [],
         //          },
         //          unassigned: [{
         //             type: UnassignedType.ENTITY_START,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }, {
         //             type: 'word',
         //             token: new xToken.text.PToken({ text: SToken.fromString('(') }),
         //          }, {
         //             type: 'space',
         //             token: new xToken.text.PToken({ text: SToken.fromString(' ') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }],
         //       });
         //       const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
         //       const expected = new ValidityError(ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
         //          [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open);  //typeHack
         //       spyOn(xToken.elementDeclaration, 'pTokenToXToken').and.callFake((x: ElementDeclarationPToken) => x);

         //       nodeStream.write(declToken);
         //       nodeStream.end();

         //       gatherResults(nodeStream, (tokens) => {
         //          expect(tokens[0]).toEqual(expected);
         //          done();
         //       });
         //    });

         //    it('reports no validatio nerror when parentheses are balanced at the top entity level', (done) => {
         //       const pToken = new ElementDeclarationPToken({
         //          open: SToken.fromString('<!'),
         //          name: SToken.fromString('test'),
         //          children: {
         //             open: SToken.fromString('('),
         //             names: [],
         //          },
         //          unassigned: [{
         //             type: UnassignedType.ENTITY_START,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }, {
         //             type: UnassignedType.ENTITY_START,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }, {
         //             type: 'word',
         //             token: new xToken.text.PToken({ text: SToken.fromString('(') }),
         //          }, {
         //             type: 'space',
         //             token: new xToken.text.PToken({ text: SToken.fromString(' ') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }, {
         //             // Note that the parenthesis is closed in another entity
         //             type: 'word',
         //             token: new xToken.text.PToken({ text: SToken.fromString(')') }),
         //          }, {
         //             type: 'space',
         //             token: new xToken.text.PToken({ text: SToken.fromString(' ') }),
         //          }, {
         //             type: UnassignedType.ENTITY_END,
         //             token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
         //          }],
         //       });
         //       const declToken = xToken.elementDeclaration.pTokenToXToken(pToken);
         //       const expected = new ValidityError(ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
         //          [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open);  //typeHack
         //       spyOn(xToken.elementDeclaration, 'pTokenToXToken').and.callFake(() => ({ type: 'test' }));

         //       nodeStream.write(declToken);
         //       nodeStream.end();

         //       gatherResults(nodeStream, (tokens) => {
         //          expect(tokens).toEqual([{ type: 'test' }]);
         //          done();
         //       });
         //    });

         // });
      });

      describe('entity declaration processing', () => {

         it('adds any general entity declarations to the entity manager', () => {
            spyOn(entityManager, 'addEntityFromInternalSubset');
            const token = new xToken.GeneralEntityDeclarationXToken('fred', [], undefined, undefined);

            nodeStream.write(token);

            expect(entityManager.addEntityFromInternalSubset).toHaveBeenCalledWith(token);
         });

         it('adds any parameter entity declarations to the entity manager', () => {
            spyOn(entityManager, 'addParameterEntityFromInternalSubset');
            const token = new xToken.ParameterEntityDeclarationXToken('fred', [], undefined, undefined);

            nodeStream.write(token);

            expect(entityManager.addParameterEntityFromInternalSubset).toHaveBeenCalledWith(token);
         });

         it('leaves a simple EntityValue untouched', (done) => {
            const pToken = new GeneralEntityDeclarationPToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [
                  new ParameterEntityReferencePToken({ open: SToken.fromString('%') })
               ],
            });
            const declToken = pToken.toXToken();

            nodeStream.write(declToken);

            gatherResult(nodeStream, (token) => {
               expect((token as GeneralEntityDeclarationXToken).value).toEqual([
                  new ParameterEntityReferencePToken({ open: SToken.fromString('%') })
               ]);

               done();
            });
         });

         it('leaves an undefined entity reference in the entity value unexpanded', (done) => {
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(undefined);
            const parentPeref = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('parentDecl'),
               close: SToken.fromString(';'),
            });
            const declToken = new GeneralEntityDeclarationPToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [ parentPeref ],
            }).toXToken();

            nodeStream.write(declToken);

            gatherResult(nodeStream, (token) => {
               expect((token as GeneralEntityDeclarationXToken).value).toEqual([
                  parentPeref,
               ]);

               done();
            });
         });

         it('leaves an entity declaration with no value unprocessed', (done) => {
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(undefined);
            const declToken = new GeneralEntityDeclarationPToken({
               name: SToken.fromString('generalEntityDeclaration'),
            }).toXToken();

            nodeStream.write(declToken);

            gatherResult(nodeStream, (token) => {
               expect((token as GeneralEntityDeclarationXToken).value).toEqual([]);

               done();
            });
         });

         it('expands an EntityValue-less entity reference', (done) => {
            // Define the pe declaration we will reference
            const parentDeclaration = new ParameterEntityDeclarationPToken({
               name: SToken.fromString('parentDecl'),
            });
            const parentToken = parentDeclaration.toXToken();
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(parentToken);
            // The reference to the above declaration
            const parentPeref = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('parentDecl'),
               close: SToken.fromString(';'),
            });
            const declToken = new GeneralEntityDeclarationPToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [ parentPeref ],
            }).toXToken();

            nodeStream.write(declToken);

            gatherResult(nodeStream, (token) => {
               expect((token as GeneralEntityDeclarationXToken).value).toEqual([
                  new ParameterEntityStartPToken(parentPeref),
                  new ParameterEntityEndPToken(parentPeref),
               ]);

               done();
            });
         });

         it('expands a PERefs that has no actual data in it', (done) => {
            // Define the pe declaration we will reference
            const parentDeclaration = new xToken.ParameterEntityDeclarationPToken({
               name: SToken.fromString('parentDecl'),
               value: [],
            });
            const parentToken = parentDeclaration.toXToken();
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(parentToken);
            // The reference to the above declaration
            const parentPeref = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('parentDecl'),
               close: SToken.fromString(';'),
            });
            const declToken = new GeneralEntityDeclarationPToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [ parentPeref ],
            }).toXToken();

            nodeStream.write(declToken);

            gatherResult(nodeStream, (token) => {
               expect((token as GeneralEntityDeclarationXToken).value).toEqual([
                  new ParameterEntityStartPToken(parentPeref),
                  new ParameterEntityEndPToken(parentPeref),
               ]);

               done();
            });
         });

         it('expands PERefs in the EntityValue', (done) => {
            // Define the pe declaration we will reference
            const parentDeclaration = new xToken.ParameterEntityDeclarationPToken({
               name: SToken.fromString('parentDecl'),
               value: [
                  new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%') })),
                  xToken.unassigned.wordFromSToken(
                     new SToken('childValue', 'childValue', new Range(new EntityLocation(), 0, 0, 0, 9, 0, 9))),
                  new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%') })),
               ],
            });
            const parentToken = parentDeclaration.toXToken();
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(parentToken);
            // The reference to the above declaration
            const parentPeref = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('parentDecl'),
               close: SToken.fromString(';'),
            });
            const declToken = new GeneralEntityDeclarationPToken({
               name: SToken.fromString('generalEntityDeclaration'),
               value: [ parentPeref ],
            }).toXToken();

            nodeStream.write(declToken);

            gatherResult(nodeStream, (token) => {
               expect((token as any).value).toEqual([ // typeHack
                  new ParameterEntityStartPToken(parentPeref),
                  new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%') })),
                  parentDeclaration.value[1],
                  new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%') })),
                  new ParameterEntityEndPToken(parentPeref),
               ]);

               done();
            });
         });

         it('handles unassigned values', (done) => {
            const declToken = new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<'),
               unassigned: [
                  xToken.unassigned.wordFromSToken(SToken.fromString('thename')),
               ],
               nextParamName: 'parameter',
            });
            spyOn(declToken, 'assignUnassigned').and.callFake(() => {
               (declToken as any).name = SToken.fromString('newName');
               delete (declToken as any).unassigned;
            });

            nodeStream.write(declToken.toXToken());

            gatherResult(nodeStream, (token) => {
               expect(token).toEqual(new xToken.GeneralEntityDeclarationXToken('newName', [], undefined, '', new GeneralEntityDeclarationPToken({
                  open: SToken.fromString('<'),
                  name: SToken.fromString('newName'),
                  nextParamName: 'parameter',
                  assignUnassigned: declToken.assignUnassigned,
               })));

               done();
            });
         });

         it('does not expand a PERef in the unassigned values if there is no definition', (done) => {
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(undefined);
            const peRef = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('testDecl'),
               close: SToken.fromString(';'),
            });
            const declToken = new GeneralEntityDeclarationPToken({
               unassigned: [{
                  type: 'reference',
                  token: peRef
               }],
               nextParamName: 'parameter',
            });
            spyOn(declToken, 'assignUnassigned').and.callFake(() => {});

            nodeStream.write(declToken.toXToken());

            gatherResult(nodeStream, (token) => {
               expect(token).toEqual(new xToken.GeneralEntityDeclarationXToken('', [], undefined, '', new GeneralEntityDeclarationPToken({
                     unassigned: [{
                        type: 'reference',
                        token: peRef
                     }],
                     nextParamName: 'parameter',
                     assignUnassigned: declToken.assignUnassigned,
                  })));

               done();
            });
         });

         it('expands a PERef in the unassigned values if it has no value', (done) => {
            const valuelessToken = new xToken.ParameterEntityDeclarationPToken({
               name: SToken.fromString('testRef'),
            });
            const entityToken = valuelessToken.toXToken();
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(entityToken);
            const peRef = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('testDecl'),
               close: SToken.fromString(';'),
            });

            const declToken = new GeneralEntityDeclarationPToken({
               unassigned: [{
                  type: 'reference',
                  token: peRef
               }],
               nextParamName: 'parameter',
            });
            spyOn(declToken, 'assignUnassigned').and.callFake(() => {});

            nodeStream.write(declToken.toXToken());

            gatherResult(nodeStream, (token) => {
               expect(token).toEqual(new xToken.GeneralEntityDeclarationXToken('', [], undefined, '', new GeneralEntityDeclarationPToken({
                  unassigned: [{
                     type: UnassignedType.ENTITY_START,
                     token: peRef,
                  },
                  {
                     type: UnassignedType.ENTITY_END,
                     token: peRef,
                  },],
                  nextParamName: 'parameter',
                  assignUnassigned: declToken.assignUnassigned,
               })));

               done();
            });
         });

         it('does not expand a PERef in the unassigned values if it has no name', (done) => {
            spyOn(entityManager, 'getParameterEntityToken').and.returnValue(undefined);
            const peRef = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
            });
            const declToken = new GeneralEntityDeclarationPToken({
               unassigned: [{
                  type: 'reference',
                  token: peRef
               }],
               nextParamName: 'parameter',
            });
            spyOn(declToken, 'assignUnassigned').and.callFake(() => {});

            nodeStream.write(declToken.toXToken());

            gatherResult(nodeStream, (token) => {
               expect(token).toEqual(new xToken.GeneralEntityDeclarationXToken('', [], undefined, '', new GeneralEntityDeclarationPToken({
                  unassigned: [{
                     type: 'reference',
                     token: peRef
                  }],
                  nextParamName: 'parameter',
                  assignUnassigned: declToken.assignUnassigned,
               })));

               done();
            });
         });

         it('expands a series of PERefs that themselves have no content', (done) => {
            const refToMissing = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('third'),
               close: SToken.fromString(';'),
            });
            const secondDeclPToken = new xToken.ParameterEntityDeclarationPToken({
               name: SToken.fromString('second'),
               value: [ refToMissing ],
            });
            const secondDeclXToken = secondDeclPToken.toXToken();
            const refToSecond = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('second'),
               close: SToken.fromString(';'),
            });
            const declToken = new GeneralEntityDeclarationPToken({
               unassigned: [
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')),
                  {
                     type: 'reference',
                     token: refToSecond,
                  },
               ],
               nextParamName: 'parameter',
            });
            spyOn(entityManager, 'getParameterEntityToken').and.callFake((name: string) => {
               if (name === 'second') {
                  return secondDeclXToken;
               }
            });
            spyOn(declToken, 'assignUnassigned').and.callFake((pToken: GeneralEntityDeclarationPToken) => {
               expect(declToken.unassigned).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')), {
                     type: UnassignedType.ENTITY_START,
                     token: refToSecond,
                  },
                  // the reference is eaten, because it really generates no data.
                  {
                     type: UnassignedType.ENTITY_END,
                     token: refToSecond,
                  },
               ]);
            });

            nodeStream.write(declToken.toXToken());

            gatherResult(nodeStream, done);
         });

         it('expands a series of PERefs that have content', (done) => {
            const refToThird = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('third'),
               close: SToken.fromString(';'),
            });
            const secondDeclPToken = new xToken.ParameterEntityDeclarationPToken({
               name: SToken.fromString('second'),
               value: [
                  xToken.unassigned.wordFromSToken(SToken.fromString('SYSTEM')),
                  // third was expanded ealier in place.
                  new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: refToThird.name! })),
                  new xToken.text.PToken({ text: SToken.fromString('"http://somewhere.com"') }),
                  new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: refToThird.name! })),
               ],
            });
            const secondDeclXToken = secondDeclPToken.toXToken();
            const refToSecond = new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('second'),
               close: SToken.fromString(';'),
            });
            const declToken = new GeneralEntityDeclarationPToken({
               unassigned: [
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')), {
                     type: 'reference',
                     token: refToSecond,
                  },
               ],
               nextParamName: 'parameter',
            });
            spyOn(entityManager, 'getParameterEntityToken').and.callFake((name: string) => {
               if (name === 'second') {
                  return secondDeclXToken;
               } else if (name === 'third') {
                  return;
               }
            });
            spyOn(xToken.unassigned, 'parseAllValues').and.callFake((source: STokenSource, _2: any, callback: (val: any) => void) => {
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
            spyOn(declToken, 'assignUnassigned').and.callFake(() => {
               expect(declToken.unassigned as any).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('baseDecl')), {
                     type: UnassignedType.ENTITY_START,
                     token: refToSecond,
                  }, xToken.unassigned.wordFromSToken(SToken.fromString('SYSTEM')),
                  {
                     type: UnassignedType.LITERAL,
                     token: {
                        openQuote: SToken.fromString('"'),
                        value: [ SToken.fromString('http://somewhere.com') ],
                        closeQuote: SToken.fromString('"'),
                     }
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: refToSecond,
                  }
               ]);
            });

            nodeStream.write(declToken.toXToken());

            gatherResult(nodeStream, done);
         });

         // it('reports a warning if the parameter entity declaration is already defined', (done) => {
         //    const declToken1 = new xToken.ParameterEntityDeclarationXToken('foo', [], undefined, undefined);
         //    const declToken2 = new xToken.ParameterEntityDeclarationXToken('foo', [], undefined, undefined);
         //    spyOn(entityManager, 'getParameterEntityToken').and.callFake((token: any) => {
         //       if (token == declToken1) {
         //          return;
         //       }

         //       return declToken1;
         //    });

         //    nodeStream.write(declToken1);
         //    nodeStream.write(declToken2);
         //    nodeStream.end();

         //    gatherResults(nodeStream, (tokens) => {
         //       expect((tokens[1] as any).id).toEqual(XmlWarning.ID.ENTITYDECL_DUPLICATE);
         //       done();
         //    });
         // });

         // it('reports a warning if the general entity declaration is already defined', (done) => {
         //    const declToken1 = new xToken.GeneralEntityDeclarationXToken('foo', [], undefined, undefined);
         //    const declToken2 = new xToken.GeneralEntityDeclarationXToken('foo', [], undefined, undefined);
         //    spyOn(entityManager, 'getEntityToken').and.callFake((token: any) => {
         //       if (token == declToken1) {
         //          return;
         //       }

         //       return declToken1;
         //    });

         //    nodeStream.write(declToken1);
         //    nodeStream.write(declToken2);
         //    nodeStream.end();

         //    gatherResults(nodeStream, (tokens) => {
         //       expect((tokens[1] as any).id).toEqual(XmlWarning.ID.ENTITYDECL_DUPLICATE);
         //       done();
         //    });
         // });

      });

      describe('notation declaration processing', () => {

         it('processes through the unassigned values', (done) => {
            const unassignedVals = [ xToken.unassigned.wordFromSToken(SToken.fromString('public')) ];
            const pToken = new NotationDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               unassigned: unassignedVals,
               externalId: {
                  nextParamName: 'idType',
                  unassigned: unassignedVals,
               },
            });
            const declToken = pToken.toXToken();
            spyOn(pToken, 'assignUnassigned').and.callFake(() => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('public')),
               ]);
            });

            nodeStream.write(declToken);

            gatherResult(nodeStream, done);
         });

         it('handles the lack of an externalId', (done) => {
            const unassignedVals = [ xToken.unassigned.spaceFromSToken(SToken.fromString('theName')) ];
            const pToken = new NotationDeclarationPToken({
               open: SToken.fromString('<!'),
               unassigned: unassignedVals,
               nextPropName: 'name',
            });
            const declToken = pToken.toXToken();
            spyOn(pToken, 'assignUnassigned').and.callFake(() => {
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
            const pToken = new AttListPToken({
               attDefs: [],
               unassigned: unassignedVals,
            });
            const declToken = xToken.attListDeclaration.pTokenToXToken(pToken);
            spyOn(xToken.attListDeclaration, 'assignUnassigned').and.callFake((pToken: AttListPToken) => {
               expect(pToken.unassigned).toEqual([
                  xToken.unassigned.wordFromSToken(SToken.fromString('elName')),
               ]);
            });

            nodeStream.write(declToken);

            gatherResult(nodeStream, done);
         });

         it('passes a complete ATTLIST token through', () => {
            const pToken = new AttListPToken({
               attDefs: [],
            });
            const declToken = xToken.attListDeclaration.pTokenToXToken(pToken);
            spyOn(nodeStream, 'push');

            nodeStream.write(declToken);

            expect(nodeStream.push).toHaveBeenCalledWith(declToken);
         });

         // Other testing is implicitly covered in entity declaration testing

         it('expands entity references in the attribute definitions default valeus', () => {
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: true,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
               cb([ new xToken.text.PToken() ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               return [ new xToken.text.XToken('one') ];
            });
            const def1: AttDefXToken = {
               name: 'foo',
               type: 'test',
               defaultType: 'test',
               value: [
                  new GeneralEntityReferenceXToken('refName'),
               ],
            };
            const def2: AttDefXToken = {
               name: 'foo',
               type: 'test',
               defaultType: 'test',
               value: [
                  new GeneralEntityStartXToken('refName'),
                  new xToken.text.XToken('one'),
                  new GeneralEntityEndXToken('refName'),
               ],
            };
            const attDecl = new xToken.attListDeclaration.XToken('one', [def1]);
            const expected = new xToken.attListDeclaration.XToken('one', [def2]);
            spyOn(nodeStream, 'push');

            nodeStream.write(attDecl);

            expect(nodeStream.push).toHaveBeenCalledWith(expected);
         });

      //    it('reports an error if there is a < in any entity reference', () => {
      //       spyOn(entityManager, 'getEntityInfo').and.returnValue({
      //          isParameter: false,
      //          isInternal: true,
      //          isParsable: true,
      //          getStream() {}
      //       });
      //       spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
      //          cb([ new xToken.text.PToken() ]);
      //       });
      //       spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
      //          return [ new xToken.text.XToken('o<ne') ];
      //       });
      //       const def: AttDefXToken = {
      //          name: 'elName',
      //          type: 'test',
      //          defaultType: 'test',
      //          value: [
      //             new GeneralEntityReferenceXToken('refName'),
      //          ],
      //       };
      //       const attDecl = new xToken.attListDeclaration.XToken('attlist', [def]);
      //       const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_VALUE,
      //          [ 'elName' ]);
      //       spyOn(nodeStream, 'push');

      //       nodeStream.write(attDecl);

      //       expect(nodeStream.push).toHaveBeenCalledWith(expected);
      //    });
      });

      describe('element processing', () => {

         it('processes an element with no attributes without problems', (done) => {
            const elementStart = new xToken.elementStart.XToken('one', []);
            const expected = new xToken.elementStart.XToken('one', []);

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
            }]);
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [],
            }]);

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         it('passes attributes through that are only text', (done) => {
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [ new xToken.text.XToken('one') ],
            }, {
               name: 'two',
               value: [ new xToken.text.XToken('foo') ],
            }]);
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [ new xToken.text.XToken('one') ],
            }, {
               name: 'two',
               value: [ new xToken.text.XToken('foo') ],
            }]);

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
            spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
               cb([ new xToken.text.PToken() ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               return [ new xToken.text.XToken('one') ];
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new GeneralEntityReferenceXToken('refName'),
               ],
            }]);
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new GeneralEntityStartXToken('refName'),
                  new xToken.text.XToken('one'),
                  new GeneralEntityEndXToken('refName'),
               ],
            }]);

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         it('passes an general entity that can not be parsed through unchanged', (done) => {
            spyOn(entityManager, 'getEntityInfo').and.returnValue(undefined);
            spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
               cb([ new xToken.text.PToken() ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               return [ new xToken.text.XToken('one') ];
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new GeneralEntityReferenceXToken('refName'),
               ],
            }]);

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(elementStart.attributes[0].value[0]).toEqual(new GeneralEntityReferenceXToken('refName'));
               done();
            });
         });

         // it('checks whether the language is well formed', (done) => {
         //    const checkSpy = spyOn(langAttribute, 'checkXmlLangWellFormed');
         //    spyOn(entityManager, 'getEntityInfo').and.returnValue({
         //       isParameter: false,
         //       isInternal: true,
         //       isParsable: true,
         //       getStream() {}
         //    });
         //    spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
         //       cb([ new xToken.text.PToken() ]);
         //    });
         //    spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
         //       return [ new xToken.text.XToken('one', new xToken.text.PToken()) ];
         //    });
         //    const elementStart = new xToken.elementStart.XToken('one', [{
         //       name: 'xml:lang',
         //       value: [
         //          new GeneralEntityReferenceXToken('refName'),
         //       ],
         //    }]);

         //    nodeStream.write(elementStart);

         //    gatherResult(nodeStream, () => {
         //       const args = checkSpy.calls.argsFor(0);
         //       expect(args[0]).toEqual([
         //          new GeneralEntityStartXToken('refName'),
         //          new xToken.text.XToken('one', new xToken.text.PToken()),
         //          new GeneralEntityEndXToken('refName'),
         //       ]);
         //       expect(args[1]).toBeInstanceOf(ErrorCollector);
         //       expect(args[2]).toBeInstanceOf(EntityMetaData);
         //       done();
         //    });
         // });

         // it('does not call checkXmlLangWellFormed if there are no expanded refs', (done) => {
         //    const checkSpy = spyOn(langAttribute, 'checkXmlLangWellFormed');
         //    const elementStart = new xToken.elementStart.XToken('one', [{
         //       name: 'xml:lang',
         //       value: [
         //          new xToken.text.XToken('one'),
         //       ],
         //    }]);

         //    nodeStream.write(elementStart);

         //    gatherResult(nodeStream, () => {
         //       expect(checkSpy).not.toHaveBeenCalled();
         //       done();
         //    });
         // });

         // Our routines are not always async. and the tests here all exercise sync code.
         // This test switches the low level parsing to being async so we can
         // make sure the higher level code still handles this.
         it('replaces a general entity asynchronously', (done) => {
            let asyncCallback: Function = () => {};
            spyOn(entityManager, 'getEntityInfo').and.returnValue({
               isParameter: false,
               isInternal: true,
               isParsable: true,
               getStream() {}
            });
            spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
               asyncCallback = cb;
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible')
               .and.returnValue([ new xToken.text.XToken('one') ]);
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new GeneralEntityReferenceXToken('refName'),
               ],
            }]);
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'foo',
               value: [
                  new GeneralEntityStartXToken('refName'),
                  new xToken.text.XToken('one'),
                  new GeneralEntityEndXToken('refName'),
               ],
            }]);

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
            spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
               cb([ new xToken.text.PToken() ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               return [ new xToken.text.XToken('one') ];
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'firstAttribute',
               value: [
                  new GeneralEntityReferenceXToken('refName'),
               ],
            }, {
               name: 'secondAttribute',
               value: [
                  new GeneralEntityReferenceXToken('refName'),
               ],
            }]);
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'firstAttribute',
               value: [
                  new GeneralEntityStartXToken('refName'),
                  new xToken.text.XToken('one'),
                  new GeneralEntityEndXToken('refName'),
               ],
            }, {
               name: 'secondAttribute',
               value: [
                  new GeneralEntityStartXToken('refName'),
                  new xToken.text.XToken('one'),
                  new GeneralEntityEndXToken('refName'),
               ],
            }]);

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
            spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
               cb([ new xToken.text.PToken() ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               return [ new xToken.text.XToken('one') ];
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'firstAttribute',
               value: [
                  new xToken.text.XToken('some text'),
                  new GeneralEntityReferenceXToken('refName'),
                  new xToken.text.XToken('more text'),
               ],
            }]);
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'firstAttribute',
               value: [
                  new xToken.text.XToken('some text'),
                  new GeneralEntityStartXToken('refName'),
                  new xToken.text.XToken('one'),
                  new GeneralEntityEndXToken('refName'),
                  new xToken.text.XToken('more text'),
               ],
            }]);

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
            spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
               cb([ /* PTokens for text, entity ref and text */ ]);
            });
            spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
               callCount ++;
               if (callCount === 1) {
                  return [
                     new xToken.text.XToken('pre '),
                     new GeneralEntityReferenceXToken('child'),
                     new xToken.text.XToken(' post'),
                  ];
               } else {
                  return [ new xToken.text.XToken('inner') ];
               }
            });
            const elementStart = new xToken.elementStart.XToken('one', [{
               name: 'testAttribute',
               value: [
                  new xToken.text.XToken('some text'),
                  new GeneralEntityReferenceXToken('parent'),
                  new xToken.text.XToken('more text'),
               ],
            }]);
            const expected = new xToken.elementStart.XToken('one', [{
               name: 'testAttribute',
               value: [
                  new xToken.text.XToken('some text'),
                  new GeneralEntityStartXToken('parent'),
                  new xToken.text.XToken('pre '),
                  new GeneralEntityStartXToken('child'),
                  new xToken.text.XToken('inner'),
                  new GeneralEntityEndXToken('child'),
                  new xToken.text.XToken(' post'),
                  new GeneralEntityEndXToken('parent'),
                  new xToken.text.XToken('more text'),
               ],
            }]);

            nodeStream.write(elementStart);

            gatherResult(nodeStream, (results) => {
               expect(results).toEqual(expected);
               done();
            });
         });

         // it('reports an error if there is a "<" in the replacement text of any attribute value', (done) => {
         //    let callCount = 0;
         //    spyOn(entityManager, 'getEntityInfo').and.returnValue({
         //       isParameter: false,
         //       isInternal: true,
         //       isParsable: true,
         //       getStream() {}
         //    });
         //    spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
         //       cb([ /* PTokens for text, entity ref and text */ ]);
         //    });
         //    spyOn(xToken.literalValue, 'makeXTokenCompatible').and.callFake(() => {
         //       callCount ++;
         //       if (callCount === 1) {
         //          return [
         //             new xToken.text.XToken('pre '),
         //             new GeneralEntityReferenceXToken('child'),
         //             new xToken.text.XToken(' post'),
         //          ];
         //       } else {
         //          return [ new xToken.text.XToken('inn<er') ];
         //       }
         //    });
         //    const elementStart = new xToken.elementStart.XToken('one', [{
         //       name: 'testAttribute',
         //       value: [
         //          new xToken.text.XToken('some text'),
         //          new GeneralEntityReferenceXToken('parent'),
         //          new xToken.text.XToken('more text'),
         //       ],
         //    }]);
         //    const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_VALUE,
         //       [ 'testAttribute' ]);

         //    nodeStream.write(elementStart);
         //    nodeStream.end();

         //    gatherResults(nodeStream, (results) => {
         //       expect(results[0]).toEqual(expected);
         //       done();
         //    });
         // });

         // it('reports an error if a referenced entity is an external one', (done) => {
         //    let asyncCallback: Function = () => {};
         //    spyOn(entityManager, 'getEntityInfo').and.returnValue({
         //       isParameter: false,
         //       isInternal: false,
         //       isParsable: true,
         //       getStream() {}
         //    });
         //    spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
         //       asyncCallback = cb;
         //    });
         //    spyOn(xToken.literalValue, 'makeXTokenCompatible')
         //       .and.returnValue([ new xToken.text.XToken('one') ]);
         //    const elementStart = new xToken.elementStart.XToken('one', [{
         //       name: 'foo',
         //       value: [
         //          new GeneralEntityReferenceXToken('refName', new GeneralEntityReferencePToken({ open: SToken.fromString('&') })),
         //       ],
         //    }]);
         //    const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
         //       [ 'refName' ]);

         //    nodeStream.write(elementStart);
         //    nodeStream.end();

         //    asyncCallback([ new xToken.text.PToken() ]);

         //    gatherResults(nodeStream, (results) => {
         //       expect((results[0] as any).message).toEqual(expected.message);
         //       done();
         //    });
         // });

         // it('does not mind if the pToken has been removed by the time it processes', (done) => {
         //    let asyncCallback: Function = () => {};
         //    spyOn(entityManager, 'getEntityInfo').and.returnValue({
         //       isParameter: false,
         //       isInternal: false,
         //       isParsable: true,
         //       getStream() {}
         //    });
         //    spyOn(xToken.literalValue, 'parse').and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
         //       asyncCallback = cb;
         //    });
         //    spyOn(xToken.literalValue, 'makeXTokenCompatible')
         //       .and.returnValue([ new xToken.text.XToken('one') ]);
         //    const elementStart = new xToken.elementStart.XToken('one', [{
         //       name: 'foo',
         //       value: [
         //          new GeneralEntityReferenceXToken('refName'),
         //       ],
         //    }]);
         //    const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
         //       [ 'refName' ]);
         //    delete (elementStart as any).attributes[0].value[0].pToken; // typeHack

         //    nodeStream.write(elementStart);
         //    nodeStream.end();

         //    asyncCallback([ new xToken.text.PToken() ]);

         //    gatherResults(nodeStream, (results) => {
         //       expect(results[0]).toEqual(expected);
         //       done();
         //    });
         // });

      });

      describe('references', () => {

         it('passes an unknown reference through', () => {
            const token = new GeneralEntityReferenceXToken('testReference');

            nodeStream.write(token);
            // nodeStream.read(); // skip the error

            expect(nodeStream.read()).toEqual(token);
         });

         // it('reports an error if an unknown reference is found', () => {
         //    const token = new GeneralEntityReferenceXToken('testReference', new GeneralEntityReferencePToken({ open: SToken.fromString('&') }));

         //    nodeStream.write(token);

         //    expect(nodeStream.read().message).toEqual(new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION,
         //       [ token.name ]).message);
         // });

      });

      describe('non-validating (§2.9, §4.1, §5.0, §5.1, §5.2)', () => {

         it('entity declarations are recognized before a reference to a parameter entity when non-validating', (done) => {
            nodeStream = new NodeStream(entityManager, { validating: false });
            nodeStream.write(new ParameterEntityDeclarationXToken('paramEntity', []));
            nodeStream.write(new GeneralEntityDeclarationXToken('aGeneralEntity', []));
            nodeStream.write(new ParameterEntityReferenceXToken('paramEntity'));

            nodeStream.end();

            gatherResults(nodeStream, () => {
               const result = entityManager.getEntityToken('aGeneralEntity');

               expect(result).not.toBeUndefined();
               done();
            });
         });

         it('entity declarations are not recognized after a reference to a parameter entity when non-validating', (done) => {
            nodeStream = new NodeStream(entityManager, { validating: false });
            nodeStream.write(new ParameterEntityDeclarationXToken('paramEntity', []));
            nodeStream.write(new ParameterEntityReferenceXToken('paramEntity'));

            nodeStream.write(new GeneralEntityDeclarationXToken('aGeneralEntity', []));
            nodeStream.end();

            gatherResults(nodeStream, () => {
               const result = entityManager.getEntityToken('aGeneralEntity');

               expect(result).toBeUndefined();
               done();
            });
         });

         it('does not expand a parameter entity reference non-validating', (done) => {
            const paramReference = new ParameterEntityReferenceXToken('paramEntity');
            nodeStream = new NodeStream(entityManager, { validating: false });
            nodeStream.write(new ParameterEntityDeclarationXToken('paramEntity', []));
            nodeStream.write(paramReference);
            nodeStream.end();

            gatherResults(nodeStream, (results) => {
               expect(results[0]).toEqual(paramReference) // later note: we don't pass the declaration through!???
               done();
            });
         });

      });

      describe('standalone=yes (§2.9, §4.1, §5.0, §5.1, §5.2)', () => {

         it('entity declarations are recognized before a reference to a parameter entity when standalone=yes', (done) => {
            const nodeStream = new NodeStream(entityManager, { validating: false });
            // nodeStream.write(new XmlDeclarationXToken(1.0, 'USASCII', true));
            nodeStream.write(new ParameterEntityDeclarationXToken('paramEntity', []));
            nodeStream.write(new GeneralEntityDeclarationXToken('aGeneralEntity', []));
            nodeStream.write(new ParameterEntityReferenceXToken('paramEntity'));

            nodeStream.end();

            gatherResults(nodeStream, () => {
               const result = entityManager.getEntityToken('aGeneralEntity');

               expect(result).not.toBeUndefined();
               done();
            });
         });

         it('entity declarations are recognized after a reference to a parameter entity when standalone=yes', (done) => {
            const nodeStream = new NodeStream(entityManager, { validating: false });
            nodeStream.write(new XmlDeclarationXToken(1.0, 'USASCII', true));
            nodeStream.write(new ParameterEntityDeclarationXToken('paramEntity', []));
            nodeStream.write(new ParameterEntityReferenceXToken('paramEntity'));

            nodeStream.write(new GeneralEntityDeclarationXToken('aGeneralEntity', []));
            nodeStream.end();

            gatherResults(nodeStream, () => {
               const result = entityManager.getEntityToken('aGeneralEntity');

               expect(result).not.toBeUndefined();
               done();
            });
         });

         it('does not expand a parameter entity reference when standalone=yes', (done) => {
            const parameterRef = new ParameterEntityReferenceXToken('paramEntity');
            const nodeStream = new NodeStream(entityManager, { validating: false });
            nodeStream.write(new XmlDeclarationXToken(1.0, 'USASCII', true));
            nodeStream.write(new ParameterEntityDeclarationXToken('paramEntity', []));
            nodeStream.write(parameterRef);
            nodeStream.end();

            gatherResults(nodeStream, (results) => {
               expect(results[2]).toEqual(parameterRef);
               done();
            });
         });

      });

   });

});

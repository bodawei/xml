// /* Copyright ® 2020 by 柏大衛. All rights reserved. */
// /* eslint-env jasmine */

// import { EntityMetaData } from 'basic';
// import { toSToken, STokenSource } from 'sToken';
// import {
//    ExternalId,

//    CharRefPToken,
//    EntityValuePToken,
//    ParameterEntityDeclarationPToken,
//    ParameterEntityEndPToken,
//    ParameterEntityReferencePToken,
//    ParameterEntityStartPToken,
//    TextPToken,
// } from 'token';

// import { ExpandParams, expandEntityValue } from '../expandEntityValue';

// describe('expandEntityValue() (unit)', () => {
//    let params: ExpandParams;
//    let textPToken: TextPToken;
//    let charRefPToken: CharRefPToken;
//    let peRefPToken: ParameterEntityReferencePToken;
//    let peStartPToken: ParameterEntityStartPToken;
//    let peEndPToken: ParameterEntityEndPToken;

//    beforeEach(() => {
//       textPToken = new TextPToken({ text: toSToken('foo') });
//       charRefPToken = new CharRefPToken({ open: toSToken('&'), digits: toSToken('65'), charCode: 65 });
//       peRefPToken = new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('pe1') });
//       peStartPToken = new ParameterEntityStartPToken(peRefPToken);
//       peEndPToken = new ParameterEntityEndPToken(peRefPToken)

//       params = {
//          entityCache: {
//             pe1: {
//                token: new ParameterEntityDeclarationPToken({ open: toSToken('<!'), }),
//                isInternal: false,
//                name: 'pe1',
//             },
//             pe2: {
//                token: new ParameterEntityDeclarationPToken({ open: toSToken('<!'), }),
//                isInternal: false,
//                name: 'pe2',
//             },
//          },
//          utils: {
//             processBody: () => {},
//             processForEntityValue: (sTokenSource: STokenSource, done: (results: EntityValuePToken) => void) => {},
//             retrieveExternalEntity: (externalId: ExternalId, entityMetaData: EntityMetaData) => {
//                return new STokenSource({}, entityMetaData);
//             },
//          },
//          emd: new EntityMetaData(),
//       };
//    });

//    it('returns an empty EntityValuePToken when passed an empty one', (done) => {
//       expandEntityValue([], params, (result) => {
//          expect(result).toEqual([]);
//          done();
//       });
//    });

//    it('returns an expanded EntityValuePToken when passed one with no external references', (done) => {
//       params.entityCache.pe1 = {
//          token: new ParameterEntityDeclarationPToken({ open: toSToken('<!'), }),
//          isInternal: true,
//          name: 'pe1',
//          valueCache: [ textPToken ],
//       };
//       const value: EntityValuePToken = [ textPToken, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, (result) => {
//          expect(result).toEqual([textPToken, charRefPToken, peStartPToken, textPToken, peEndPToken]);
//          done();
//       });
//    });

//    it('returns an EntityValuePToken with an un-expanded reference when that reference has no declaration', (done) => {
//       delete params.entityCache.pe1;
//       const value: EntityValuePToken = [ textPToken, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, (result) => {
//          expect(result).toEqual([textPToken, charRefPToken, peRefPToken]);
//          done();
//       });
//    });

//    it('returns an expanded EntityValuePToken with no expansion value when valueCache is not defined (this should not be able to happen, but the types potentially allow this)', (done) => {
//       params.entityCache.pe1 = {
//          token: new ParameterEntityDeclarationPToken({ open: toSToken('<!'), }),
//          isInternal: true,
//          name: 'pe1',
//       };
//       const value: EntityValuePToken = [ textPToken, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, (result) => {
//          expect(result).toEqual([textPToken, charRefPToken, peStartPToken, peEndPToken]);
//          done();
//       });
//    });

//    it('returns an EntityValuePToken with no expansion if the peref has no name', (done) => {
//       peRefPToken = new ParameterEntityReferencePToken({ open: toSToken('&') });
//       params.entityCache.pe1 = {
//          token: new ParameterEntityDeclarationPToken({ open: toSToken('<!'), }),
//          isInternal: true,
//          name: 'pe1',
//       };
//       const value: EntityValuePToken = [ textPToken, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, (result) => {
//          expect(result).toEqual([textPToken, charRefPToken, peRefPToken]);
//          done();
//       });
//    });

//    it('returns an EntityValuePToken that references an external entity that needs to be retrieved', (done) => {
//       params.utils.retrieveExternalEntity = (externalId, emd) => new STokenSource({}, emd);
//       params.utils.processForEntityValue = (sTokenStream, done) => {
//          done([ textPToken, textPToken ]);
//       };
//       const value: EntityValuePToken = [ textPToken, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, (result) => {
//          expect(result).toEqual([textPToken, charRefPToken, peStartPToken, textPToken, textPToken, peEndPToken]);
//          done();
//       });
//    });

//    it('returns an EntityValuePToken that references multiple external entity that needs to be retrieved asynchronously', (done) => {
//       const callbacks: Array<Function> = [];
//       const peRefPToken2 = new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('pe2') });
//       const peStartPToken2 = new ParameterEntityStartPToken(peRefPToken2);
//       const peEndPToken2 = new ParameterEntityEndPToken(peRefPToken2)
//       params.utils.retrieveExternalEntity = (externalId, emd) => new STokenSource({}, emd);
//       params.utils.processForEntityValue = (sTokenStream, done) => {
//          callbacks.push(done);
//       }
//       const value: EntityValuePToken = [ textPToken, peRefPToken2, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, (result) => {
//          expect(result).toEqual([textPToken, peStartPToken2, textPToken, textPToken, peEndPToken2,
//             charRefPToken, peStartPToken, textPToken, textPToken, textPToken, peEndPToken]);
//          done();
//       });

//       callbacks[0]([ textPToken, textPToken ]);
//       callbacks[1]([ textPToken, textPToken, textPToken ]);
//    });

//    it('returns an EntityValuePToken that references a pe entity that then references another', (done) => {
//       let call = 0;
//       const peRefPToken2 = new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('pe2') });
//       const peStartPToken2 = new ParameterEntityStartPToken(peRefPToken2);
//       const peEndPToken2 = new ParameterEntityEndPToken(peRefPToken2)
//       params.utils.retrieveExternalEntity = (externalId, emd) => new STokenSource({}, emd);
//       params.utils.processForEntityValue = (sTokenStream, done) => {
//          call ++;

//          if (call === 1) {
//             done([ textPToken, peRefPToken2, textPToken ]);
//          } else {
//             done([ textPToken ]);
//          }
//       }
//       const value: EntityValuePToken = [ textPToken, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, (result) => {
//          expect(result).toEqual([textPToken, charRefPToken, peStartPToken, textPToken,
//             peStartPToken2, textPToken, peEndPToken2, textPToken, peEndPToken]);
//          done();
//       });
//    });

//    it('returns an EntityValuePToken with two references to a single external entity, while only trying to retrieve it one time', (done) => {
//       params.utils.retrieveExternalEntity = (externalId, emd) => new STokenSource({}, emd);
//       params.utils.processForEntityValue = jasmine.createSpy('processForEntityValues').and.callFake((sTokenStream, done) => {
//          done([ textPToken ]);
//       });
//       const value: EntityValuePToken = [ textPToken, peRefPToken, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, (result) => {
//          expect(params.utils.processForEntityValue).toHaveBeenCalledTimes(1);
//          done();
//       });
//    });

//    it('calls retrieveExternalEntity() with appropriate parameters', (done) => {
//       const emd = new EntityMetaData();
//       const externalId: any = { externalId: true };
//       params.entityCache.pe1.token = new ParameterEntityDeclarationPToken({ open: toSToken('<!'), externalId });
//       params.utils.retrieveExternalEntity = jasmine.createSpy('retrieveExternalEntity').and.returnValue(new STokenSource({}, new EntityMetaData()));
//       params.utils.processForEntityValue = jasmine.createSpy('processForEntityValues').and.callFake((sTokenStream, done) => {
//          done([ textPToken ]);
//       });
//       const value: EntityValuePToken = [ textPToken, peRefPToken, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, () => {
//          expect(params.utils.retrieveExternalEntity).toHaveBeenCalledWith(externalId, emd);
//          done();
//       });
//    });

//    it('calls processForEntityValue() withwith the token source from retrieveExternalEntity() and a callback function', (done) => {
//       const sTokenSource = new STokenSource({}, new EntityMetaData());
//       params.utils.retrieveExternalEntity = jasmine.createSpy('retrieveExternalEntity').and.returnValue(sTokenSource);
//       params.utils.processForEntityValue = jasmine.createSpy('processForEntityValues').and.callFake((sTokenStream, done) => {
//          done([]);
//       });
//       const value: EntityValuePToken = [ textPToken, peRefPToken, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, () => {
//          expect((params.utils.processForEntityValue as any).calls.argsFor(0)[0]).toEqual(sTokenSource);
//          done();
//       });
//    });

//    it('inclues any errors encountered when retrieving the external entities', (done) => {
//       let count = 0;
//       const peRefPToken2 = new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('pe2') });
//       params.utils.retrieveExternalEntity = (externalId, emd) => {
//          const source = new STokenSource({}, emd);
//          count ++;
//          source.errors.push(new Error(`Error #${count}`));

//          return source;
//       };
//       params.utils.processForEntityValue = (sTokenStream, done) => {
//          done([]);
//       }
//       const value: EntityValuePToken = [ textPToken, peRefPToken2, charRefPToken, peRefPToken ];

//       expandEntityValue(value, params, (result, errors) => {
//          expect(errors).toEqual([new Error('Error #1'), new Error('Error #2')]);
//          done();
//       });
//    });

//    it('makes only one call back when external entity retrieval is synchronous', () => {
//       const peRefPToken2 = new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('pe2') });
//       params.utils.retrieveExternalEntity = (externalId, emd) => new STokenSource({}, emd);
//       params.utils.processForEntityValue = (sTokenStream, done) => {
//          done([]);
//       }
//       const value: EntityValuePToken = [ textPToken, peRefPToken2, charRefPToken, peRefPToken ];
//       const spy = jasmine.createSpy('expandCallback');

//       expandEntityValue(value, params, spy);

//       expect(spy).toHaveBeenCalledTimes(1);
//    });

// });

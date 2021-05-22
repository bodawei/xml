/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { GeneralEntityDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { makeElementDeclaration } from 'token-test';

import { dtdEndValidate } from '../dtdEndValidate';
import { validityConstraint } from '../../error/validityConstraint';
import { ElDeclType, ValidateState } from '../../validateState';

const VID = validityConstraint.id;

describe('dtdEndValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   describe('No Notation on Empty Element constraint (§3.3.1)', () => {
      it('reports an error when a NOTATION attribute type is on an EMPTY element (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               emptyEl: {
                  notationAttr: {
                     def: {
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            elementDeclarations: {
               emptyEl: {
                  token: makeElementDeclaration('EMPTY'),
                  type: ElDeclType.EMPTY,
               },
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_EMPTY_NOTATION,
            params: ['emptyEl', 'notationAttr'],
            position: toSToken('NOTATION'),
            lastPosition: undefined,
         });
      });

      it('reports no error when a NOTATION attribute type is on an EMPTY element in 1.0/1 (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               emptyEl: {
                  notationAttr: {
                     def: {
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            elementDeclarations: {
               emptyEl: {
                  token: makeElementDeclaration('EMPTY'),
                  type: ElDeclType.EMPTY,
               },
            },
            confVer: new ConformanceVersion(1.0, 1),
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when a CDATA attribute type is on an EMPTY element (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               emptyEl: {
                  notationAttr: {
                     def: {
                        name: toSToken('notationAttr'),
                        type: toSToken('CDATA'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            elementDeclarations: {
               emptyEl: {
                  token: makeElementDeclaration('EMPTY'),
                  type: ElDeclType.EMPTY,
               },
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when a NOTATION attribute type is on an ANY element (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               emptyEl: {
                  notationAttr: {
                     def: {
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            elementDeclarations: {
               emptyEl: {
                  token: makeElementDeclaration(''),
                  type: ElDeclType.EMPTY,
               },
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when the element or attribute details are undefined (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               emptyEl: {
                  notationAttr: undefined,
               },
               other: undefined,
            },
            elementDeclarations: {
               emptyEl: undefined,
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });

   describe('Notation Declared constraint (§4.2.2)', () => {
      it('reports an error when a NDATA name has no corresponding notation declaration (§4.2.2)', () => {
         state = new ValidateState({
            generalEntities: {
               withNData: {
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                     name: toSToken('withNData'),
                     value: [],
                     nDataName: toSToken('someNotation'),
                     close: toSToken('>'),
                  }),
                  isInternal: true,
               },
            },
            notationDeclarations: {},
         });

         dtdEndValidate(state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ENTITYDECL_UNDECLARED_NOTATION,
            params: ['withNData', 'someNotation'],
            position: toSToken('someNotation'),
            lastPosition: undefined,
         });
      });

      it('reports no error when a NDATA name has a corresponding notation declaration (§4.2.2)', () => {
         state = new ValidateState({
            generalEntities: {
               withNData: {
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                     name: toSToken('withNData'),
                     value: [],
                     nDataName: toSToken('notationName'),
                     close: toSToken('>'),
                  }),
                  isInternal: true,
               },
            },
            notationDeclarations: {
               notationName: true,
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when there is no NDATA name  (§4.2.2)', () => {
         state = new ValidateState({
            generalEntities: {
               withNData: {
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                     name: toSToken('withNData'),
                     value: [],
                     close: toSToken('>'),
                  }),
                  isInternal: true,
               },
            },
            notationDeclarations: {
               notationName: true,
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });
});

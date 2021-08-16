/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { GeneralEntityDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { NOTATION_PTOKEN } from 'token';
import { makeElementDeclaration } from 'token-test';

import { dtdEndValidate } from '../dtdEndValidate';
import { validCodes } from '../../error/validCodes';
import { ElDeclType, ValidityState } from '../../common/validityState';

const VID = validCodes.id;

describe('dtdEndValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidityState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   describe('One ID per Element Type constraint (§3.3.1)', () => {
      it('reports an error when a NOTATION attribute type is on an EMPTY element (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               anElement: {
                  id: {
                     def: {
                        name: toSToken('id'),
                        type: toSToken('ID'),
                        value: [],
                     },
                     isExternal: false,
                  },
                  other: {
                     def: {
                        name: toSToken('other'),
                        type: toSToken('ID'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_ATT_XTRA_ID,
            lastPosition: undefined,
            params: ['anElement', 'other', 'id'],
            position: toSToken('ID'),
         });
      });

      it('reports no error when there is only one ID attribute (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               anElement: {
                  id: {
                     def: {
                        name: toSToken('id'),
                        type: toSToken('ID'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });

   describe('No Notation on Empty Element constraint (§3.3.1)', () => {
      it('reports an error when a NOTATION attribute type is on an EMPTY element (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
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
            elements: {
               emptyEl: {
                  token: makeElementDeclaration('EMPTY'),
                  type: ElDeclType.EMPTY,
               },
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_NOTATION_ON_EMPTY,
            lastPosition: undefined,
            params: ['emptyEl', 'notationAttr'],
            position: toSToken('NOTATION'),
         });
      });

      it('reports no error when a NOTATION attribute type is on an EMPTY element in 1.0/1 (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
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
            confVer: new ConformanceVersion(1.0, 1),
            elements: {
               emptyEl: {
                  token: makeElementDeclaration('EMPTY'),
                  type: ElDeclType.EMPTY,
               },
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when a CDATA attribute type is on an EMPTY element (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
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
            elements: {
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
         state = new ValidityState({
            attributes: {
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
            elements: {
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
         state = new ValidityState({
            attributes: {
               emptyEl: {
                  notationAttr: undefined,
               },
               other: undefined,
            },
            elements: {
               emptyEl: undefined,
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });

   describe('Notation Attributes constraint (§3.3.1)', () => {
      it('reports an error when a NOTATION value has not been declared (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  notationAttr: {
                     def: {
                        enumeration: {
                           open: toSToken('('),
                           type: NOTATION_PTOKEN,
                           words: [
                              {
                                 word: toSToken('undeclared'),
                              },
                           ],
                        },
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_ATT_NOTATION_NO_DECLARATION,
            params: ['someElement', 'notationAttr', 'undeclared'],
            position: toSToken('undeclared'),
            lastPosition: undefined,
         });
      });

      it('reports no error when NOTATION value was declared (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  notationAttr: {
                     def: {
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        enumeration: {
                           type: NOTATION_PTOKEN,
                           open: toSToken('('),
                           words: [
                              {
                                 word: toSToken('declared'),
                              },
                           ],
                        },
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            notations: {
               declared: true,
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error for enumeration types (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  enumerationAttr: {
                     def: {
                        name: toSToken('enumerationAttr'),
                        type: toSToken('ENUMERATION'),
                        enumeration: {
                           type: NOTATION_PTOKEN,
                           open: toSToken('('),
                           words: [
                              {
                                 word: toSToken('unceclared'),
                              },
                           ],
                        },
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            notations: {},
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });

   describe('One Notation Per Element Type constraint (§3.3.1)', () => {
      it('reports an error when an element type has multiple notation attributes (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  notationAttr: {
                     def: {
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        enumeration: undefined,
                        value: [],
                     },
                     isExternal: false,
                  },
                  notationAttr2: {
                     def: {
                        name: toSToken('notationAttr2'),
                        type: toSToken('NOTATION'),
                        enumeration: undefined,
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_ATT_XTRA_NOTATION,
            params: ['someElement', 'notationAttr2'],
            position: toSToken('NOTATION'),
            lastPosition: undefined,
         });
      });

      it('reports no error when there is only one NOTATION attribute per element (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  notationAttr: {
                     def: {
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        enumeration: undefined,
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            notations: {
               declared: true,
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when there are multiple NOTATION attribute per element, but the conformance version is 1.0/1 (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  notationAttr: {
                     def: {
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        enumeration: undefined,
                        value: [],
                     },
                     isExternal: false,
                  },
                  notationAttr2: {
                     def: {
                        name: toSToken('notationAttr2'),
                        type: toSToken('NOTATION'),
                        enumeration: undefined,
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            confVer: new ConformanceVersion(1.0, 1),
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });

   describe('Notation Declared constraint (§4.2.2)', () => {
      it('reports an error when a NDATA name has no corresponding notation declaration (§4.2.2)', () => {
         state = new ValidityState({
            generalEntities: {
               withNData: {
                  isInternalValue: true,
                  token: new GeneralEntityDeclarationPToken({
                     close: toSToken('>'),
                     name: toSToken('withNData'),
                     nDataName: toSToken('someNotation'),
                     open: toSToken('<!'),
                     value: [],
                  }),
               },
            },
            notations: {},
         });

         dtdEndValidate(state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ENTITYDECL_NO_NOTATION_DECLARATION,
            params: ['withNData', 'someNotation'],
            position: toSToken('someNotation'),
            lastPosition: undefined,
         });
      });

      it('reports no error when a NDATA name has a corresponding notation declaration (§4.2.2)', () => {
         state = new ValidityState({
            generalEntities: {
               withNData: {
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                     name: toSToken('withNData'),
                     value: [],
                     nDataName: toSToken('notationName'),
                     close: toSToken('>'),
                  }),
                  isInternalValue: true,
               },
            },
            notations: {
               notationName: true,
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when there is no NDATA name  (§4.2.2)', () => {
         state = new ValidityState({
            generalEntities: {
               withNData: {
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                     name: toSToken('withNData'),
                     value: [],
                     close: toSToken('>'),
                  }),
                  isInternalValue: true,
               },
            },
            notations: {
               notationName: true,
            },
         });

         dtdEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });
});

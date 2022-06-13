/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { GeneralEntityDeclarationPToken } from 'pToken';
import { NOTATION_PTOKEN } from 'token';
import { makeElementDeclaration } from 'token-test';

import { ElDeclType, ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { docTypeEndValidate } from '../docTypeEndValidate';

const VID = validityErrorCodes.id;

describe('docTypeEndValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();
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
                     isExternalMarkupDeclaration: false,
                  },
                  other: {
                     def: {
                        name: toSToken('other'),
                        type: toSToken('ID'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
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
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
            elements: {
               emptyEl: {
                  isExternalMarkupDeclaration: false,
                  token: makeElementDeclaration('EMPTY'),
                  type: ElDeclType.EMPTY,
               },
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
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
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
            confVer: new ConformanceVersion(1.0, 1),
            elements: {
               emptyEl: {
                  isExternalMarkupDeclaration: false,
                  token: makeElementDeclaration('EMPTY'),
                  type: ElDeclType.EMPTY,
               },
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
            elements: {
               emptyEl: {
                  isExternalMarkupDeclaration: false,
                  token: makeElementDeclaration('EMPTY'),
                  type: ElDeclType.EMPTY,
               },
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
            elements: {
               emptyEl: {
                  isExternalMarkupDeclaration: false,
                  token: makeElementDeclaration(''),
                  type: ElDeclType.EMPTY,
               },
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_NOTATION_NO_DECLARATION,
            lastPosition: undefined,
            params: ['someElement', 'notationAttr', 'undeclared'],
            position: toSToken('undeclared'),
         });
      });

      it('reports no error when NOTATION value was declared (§3.3.1)', () => {
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
                                 word: toSToken('declared'),
                              },
                           ],
                        },
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
            notations: {
               declared: true,
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error for enumeration types (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  enumerationAttr: {
                     def: {
                        enumeration: {
                           open: toSToken('('),
                           type: NOTATION_PTOKEN,
                           words: [
                              {
                                 word: toSToken('unceclared'),
                              },
                           ],
                        },
                        name: toSToken('enumerationAttr'),
                        type: toSToken('ENUMERATION'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
            notations: {},
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });

   describe('One Notation Per Element Type constraint (§3.3.1)', () => {
      it('reports an error when an element type has multiple notation attributes (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  notationAttr: {
                     def: {
                        enumeration: undefined,
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
                  notationAttr2: {
                     def: {
                        enumeration: undefined,
                        name: toSToken('notationAttr2'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_XTRA_NOTATION,
            lastPosition: undefined,
            params: ['someElement', 'notationAttr2'],
            position: toSToken('NOTATION'),
         });
      });

      it('reports no error when there is only one NOTATION attribute per element (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  notationAttr: {
                     def: {
                        enumeration: undefined,
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
            notations: {
               declared: true,
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when there are multiple NOTATION attribute per element, but the conformance version is 1.0/1 (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               someElement: {
                  notationAttr: {
                     def: {
                        enumeration: undefined,
                        name: toSToken('notationAttr'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
                  notationAttr2: {
                     def: {
                        enumeration: undefined,
                        name: toSToken('notationAttr2'),
                        type: toSToken('NOTATION'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
            confVer: new ConformanceVersion(1.0, 1),
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });

   describe('Notation Declared constraint (§4.2.2)', () => {
      it('reports an error when a NDATA name has no corresponding notation declaration (§4.2.2)', () => {
         state = new ValidityState({
            generalEntities: {
               withNData: {
                  isExternalMarkupDeclaration: false,
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

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ENTITYDECL_NO_NOTATION_DECLARATION,
            lastPosition: undefined,
            params: ['withNData', 'someNotation'],
            position: toSToken('someNotation'),
         });
      });

      it('reports no error when a NDATA name has a corresponding notation declaration (§4.2.2)', () => {
         state = new ValidityState({
            generalEntities: {
               withNData: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  token: new GeneralEntityDeclarationPToken({
                     close: toSToken('>'),
                     name: toSToken('withNData'),
                     nDataName: toSToken('notationName'),
                     open: toSToken('<!'),
                     value: [],
                  }),
               },
            },
            notations: {
               notationName: true,
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when there is no NDATA name  (§4.2.2)', () => {
         state = new ValidityState({
            generalEntities: {
               withNData: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  token: new GeneralEntityDeclarationPToken({
                     close: toSToken('>'),
                     name: toSToken('withNData'),
                     open: toSToken('<!'),
                     value: [],
                  }),
               },
            },
            notations: {
               notationName: true,
            },
         });

         docTypeEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});

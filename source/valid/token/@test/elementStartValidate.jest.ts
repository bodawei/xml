/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'basic-test';
import { ElementDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { elementStartValidate } from '../elementStartValidate';
import { ValidityError } from '../../error/ValidityError';
import { ElDeclType, ElementContext, ValidateState } from '../../validateState';
import { ElementStartPToken } from 'token';
import { CmGraph } from '../../contentModal/cmGraphTypes';

describe('elementStartValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;
   let elementStart: ElementStartPToken;
   let graph: CmGraph;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('elementName'),
      });
      graph = {
         startId: 0,
         endId: 0,
         states: {
            '4': {
               id: 4,
               trans: {
                  one: {
                     ref: '/1/2',
                     stateId: 5,
                  },
                  two: {
                     ref: '/3/4',
                     stateId: 6,
                  },
               },
               done: false,
            },
         },
      };
      const currentContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.CHILDREN,
            graph,
         },
         parentName: 'elementName',
         stateId: 4,
      };
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               type: ElDeclType.CHILDREN,
               token: new ElementDeclarationPToken({
                  open: toSToken('<!'),
                  declType: toSToken('ELEMENT'),
                  name: toSToken('elementName'),
                  close: toSToken('>'),
               }),
               graph,
            },
         },
         elementContext: {
            contextStack: [currentContext],
            activeContext: currentContext,
            pastEnd: false,
         },
      });
   });

   it('reports an error when the context is EMPTY', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.EMPTY,
               },
               parentName: 'parentName',
               stateId: 0,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT,
         params: ['parentName'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports an error when the context is ANY, and the name is not a declared element', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.ANY,
               },
               parentName: 'parentName',
               stateId: 0,
            },
         },
      });
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('other'),
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.UNDECLARED_ELEMENT,
         params: ['other'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports an error when the context is MIXED, and the name is not a known name', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.MIXED,
                  names: ['foo'],
                  duplicateNames: [],
               },
               parentName: 'parentName',
               stateId: 0,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.INVALID_ELEMENT_IN_MIXED,
         params: ['parentName', 'elementName'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports an error when the context is CHILDREN, and there is no transition from this state', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.CHILDREN,
                  graph,
               },
               parentName: 'parentName',
               stateId: 4,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.INVALID_ELEMENT_IN_CONTENT,
         params: ['parentName', 'elementName'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports no error when there is no active context', () => {
      state = {
         ...state,
         elementContext: {
            ...state.elementContext,
            activeContext: undefined,
         },
      };

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when we are past the end of the document', () => {
      state = {
         ...state,
         elementContext: {
            ...state.elementContext,
            pastEnd: true,
         },
      };

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   describe('attributes', () => {
      it('reports an error when a NMTOKEN value is empty (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        type: toSToken('NMTOKEN'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });
         elementStart = new ElementStartPToken({
            open: toSToken('</'),
            name: toSToken('elementName'),
            attributes: [
               {
                  name: toSToken('att1'),
                  openQuote: toSToken('"'),
                  value: [],
                  defaulted: true,
               },
            ],
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: ValidityError.ID.ELEMENTSTART_NMTOKEN_NOT_NMTOKEN,
            params: ['', 'elementName', 'att1'],
            position: toSToken('"'),
            lastPosition: undefined,
         });
      });

      it('reports an error when a NMTOKENS value is empty (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        type: toSToken('NMTOKENS'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });
         elementStart = new ElementStartPToken({
            open: toSToken('</'),
            name: toSToken('elementName'),
            attributes: [
               {
                  name: toSToken('att1'),
                  openQuote: toSToken('"'),
                  value: [],
                  defaulted: true,
               },
            ],
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: ValidityError.ID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN,
            params: ['', 'elementName', 'att1'],
            position: toSToken('"'),
            lastPosition: undefined,
         });
      });

      it('reports an error when an attribute is defaulted from an external ATTLIST declaration, and the document is standalone', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        value: [],
                     },
                     isExternal: true,
                  },
               },
            },
            isStandalone: true,
         });
         elementStart = new ElementStartPToken({
            open: toSToken('</'),
            name: toSToken('elementName'),
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [],
                  defaulted: true,
               },
            ],
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: ValidityError.ID.ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED,
            params: ['elementName', 'att1'],
            position: toSToken('att1'),
            lastPosition: undefined,
         });
      });

      it('reports no error when an attribute is defaulted from an internal ATTLIST declaration, and the document is standalone', () => {
         state = new ValidateState({
            elementDeclarations: state.elementDeclarations,
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            isStandalone: true,
         });
         elementStart = new ElementStartPToken({
            open: toSToken('</'),
            name: toSToken('elementName'),
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [],
                  defaulted: true,
               },
            ],
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when an attribute is defaulted from an external ATTLIST declaration, and the document is not standalone', () => {
         state = new ValidateState({
            elementDeclarations: state.elementDeclarations,
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        value: [],
                     },
                     isExternal: true,
                  },
               },
            },
            isStandalone: false,
         });
         elementStart = new ElementStartPToken({
            open: toSToken('</'),
            name: toSToken('elementName'),
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [],
                  defaulted: true,
               },
            ],
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });

   it('reports no error when an attribute has what is theoretically a validation error but there is no attribute definition', () => {
      state = new ValidateState({
         elementDeclarations: state.elementDeclarations,
         attributeDefs: {},
         isStandalone: true,
      });
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('elementName'),
         attributes: [
            {
               name: toSToken('att1'),
               value: [],
               defaulted: true,
            },
         ],
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if an attribute changed through normalization, but the declaration was external and the document is standalone (§2.9.0)', () => {
      state = new ValidateState({
         elementDeclarations: state.elementDeclarations,
         attributeDefs: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     value: [],
                  },
                  isExternal: true,
               },
            },
         },
         isStandalone: true,
      });
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('elementName'),
         attributes: [
            {
               name: toSToken('att1'),
               value: [],
               normalized: true,
               dtdChangedNormalization: true,
            },
         ],
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ATTLISTDECL_TYPE_EXTERNAL_DECLARED,
         params: ['elementName', 'att1'],
         position: toSToken('att1'),
         lastPosition: undefined,
      });
   });

   it('reports no error if an attribute changed through normalization, but the declaration was not external and the document is standalone (§2.9.0)', () => {
      state = new ValidateState({
         elementDeclarations: state.elementDeclarations,
         attributeDefs: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     value: [],
                  },
                  isExternal: false,
               },
            },
         },
         isStandalone: true,
      });
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('elementName'),
         attributes: [
            {
               name: toSToken('att1'),
               value: [],
               normalized: true,
               dtdChangedNormalization: true,
            },
         ],
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error if an attribute was not changed through normalization, but the declaration was external and the document is standalone (§2.9.0)', () => {
      state = new ValidateState({
         elementDeclarations: state.elementDeclarations,
         attributeDefs: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     value: [],
                  },
                  isExternal: true,
               },
            },
         },
         isStandalone: true,
      });
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('elementName'),
         attributes: [
            {
               name: toSToken('att1'),
               value: [],
            },
         ],
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});

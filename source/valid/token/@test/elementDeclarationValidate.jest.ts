/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { MockErrorCollector } from 'error-test';
import { ElementDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { elementDeclarationValidate } from '../elementDeclarationValidate';
import { ValidityError } from '../../error/ValidityError';
import { ElDeclType, ValidateState } from '../../validateState';

describe('elementDeclarationValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

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
      state = {
         elementDeclarations: {
            elementName: {
               type: ElDeclType.ANY,
               token: elementDeclaration,
            },
         },
      };
   });

   it('reports an error if there is more than one ELEMENT declaration for the same element type', () => {
      state.elementDeclarations.elementName = {
         type: ElDeclType.ANY,
         token: new ElementDeclarationPToken({
            open: toSToken('<!'),
            declType: toSToken('ELEMENT'),
            name: toSToken('elementName'),
            close: toSToken('>'),
         }),
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector);

      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENT_EXTRA_DECLARATION,
         params: ['elementName'],
         position: elementDeclaration.name,
         lastPosition: undefined,
      });
   });

   it('reports no errors if there is no entry in the state', () => {
      delete state.elementDeclarations.elementName;

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an warning if there is a name in the mixed content model that has no declaration', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('elementName'),
                  },
               },
               {
                  particle: {
                     name: toSToken('bogus'),
                  },
               },
            ],
         },
         close: toSToken('>'),
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector);

      expect(mockErrorCollector).toReportWarning({
         id: XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
         params: ['elementName', 'bogus'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('reports an warning if there is a name in the children content model that has no declaration', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('bogus1'),
                  },
               },
               {
                  particle: {
                     name: toSToken('elementName'),
                  },
               },
               {
                  particle: {
                     open: toSToken('('),
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('bogus2'),
                           },
                        },
                     ],
                  },
               },
            ],
         },
         close: toSToken('>'),
      });
      state.elementDeclarations.elementName = {
         type: ElDeclType.CHILDREN,
         graph: { startId: 0, endId: 0, states: {} },
         token: elementDeclaration,
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector);

      expect(mockErrorCollector).toReportWarning({
         id: XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
         params: ['elementName', 'bogus1,bogus2'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('reports no errors if there is a delimited particle without a particle', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [{}],
         },
      });
      state.elementDeclarations.elementName = {
         type: ElDeclType.MIXED,
         names: [],
         duplicateNames: [],
         token: elementDeclaration,
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no errors there is a particle without a name', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [
               {
                  particle: {},
               },
            ],
         },
      });
      state.elementDeclarations.elementName = {
         type: ElDeclType.MIXED,
         names: [],
         duplicateNames: [],
         token: elementDeclaration,
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if this is a mixed declaration and there are duplicate names', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
      });
      state.elementDeclarations.elementName = {
         type: ElDeclType.MIXED,
         token: elementDeclaration,
         names: ['foo', 'bar', 'baz'],
         duplicateNames: ['foo', 'bar'],
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector);

      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENTDECL_MIXED_DUPLICATE_NAME,
         params: ['elementName', 'foo,bar'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('reports a well formed error if the graph is non-deterministic', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         close: toSToken('>'),
      });
      state.elementDeclarations.elementName = {
         type: ElDeclType.CHILDREN,
         graph: {
            startId: 0,
            endId: 1,
            states: {
               0: {
                  id: 0,
                  autoTrans: [],
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 2,
                     },
                  },
               },
               1: {
                  id: 1,
                  autoTrans: [],
                  trans: {},
                  done: true,
               },
               3: {
                  id: 3,
                  autoTrans: [],
                  trans: {
                     last: {
                        ref: '/4,/99',
                        stateId: 1,
                     },
                  },
               },
               4: {
                  id: 4,
                  autoTrans: [],
                  trans: {
                     first: {
                        ref: '/3',
                        stateId: 3,
                     },
                  },
               },
               6: {
                  id: 6,
                  autoTrans: [],
                  trans: {
                     first: {
                        ref: '/2/1,/3',
                        stateId: 6,
                     },
                     last: {
                        ref: '/4',
                        stateId: 1,
                     },
                  },
               },
            },
         },
         token: elementDeclaration,
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC,
         params: ['elementName', 'last (/4,/99),first (/2/1,/3)'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });
});

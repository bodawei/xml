/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import {
   ElementDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { toSToken } from 'sToken';
import { WellFormedError } from 'wellformedness';

import { elementDeclarationValidate } from '../elementDeclarationValidate';
import { ValidityError } from '../../error/ValidityError';
import { DeclarationDetails, ElDeclType, ValidateState } from '../../validateState';
import { CharRefPToken, ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

describe('elementDeclarationValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;
   let version: ConformanceVersion;
   let peDecl: ParameterEntityDeclarationPToken;
   let peRefEmpty: ParameterEntityReferencePToken;
   let peRefX: ParameterEntityReferencePToken;
   let peRefDelimiter: ParameterEntityReferencePToken;
   let textClose: TextPToken;
   let childrenDetails: DeclarationDetails;

   beforeEach(() => {
      peDecl = new ParameterEntityDeclarationPToken({ open: toSToken('<!') });
      peRefEmpty = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('empty'),
      });
      peRefX = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('x'),
      });
      peRefDelimiter = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('delimiter'),
      });
      textClose = new TextPToken({ text: toSToken(')') });
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
      childrenDetails = {
         type: ElDeclType.CHILDREN,
         token: elementDeclaration,
         graph: { startId: 0, endId: 0, states: {} },
      };
      version = new ConformanceVersion();
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               type: ElDeclType.ANY,
               token: elementDeclaration,
            },
         },
         parameterEntities: {
            delimiter: {
               isInternal: true,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('|') })],
            },
            empty: {
               isInternal: true,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('') })],
            },
            close: {
               isInternal: true,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken(')') })],
            },
         },
         elementContext: {
            contextStack: [],
            pastEnd: false,
         },
      });
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

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENT_EXTRA_DECLARATION,
         params: ['elementName'],
         position: elementDeclaration.name,
         lastPosition: undefined,
      });
   });

   it('reports no errors if there is no entry in the state', () => {
      delete state.elementDeclarations.elementName;

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports a warning if there is a name in the mixed content model that has no declaration (§3.2.0)', () => {
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

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
         params: ['elementName', 'bogus'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('does not report #PCDATA as an invalid name (§3.2.0)', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
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

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).not.toReportWarning({
         id: XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
         params: ['elementName', '#PCDATA'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('reports an warning if there is a name in the children content model that has no declaration (§3.2.0)', () => {
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
      state.elementDeclarations.elementName = childrenDetails;

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
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

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

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

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if this is a mixed declaration and there are duplicate names (§3.2.2)', () => {
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

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
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

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC,
         params: ['elementName', 'last (/4,/99),first (/2/1,/3)'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('report an error if in a children, the parentheses in the replacement text of an entity are not balanced (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX],
            propName: 'contentSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: false,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('(') })],
            },
         },
         elementDeclarations: {
            elementName: childrenDetails,
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('report no errors if in a children, the parentheses in the replacement text of an entity are balanced (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX],
            propName: 'contentSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: true,
               token: peDecl,
               replacementText: [
                  new TextPToken({ text: toSToken('( foo | bar | ( baz | ginger))') }),
               ],
            },
         },
      });
      state.elementDeclarations.elementName = {
         type: ElDeclType.CHILDREN,
         token: elementDeclaration,
         graph: { startId: 0, endId: 0, states: {} },
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('report an error if in a mixed, the parentheses in the replacement text of an entity are not balanced (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX],
            propName: 'contentSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: true,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('( foo | ( bar )') })],
            },
         },
      });
      state.elementDeclarations.elementName = {
         type: ElDeclType.MIXED,
         token: elementDeclaration,
         names: [],
         duplicateNames: [],
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('report an error if in a children, the replacement text of a parameter entity ends with a | (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX, textClose],
            propName: 'midSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: true,
               token: peDecl,
               replacementText: [
                  new CharRefPToken({ open: toSToken('&#'), digits: toSToken('65') }),
                  new TextPToken({ text: toSToken('|') }),
               ],
            },
         },
         elementDeclarations: {
            elementName: {
               type: ElDeclType.CHILDREN,
               token: elementDeclaration,
               graph: { startId: 0, endId: 0, states: {} },
            },
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: XmlWarning.ID.ELEMENTDECL_PEREF_TRAILING_CONNECTOR,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('report an error if in a children, the replacement text of a parameter entity is only whitespace (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX, textClose],
            propName: 'midSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: true,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('   ') })],
            },
         },
         elementDeclarations: {
            elementName: childrenDetails,
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('report not an error if in a 1.0/1 document, the replacement text of a PE is whiespace (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX, textClose],
            propName: 'midSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: false,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('   ') })],
            },
         },
         elementDeclarations: {
            elementName: childrenDetails,
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         state,
         mockErrorCollector,
         new ConformanceVersion(1, 1),
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).not.toReportWarning({
         id: XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('report an error if in a 1.0/1 document, the replacement text of a PE has no characters (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefEmpty, textClose],
            propName: 'midSpec',
         },
      });
      state.elementDeclarations.elementName = childrenDetails;

      elementDeclarationValidate(
         elementDeclaration,
         state,
         mockErrorCollector,
         new ConformanceVersion(1, 1),
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
         params: ['elementName', 'empty'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('ignores perefs, as well as pe start and end in the replacement text', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX, textClose],
            propName: 'contentSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: false,
               token: peDecl,
               replacementText: [
                  new ParameterEntityReferencePToken({
                     open: toSToken('&'),
                  }),
                  new ParameterEntityStartPToken(peRefX), // just a dummy peRef to make it happy
                  new TextPToken({ text: toSToken('()') }),
                  new ParameterEntityEndPToken(peRefX), // just a dummy peRef to make it happy
               ],
            },
         },
         elementDeclarations: {
            elementName: {
               type: ElDeclType.CHILDREN,
               token: elementDeclaration,
               graph: { startId: 0, endId: 0, states: {} },
            },
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores non-perefs in the unexpanded value', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [new TextPToken({ text: toSToken('(') }), peRefX],
            propName: 'contentSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: false,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('()') })],
            },
         },
         elementDeclarations: {
            elementName: {
               type: ElDeclType.CHILDREN,
               token: elementDeclaration,
               graph: { startId: 0, endId: 0, states: {} },
            },
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores perefs that have no details', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX, textClose],
            propName: 'contentSpec',
         },
      });
      state.elementDeclarations.elementName = {
         type: ElDeclType.CHILDREN,
         token: elementDeclaration,
         graph: { startId: 0, endId: 0, states: {} },
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores empty entities before the start of the content model', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX, new TextPToken({ text: toSToken('(') }), textClose],
            propName: 'contentSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: false,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('  ') })], // note this would be an error if in the content model
            },
         },
         elementDeclarations: {
            elementName: {
               type: ElDeclType.CHILDREN,
               token: elementDeclaration,
               graph: { startId: 0, endId: 0, states: {} },
            },
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores even closing parenthesis if we have not yet seen an open', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX, new TextPToken({ text: toSToken('(') }), textClose],
            propName: 'contentSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: false,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken(')') })],
            },
         },
         elementDeclarations: {
            elementName: {
               type: ElDeclType.CHILDREN,
               token: elementDeclaration,
               graph: { startId: 0, endId: 0, states: {} },
            },
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores an open paren in the text in the middle of a content model', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [new TextPToken({ text: toSToken('(') }), peRefX, textClose],
            propName: 'midSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: false,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('foo') })],
            },
         },
         elementDeclarations: {
            elementName: {
               type: ElDeclType.CHILDREN,
               token: elementDeclaration,
               graph: { startId: 0, endId: 0, states: {} },
            },
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('considers a parenthesis within the unexpanded text tokens to count as the start of the content model', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [new TextPToken({ text: toSToken('(') }), peRefX, textClose],
            propName: 'contentSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: false,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('  ') })],
            },
         },
         elementDeclarations: {
            elementName: childrenDetails,
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
         lastPosition: undefined,
      });
   });

   it('does not report errors about empty PE or trailing delimiters if they come after the last parenthesis (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefX, peRefDelimiter],
            propName: 'midSpec',
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternal: false,
               token: peDecl,
               replacementText: [new TextPToken({ text: toSToken('  ') })],
            },
         },
         elementDeclarations: {
            elementName: {
               type: ElDeclType.CHILDREN,
               token: elementDeclaration,
               graph: { startId: 0, endId: 0, states: {} },
            },
         },
      });

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('does not report errors about empty PE or trailing delimiters if they come before the content model (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            open: toSToken('('),
            delimitedParticles: [],
         },
         unexpanded: {
            tokens: [peRefEmpty, new TextPToken({ text: toSToken('(x)bar') })],
            propName: 'name',
         },
      });
      state.elementDeclarations.elementName = {
         type: ElDeclType.CHILDREN,
         token: elementDeclaration,
         graph: { startId: 0, endId: 0, states: {} },
      };

      elementDeclarationValidate(elementDeclaration, state, mockErrorCollector, version);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});

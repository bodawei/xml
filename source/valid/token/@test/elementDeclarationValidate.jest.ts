/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, error, warning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import {
   CharRefPToken,
   ElementDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { toSToken } from 'sToken';

import { elementDeclarationValidate } from '../elementDeclarationValidate';
import { ValidityError } from '../../error/ValidityError';
import { DeclarationDetails, ElDeclType, ValidateState } from '../../validateState';
import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

import { validityConstraint } from '../../error/validityConstraint';

const VID = validityConstraint.id;

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
         name: toSToken('empty'),
         open: toSToken('&'),
      });
      peRefX = new ParameterEntityReferencePToken({
         name: toSToken('x'),
         open: toSToken('&'),
      });
      peRefDelimiter = new ParameterEntityReferencePToken({
         name: toSToken('delimiter'),
         open: toSToken('&'),
      });
      textClose = new TextPToken({ text: toSToken(')') });
      mockErrorCollector = new MockErrorCollector();
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openSpace: undefined,
      });
      childrenDetails = {
         graph: { endId: 0, startId: 0, states: {} },
         token: elementDeclaration,
         type: ElDeclType.ELEMENT,
      };
      version = new ConformanceVersion();
      state = new ValidateState({
         elementContext: {
            contextStack: [],
            pastEnd: false,
         },
         parameterEntities: {
            close: {
               isInternalValue: true,
               replacementText: [new TextPToken({ text: toSToken(')') })],
               token: peDecl,
            },
            delimiter: {
               isInternalValue: true,
               replacementText: [new TextPToken({ text: toSToken('|') })],
               token: peDecl,
            },
            empty: {
               isInternalValue: true,
               replacementText: [new TextPToken({ text: toSToken('') })],
               token: peDecl,
            },
         },
      });
   });

   it('reports an error if a markup-internal PERef contains the closing > (§2.8.0)', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         extra: toSToken('blah blah > '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openSpace: undefined,
         unexpanded: {
            propName: 'name',
            tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
         },
      });
      elementDeclarationValidate(
         elementDeclaration,
         {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.PEREF_INVALID_END_NESTING,
         lastPosition: undefined,
         params: ['ELEMENT'],
         position: elementDeclaration.open,
      });
   });

   it('reports no error if a markup-internal PERef has not been expanded (§2.8.0)', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openSpace: undefined,
         unexpanded: {
            propName: 'name',
            tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
         },
      });
      elementDeclarationValidate(
         elementDeclaration,
         {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error if a markup-internal PERef has been expanded and included no extra text (§2.8.0)', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         extra: false,
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openSpace: undefined,
         unexpanded: {
            propName: 'name',
            tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
         },
      });
      elementDeclarationValidate(
         elementDeclaration,
         {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if there is more than one ELEMENT declaration for the same element type', () => {
      state.elementDeclarations.elementName = {
         token: elementDeclaration,
         type: ElDeclType.ANY,
      };
      elementDeclarationValidate(
         elementDeclaration,
         {
            token: new ElementDeclarationPToken({
               close: toSToken('>'),
               declType: toSToken('ELEMENT'),
               name: toSToken('elementName'),
               open: toSToken('<!'),
            }),
            type: ElDeclType.ANY,
         },
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.ELEMENT_EXTRA_DECLARATION,
         lastPosition: undefined,
         params: ['elementName'],
         position: elementDeclaration.name,
      });
   });

   it('reports a warning if there is a name in the mixed content model that has no declaration (§3.2.0)', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
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
            open: toSToken('('),
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: warning.id.ELEMENT_CHILD_UNDECLARED,
         lastPosition: undefined,
         params: ['elementName', 'bogus'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('does not report #PCDATA as an invalid name (§3.2.0)', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
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
            open: toSToken('('),
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            names: [],
            token: elementDeclaration,
            type: ElDeclType.MIXED,
         },
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).not.toReportWarning({
         id: warning.id.ELEMENT_CHILD_UNDECLARED,
         lastPosition: undefined,
         params: ['elementName', '#PCDATA'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('reports an warning if there is a name in the children content model that has no declaration (§3.2.0)', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
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
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('bogus2'),
                           },
                        },
                     ],
                     open: toSToken('('),
                  },
               },
            ],
            open: toSToken('('),
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      elementDeclarationValidate(
         elementDeclaration,
         childrenDetails,
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: warning.id.ELEMENT_CHILD_UNDECLARED,
         lastPosition: undefined,
         params: ['elementName', 'bogus1,bogus2'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('reports no errors if there is a delimited particle without a particle', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [{}],
            open: toSToken('('),
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            names: [],
            token: elementDeclaration,
            type: ElDeclType.MIXED,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no errors there is a particle without a name', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [
               {
                  particle: {},
               },
            ],
            open: toSToken('('),
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            names: [],
            token: elementDeclaration,
            type: ElDeclType.MIXED,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if this is a mixed declaration and there are duplicate names (§3.2.2)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            names: ['foo', 'bar', 'baz', 'foo', 'bar'],
            token: elementDeclaration,
            type: ElDeclType.MIXED,
         },
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.ELEMENTDECL_MIXED_DUPLICATE_NAME,
         lastPosition: undefined,
         params: ['elementName', 'foo,bar'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('reports a well formed error if the graph is non-deterministic', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      const declDetails: DeclarationDetails = {
         graph: {
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 2,
                     },
                  },
               },
               1: {
                  autoTrans: [],
                  done: true,
                  id: 1,
                  trans: {},
               },
               3: {
                  autoTrans: [],
                  id: 3,
                  trans: {
                     last: {
                        ref: '/4,/99',
                        stateId: 1,
                     },
                  },
               },
               4: {
                  autoTrans: [],
                  id: 4,
                  trans: {
                     first: {
                        ref: '/3',
                        stateId: 3,
                     },
                  },
               },
               6: {
                  autoTrans: [],
                  id: 6,
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
         type: ElDeclType.ELEMENT,
      };

      elementDeclarationValidate(
         elementDeclaration,
         declDetails,
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: error.id.ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC,
         lastPosition: undefined,
         params: ['elementName', 'last (/4,/99),first (/2/1,/3)'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('report an error if in a children, the parentheses in the replacement text of an entity are not balanced (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'contentSpec',
            tokens: [peRefX],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: false,
               replacementText: [new TextPToken({ text: toSToken('(') })],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         childrenDetails,
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
         lastPosition: undefined,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('report no errors if in a children, the parentheses in the replacement text of an entity are balanced (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'contentSpec',
            tokens: [peRefX],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: true,
               replacementText: [
                  new TextPToken({ text: toSToken('( foo | bar | ( baz | ginger))') }),
               ],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('report an error if in a mixed, the parentheses in the replacement text of an entity are not balanced (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'contentSpec',
            tokens: [peRefX],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: true,
               replacementText: [new TextPToken({ text: toSToken('( foo | ( bar )') })],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            names: [],
            token: elementDeclaration,
            type: ElDeclType.MIXED,
         },
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
         lastPosition: undefined,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('report an error if in a children, the replacement text of a parameter entity ends with a | (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'midSpec',
            tokens: [peRefX, textClose],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: true,
               replacementText: [
                  new CharRefPToken({ digits: toSToken('65'), open: toSToken('&#') }),
                  new TextPToken({ text: toSToken('|') }),
               ],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: warning.id.ELEMENTDECL_PEREF_TRAILING_CONNECTOR,
         lastPosition: undefined,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('report an error if in a children, the replacement text of a parameter entity is only whitespace (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'midSpec',
            tokens: [peRefX, textClose],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: true,
               replacementText: [new TextPToken({ text: toSToken('   ') })],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         childrenDetails,
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: warning.id.ELEMENTDECL_PEREF_EMPTY,
         lastPosition: undefined,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('report not an error if in a 1.0/1 document, the replacement text of a PE is whiespace (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'midSpec',
            tokens: [peRefX, textClose],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: false,
               replacementText: [new TextPToken({ text: toSToken('   ') })],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         childrenDetails,
         state,
         mockErrorCollector,
         new ConformanceVersion(1, 1),
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).not.toReportWarning({
         id: warning.id.ELEMENTDECL_PEREF_EMPTY,
         lastPosition: undefined,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('report an error if in a 1.0/1 document, the replacement text of a PE has no characters (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'midSpec',
            tokens: [peRefEmpty, textClose],
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         childrenDetails,
         state,
         mockErrorCollector,
         new ConformanceVersion(1, 1),
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: warning.id.ELEMENTDECL_PEREF_EMPTY,
         lastPosition: undefined,
         params: ['elementName', 'empty'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('ignores perefs, as well as pe start and end in the replacement text', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'contentSpec',
            tokens: [peRefX, textClose],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: false,
               replacementText: [
                  new ParameterEntityReferencePToken({
                     open: toSToken('&'),
                  }),
                  new ParameterEntityStartPToken(peRefX), // just a dummy peRef to make it happy
                  new TextPToken({ text: toSToken('()') }),
                  new ParameterEntityEndPToken(peRefX), // just a dummy peRef to make it happy
               ],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores non-perefs in the unexpanded value', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'contentSpec',
            tokens: [new TextPToken({ text: toSToken('(') }), peRefX],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: false,
               replacementText: [new TextPToken({ text: toSToken('()') })],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores perefs that have no details', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'contentSpec',
            tokens: [peRefX, textClose],
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores empty entities before the start of the content model', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'contentSpec',
            tokens: [peRefX, new TextPToken({ text: toSToken('(') }), textClose],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: false,
               replacementText: [new TextPToken({ text: toSToken('  ') })], // note this would be an error if in the content model
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores even closing parenthesis if we have not yet seen an open', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'contentSpec',
            tokens: [peRefX, new TextPToken({ text: toSToken('(') }), textClose],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: false,
               replacementText: [new TextPToken({ text: toSToken(')') })],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('ignores an open paren in the text in the middle of a content model', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'midSpec',
            tokens: [new TextPToken({ text: toSToken('(') }), peRefX, textClose],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: false,
               replacementText: [new TextPToken({ text: toSToken('foo') })],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('considers a parenthesis within the unexpanded text tokens to count as the start of the content model', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'contentSpec',
            tokens: [new TextPToken({ text: toSToken('(') }), peRefX, textClose],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: false,
               replacementText: [new TextPToken({ text: toSToken('  ') })],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         childrenDetails,
         state,
         mockErrorCollector,
         version,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: warning.id.ELEMENTDECL_PEREF_EMPTY,
         lastPosition: undefined,
         params: ['elementName', 'x'],
         position: elementDeclaration.contentModel?.open,
      });
   });

   it('does not report errors about empty PE or trailing delimiters if they come after the last parenthesis (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'midSpec',
            tokens: [peRefX, peRefDelimiter],
         },
      });
      state = new ValidateState({
         parameterEntities: {
            x: {
               isInternalValue: false,
               replacementText: [new TextPToken({ text: toSToken('  ') })],
               token: peDecl,
            },
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('does not report errors about empty PE or trailing delimiters if they come before the content model (§3.2.1)', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: {
            delimitedParticles: [],
            open: toSToken('('),
         },
         unexpanded: {
            propName: 'name',
            tokens: [peRefEmpty, new TextPToken({ text: toSToken('(x)bar') })],
         },
      });

      elementDeclarationValidate(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
         mockErrorCollector,
         version,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });
});

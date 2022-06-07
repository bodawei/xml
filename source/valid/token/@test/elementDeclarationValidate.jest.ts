/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import {
   CharRefPToken,
   ElementDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { toSToken } from 'sToken';
import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

import { ContentDetails, ElDeclType, ValidityState } from '../../common/validityState';
import { errorCodes } from '../../error/errorCodes';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { warningCodes } from '../../error/warningCodes';
import { elementDeclarationValidate } from '../elementDeclarationValidate';

const EID = errorCodes.id;
const VID = validityErrorCodes.id;

describe('elementDeclarationValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let collector: ParamCollector;
   let state: ValidityState;
   let peDecl: ParameterEntityDeclarationPToken;
   let peRefEmpty: ParameterEntityReferencePToken;
   let peRefX: ParameterEntityReferencePToken;
   let peRefDelimiter: ParameterEntityReferencePToken;
   let textClose: TextPToken;
   let childrenDetails: ContentDetails;

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
      collector = new ParamCollector();
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
         isExternalMarkupDeclaration: false,
         token: elementDeclaration,
         type: ElDeclType.ELEMENT,
      };
      state = new ValidityState({
         elementContext: {
            contextStack: [],
            pastEnd: false,
         },
         parameterEntities: {
            close: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               replacementText: [new TextPToken({ text: toSToken(')') })],
               token: peDecl,
            },
            delimiter: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               replacementText: [new TextPToken({ text: toSToken('|') })],
               token: peDecl,
            },
            empty: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               replacementText: [new TextPToken({ text: toSToken('') })],
               token: peDecl,
            },
         },
      });
   });

   describe('Validity Constraint: Proper Declaration/PE Nesting (§2.8.0)', () => {
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });

   describe('Validity constraint: Unique Element Type Declaration (§3.2.0)', () => {
      it('reports an error if there is more than one ELEMENT declaration for the same element type (§3.2.0)', () => {
         state = new ValidityState(state, {
            elements: {
               elementName: {
                  isExternalMarkupDeclaration: false,
                  token: elementDeclaration,
                  type: ElDeclType.ANY,
               },
            },
         });
         elementDeclarationValidate(
            elementDeclaration,
            {
               isExternalMarkupDeclaration: false,
               token: new ElementDeclarationPToken({
                  close: toSToken('>'),
                  declType: toSToken('ELEMENT'),
                  name: toSToken('elementName'),
                  open: toSToken('<!'),
               }),
               type: ElDeclType.ANY,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ELEMENT_XTRA_DECLARATION,
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidWarning({
            id: warningCodes.id.ELEMENT_CHILD_UNDECLARED,
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
               isExternalMarkupDeclaration: false,
               names: [],
               token: elementDeclaration,
               type: ElDeclType.MIXED,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveValidWarning({
            id: warningCodes.id.ELEMENT_CHILD_UNDECLARED,
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

         elementDeclarationValidate(elementDeclaration, childrenDetails, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidWarning({
            id: warningCodes.id.ELEMENT_CHILD_UNDECLARED,
            lastPosition: undefined,
            params: ['elementName', 'bogus1,bogus2'],
            position: elementDeclaration.contentModel?.open,
         });
      });
   });

   describe('Validity constraint: No Duplicate Types (§3.2.2)', () => {
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
               isExternalMarkupDeclaration: false,
               names: [],
               token: elementDeclaration,
               type: ElDeclType.MIXED,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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
               isExternalMarkupDeclaration: false,
               names: [],
               token: elementDeclaration,
               type: ElDeclType.MIXED,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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
               isExternalMarkupDeclaration: false,
               names: ['foo', 'bar', 'baz', 'foo', 'bar'],
               token: elementDeclaration,
               type: ElDeclType.MIXED,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ELEMENTDECL_XTRA_MIXED_NAME,
            lastPosition: undefined,
            params: ['elementName', 'foo,bar'],
            position: elementDeclaration.contentModel?.open,
         });
      });
   });

   describe('Compatibility check (§3.2.1)', () => {
      it('reports an error if the graph is non-deterministic (§3.2.1)', () => {
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
         const details: ContentDetails = {
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
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         };

         elementDeclarationValidate(elementDeclaration, details, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidError({
            id: EID.ELEMENTDECL_CONTENTMODEL_NONDETERMINISTC,
            lastPosition: undefined,
            params: ['elementName', 'last (/4,/99),first (/2/1,/3)'],
            position: elementDeclaration.contentModel?.open,
         });
      });
   });

   describe('Validity Constraint: Proper Group/PE Nesting (§3.2.1)', () => {
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: false,
                  replacementText: [new TextPToken({ text: toSToken('(') })],
                  token: peDecl,
               },
            },
         });

         elementDeclarationValidate(elementDeclaration, childrenDetails, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.PEREF_PARENS_UNBALANCED,
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  replacementText: [new TextPToken({ text: toSToken('( foo | ( bar )') })],
                  token: peDecl,
               },
            },
         });

         elementDeclarationValidate(
            elementDeclaration,
            {
               isExternalMarkupDeclaration: false,
               names: [],
               token: elementDeclaration,
               type: ElDeclType.MIXED,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.PEREF_PARENS_UNBALANCED,
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidWarning({
            id: warningCodes.id.PEREF_NO_TRAILING_CONNECTOR,
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  replacementText: [new TextPToken({ text: toSToken('   ') })],
                  token: peDecl,
               },
            },
         });

         elementDeclarationValidate(elementDeclaration, childrenDetails, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidWarning({
            id: warningCodes.id.PEREF_NO_EMPTY_IN_MODEL,
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
         state = new ValidityState({
            confVer: new ConformanceVersion(1, 1),
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: false,
                  replacementText: [new TextPToken({ text: toSToken('   ') })],
                  token: peDecl,
               },
            },
         });

         elementDeclarationValidate(elementDeclaration, childrenDetails, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveValidWarning({
            id: warningCodes.id.PEREF_NO_EMPTY_IN_MODEL,
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
            {
               ...state,
               confVer: new ConformanceVersion(1, 1),
            },
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidWarning({
            id: warningCodes.id.PEREF_NO_EMPTY_IN_MODEL,
            lastPosition: undefined,
            params: ['elementName', 'empty'],
            position: elementDeclaration.contentModel?.open,
         });
      });

      it('ignores perefs, as well as pe start and end in the replacement text (§3.2.1)', () => {
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('ignores non-perefs in the unexpanded value (§3.2.1)', () => {
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('ignores perefs that have no details (§3.2.1)', () => {
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('ignores empty entities before the start of the content model (§3.2.1)', () => {
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('ignores even closing parenthesis if we have not yet seen an open (§3.2.1)', () => {
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('ignores an open paren in the text in the middle of a content model (§3.2.1)', () => {
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('considers a parenthesis within the unexpanded text tokens to count as the start of the content model (§3.2.1)', () => {
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: false,
                  replacementText: [new TextPToken({ text: toSToken('  ') })],
                  token: peDecl,
               },
            },
         });

         elementDeclarationValidate(elementDeclaration, childrenDetails, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidWarning({
            id: warningCodes.id.PEREF_NO_EMPTY_IN_MODEL,
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
         state = new ValidityState({
            parameterEntities: {
               x: {
                  isExternalMarkupDeclaration: false,
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});

/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import {
   AttListDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { toSToken } from 'sToken';
import {
   NOTATION_PTOKEN,
   ENUMERATION_PTOKEN,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
} from 'token';
import {
   makeGeneralEntityDeclaration,
   makeGeneralEntityEnd,
   makeGeneralEntityStart,
} from 'token-test';

import { ancestorPERefsValidate } from '../../common/ancestorPERefsValidate';
import { attributeValueValidate } from '../../common/attributeValueValidate';
import { ValidityState } from '../../common/validityState';
import { xmlSpaceValidate } from '../../common/xmlSpaceValidate';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { attListDeclarationValidate } from '../attListDeclarationValidate';

const VID = validityErrorCodes.id;

jest.mock('../../common/attributeValueValidate');
jest.mock('../../common/ancestorPERefsValidate');
jest.mock('../../common/xmlSpaceValidate');

describe('attListDeclarationValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();
      state = new ValidityState({});
   });

   describe('Proper Declaration/PE Nesting (§2.8.0)', () => {
      it('reports an error if a markup-internal PERef has been expanded and included the trailing > (§2.8.0)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            extra: toSToken('>'),
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
            },
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.PEREF_INVALID_END_NESTING,
            lastPosition: undefined,
            params: ['ATTLIST'],
            position: attListDecl.open,
         });
      });

      it('reports no error if a markup-internal PERef has been expanded and included no extra text (§2.8.0)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('CDATA'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            extra: false,
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
            },
         });

         attListDeclarationValidate(attListDecl, state, collector);
         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });

   describe('Standalone Document Declaration (§2.9.0)', () => {
      [
         {
            end: makeGeneralEntityEnd(),
            isExternalMarkupDeclaration: true,
            isPredefined: false,
            isStandalone: true,
            pass: false,
            start: makeGeneralEntityStart(),
         },
         {
            end: new GeneralEntityEndPToken(
               new GeneralEntityReferencePToken({
                  name: toSToken('lt'),
                  open: toSToken('&'),
               }),
            ),
            isExternalMarkupDeclaration: true,
            isPredefined: true,
            isStandalone: true,
            pass: true,
            start: new GeneralEntityStartPToken(
               new GeneralEntityReferencePToken({
                  name: toSToken('lt'),
                  open: toSToken('&'),
               }),
            ),
         },
         {
            end: makeGeneralEntityEnd(),
            isExternalMarkupDeclaration: false,
            isPredefined: false,
            isStandalone: true,
            pass: true,
            start: makeGeneralEntityStart(),
         },
         {
            end: makeGeneralEntityEnd(),
            isExternalMarkupDeclaration: true,
            isPredefined: false,
            isStandalone: false,
            pass: true,
            start: makeGeneralEntityStart(),
         },
         {
            end: makeGeneralEntityEnd(),
            isExternalMarkupDeclaration: false,
            isPredefined: false,
            isStandalone: false,
            pass: true,
            start: makeGeneralEntityStart(),
         },
      ].forEach((params) => {
         const { isExternalMarkupDeclaration, isPredefined, isStandalone, pass, start, end } =
            params;

         it(`reports an error if a general entity reference is found in the default value, and the entity was${
            isExternalMarkupDeclaration ? '' : ' not'
         } externally declared, the document was${
            isStandalone ? '' : ' not'
         } standalone and the entity is${
            isPredefined ? '' : ' not'
         } a predefined entity (§2.9.0)`, () => {
            const geDecl = makeGeneralEntityDeclaration();
            state = new ValidityState({
               generalEntities: {
                  lt: {
                     isExternalMarkupDeclaration,
                     isInternalValue: true,
                     token: geDecl,
                  },
                  testRef: {
                     isExternalMarkupDeclaration,
                     isInternalValue: true,
                     token: geDecl,
                  },
               },
               isStandalone,
            });
            const attListDecl = new AttListDeclarationPToken({
               attDefs: [
                  {
                     name: toSToken('att1'),
                     type: toSToken('CDATA'),
                     value: [start, end],
                  },
               ],
               elementName: toSToken('elName'),
               extra: toSToken('>'),
               open: toSToken('<!'),
            });

            attListDeclarationValidate(attListDecl, state, collector);

            if (pass) {
               // @ts-expect-error 2329/matchers
               expect(collector).not.toHaveAnyProblems();
            } else {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveValidityError({
                  id: VID.ENTITYREF_EXTERNAL,
                  lastPosition: undefined,
                  params: [start.referencePToken.name?.str],
                  position: makeGeneralEntityStart().referencePToken.open,
               });
            }
         });
      });

      it('calls ancestorPERefsValidate() to validate ancestors for each geref found (§2.9.0)', () => {
         const geDecl = makeGeneralEntityDeclaration();
         const end = makeGeneralEntityEnd();
         const start = makeGeneralEntityStart();
         state = new ValidityState({
            generalEntities: {
               testRef: {
                  isExternalMarkupDeclaration: true,
                  isInternalValue: true,
                  token: geDecl,
               },
            },
            isStandalone: true,
         });
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('CDATA'),
                  value: [start, end],
               },
            ],
            elementName: toSToken('elName'),
            extra: toSToken('>'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         expect(ancestorPERefsValidate).toHaveBeenCalledWith(start, state, collector);
      });
   });

   it('calls attributeValueValidate() to validate entity references (§4.1.0)', () => {
      const end = makeGeneralEntityEnd();
      const start = makeGeneralEntityStart();
      state = new ValidityState({});
      const attListDecl = new AttListDeclarationPToken({
         attDefs: [
            {
               name: toSToken('att1'),
               type: toSToken('CDATA'),
               value: [start, end],
            },
         ],
         elementName: toSToken('elName'),
         extra: toSToken('>'),
         open: toSToken('<!'),
      });
      // jest.spyOn(validator, 'attributeValueValidate');

      attListDeclarationValidate(attListDecl, state, collector);

      expect(attributeValueValidate).toHaveBeenCalledWith(
         attListDecl.attDefs[0].value,
         state,
         collector,
      );
   });

   describe('ID Attribute Default (§3.3.1)', () => {
      it('reports an error when there is no default for an ID attribute (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_ID_DEFAULT,
            lastPosition: toSToken('ID'),
            params: ['elName', 'att1', ''],
            position: undefined,
         });
      });

      it('reports an error when the default for an ID attribute is #FIXED (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  defaultType: toSToken('#FIXED'),
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_ID_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', '#FIXED'],
            position: toSToken('#FIXED'),
         });
      });

      it('reports no error when the default for an ID attribute is #REQUIRED (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  defaultType: toSToken('#REQUIRED'),
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when the default for an ID attribute is #IMPLIED (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  defaultType: toSToken('#IMPLIED'),
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });

   describe('No Duplicate Tokens (§3.3.1)', () => {
      it('reports an error when a value is repeated in a NOTATION attribute declaration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: NOTATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('one'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_XTRA_NOTATION_VALUE,
            lastPosition: undefined,
            params: ['elName', 'att1', 'one'],
            position: toSToken('one'),
         });
      });

      it('reports an error when a value is repeated in an ENUMERATION attribute declaration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: NOTATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('one'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_XTRA_ENUMERATION_VALUE,
            lastPosition: undefined,
            params: ['elName', 'att1', 'one'],
            position: toSToken('one'),
         });
      });

      it('reports no errors when a value is repeated in a NOTATION attribute declaration, but this is 1.0/2 (§3.3.1)', () => {
         state = new ValidityState({
            confVer: new ConformanceVersion(1.0, 2),
         });
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: NOTATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('one'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when no values are repeated in a NOTATION attribute declaration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: NOTATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('two'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when there is no enumeration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: undefined,
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });

   describe('Attribute Default Value Syntactically Correct (§3.3.2)', () => {
      it('reports no error when a CDATA declaration has a default value that does not match either Name or NmToken (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('CDATA'),
                  value: [new TextPToken(toSToken('$bad'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when an ID declaration has a default value that does not match either Name or NmToken (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  defaultType: toSToken('#REQUIRED'),
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [new TextPToken(toSToken('$bad'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error when an IDREF declaration has a syntactically invalid default value (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('IDREF'),
                  value: [new TextPToken(toSToken('$bad'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_IDREF_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', '$bad'],
            position: toSToken('$bad'),
         });
      });

      it('reports an error when an IDREFS declaration has a syntactically invalid default value (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('IDREFS'),
                  value: [new TextPToken(toSToken('boo ba $bad bing'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_IDREFS_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', '$bad'],
            position: toSToken('boo ba $bad bing'),
         });
      });

      it('reports an error when an ENTITY declaration has a syntactically invalid default value (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('ENTITY'),
                  value: [new TextPToken(toSToken('$bad'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_ENTITY_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', '$bad'],
            position: toSToken('$bad'),
         });
      });

      it('reports an error when an ENTITIES declaration has a syntactically invalid default value (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('ENTITIES'),
                  value: [new TextPToken(toSToken('boo ba $bad bing'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_ENTITIES_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', '$bad'],
            position: toSToken('boo ba $bad bing'),
         });
      });

      it('reports an error when an NMTOKEN declaration has a syntactically invalid default value (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('NMTOKEN'),
                  value: [new TextPToken(toSToken('$bad'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_NMTOKEN_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', '$bad'],
            position: toSToken('$bad'),
         });
      });

      it('reports an error when an NMTOKENS declaration has a syntactically invalid default value (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('NMTOKENS'),
                  value: [new TextPToken(toSToken('boo ba $bad bing'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_NMTOKENS_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', '$bad'],
            position: toSToken('boo ba $bad bing'),
         });
      });

      it('reports an error when an NOTATION declaration has a default value that is not in the enumerated list (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: NOTATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('two'),
                        },
                        {
                           word: toSToken('three'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  value: [new TextPToken(toSToken('foo'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_NOTATION_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', 'one,two,three', 'foo'],
            position: toSToken('foo'),
         });
      });

      it('reports an error when an ENUMERATION declaration has a default value that is not in the enumerated list (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: ENUMERATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('two'),
                        },
                        {
                           word: toSToken('three'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  value: [new TextPToken(toSToken('foo'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_ENUMERATION_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', 'one,two,three', 'foo'],
            position: toSToken('foo'),
         });
      });

      it('ignores empty words (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: ENUMERATION_PTOKEN,
                     words: [
                        {
                           word: toSToken(''),
                        },
                        {
                           word: toSToken('two'),
                        },
                        {
                           word: toSToken('three'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  value: [new TextPToken(toSToken('foo'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_ENUMERATION_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', 'two,three', 'foo'],
            position: toSToken('foo'),
         });
      });

      it('reports an error when there is no enumeration at all (§3.3.2)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  value: [new TextPToken(toSToken('foo'))],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.ATTLISTDECL_ATT_INVALID_ENUMERATION_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', '', 'foo'],
            position: toSToken('foo'),
         });
      });
   });

   it('calls xmlSpaceValidate() for each attr (§2.10.0)', () => {
      state = new ValidityState();
      const attListDecl = new AttListDeclarationPToken({
         attDefs: [
            {
               name: toSToken('xml:space'),
               type: toSToken('CDATA'),
               value: [],
            },
         ],
         elementName: toSToken('elName'),
         extra: toSToken('>'),
         open: toSToken('<!'),
      });

      attListDeclarationValidate(attListDecl, state, collector);

      expect(xmlSpaceValidate).toHaveBeenCalledWith(
         attListDecl.attDefs[0],
         'elName',
         'xml:space',
         state,
         collector,
      );
   });
});

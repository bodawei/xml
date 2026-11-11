/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken, SToken } from 'basic';
import {
   AttListDeclarationPToken,
   CharRefPToken,
   ExternalIdP,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TextPToken,
} from 'pToken';
// ick
import { ElementStartPToken, GeneralEntityStartPToken, GeneralEntityEndPToken } from 'token';
import {
   makeAttListDeclaration,
   makeElementStart,
   makeElementStartWithAttrValue,
   makeElementStartWithAttrValueFromString,
   makeElementEmptyWithAttrValueFromString,
   makeTextPToken,
   makeXmlDecl,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeGeneralEntityDeclaration,
} from 'token-test';

import { AttributePToken, AttrValue } from '../../token/common/attribute';
import { isAugmentedAttribute, AttFixer, AugmentedAttributePToken } from '../attFixer';

describe('AttFixer', () => {
   let fixAttributes: AttFixer;
   let entityD: AttrValue;
   let entityA: AttrValue;
   let entityDA: AttrValue;
   let entityDSpace: AttrValue;
   let entityDEmpty: AttrValue;
   let entityAEmpty: AttrValue;
   let entityASpace: AttrValue;
   let entityDAEmpty: AttrValue;
   let entityDASpace: AttrValue;
   let charRefA: CharRefPToken;
   let charRefD: CharRefPToken;
   let charA: TextPToken;
   let charD: TextPToken;
   let charDA: TextPToken;

   beforeEach(() => {
      const dReference = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('d'),
      });
      const aReference = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('a'),
      });
      const daReference = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('da'),
      });
      charRefA = new CharRefPToken({
         open: toSToken('&#'),
         hexMarker: toSToken('x'),
         digits: toSToken('A'),
      });
      charRefD = new CharRefPToken({
         open: toSToken('&#'),
         hexMarker: toSToken('x'),
         digits: toSToken('D'),
      });
      charD = makeTextPToken('\u000d');
      charA = makeTextPToken('\u000a');
      charDA = makeTextPToken('\u000d\u000a');

      entityD = [
         new GeneralEntityStartPToken(dReference),
         charD,
         new GeneralEntityEndPToken(dReference),
      ];
      entityA = [
         new GeneralEntityStartPToken(aReference),
         charA,
         new GeneralEntityEndPToken(aReference),
      ];
      entityDA = [
         new GeneralEntityStartPToken(daReference),
         charDA,
         new GeneralEntityEndPToken(daReference),
      ];
      entityDSpace = [
         new GeneralEntityStartPToken(dReference),
         makeTextPToken(' ', '\u000d'),
         new GeneralEntityEndPToken(dReference),
      ];
      entityDEmpty = [
         new GeneralEntityStartPToken(dReference),
         makeTextPToken('', '\u000d'),
         new GeneralEntityEndPToken(dReference),
      ];
      entityASpace = [
         new GeneralEntityStartPToken(aReference),
         makeTextPToken(' ', '\u000a'),
         new GeneralEntityEndPToken(aReference),
      ];
      entityAEmpty = [
         new GeneralEntityStartPToken(aReference),
         makeTextPToken('', '\u000a'),
         new GeneralEntityEndPToken(aReference),
      ];
      entityDASpace = [
         new GeneralEntityStartPToken(daReference),
         makeTextPToken('  ', '\u000d\u000a'),
         new GeneralEntityEndPToken(daReference),
      ];
      entityDAEmpty = [
         new GeneralEntityStartPToken(daReference),
         makeTextPToken('', '\u000d\u000a'),
         new GeneralEntityEndPToken(daReference),
      ];

      fixAttributes = new AttFixer();
   });

   describe('isAugmentedAttribute', () => {
      it('returns true if given an augmented attribute definition', () => {
         const augmented: AugmentedAttributePToken = {
            name: toSToken('foo'),
            value: [],
            defaulted: true,
         };

         expect(isAugmentedAttribute(augmented)).toEqual(true);
      });

      it('returns true if given an augmented attribute definition, even when defaulted is faulse', () => {
         const augmented: AugmentedAttributePToken = {
            name: toSToken('foo'),
            value: [],
            defaulted: false,
         };

         expect(isAugmentedAttribute(augmented)).toEqual(true);
      });

      it('returns false if given an ordinary attribute definition', () => {
         const plain: AttributePToken = {
            name: toSToken('foo'),
            value: [],
         };

         expect(isAugmentedAttribute(plain)).toEqual(false);
      });
   });

   it('returns an ATTLIST unchanged when passed one', () => {
      const attList = makeAttListDeclaration('CDATA');

      const result = fixAttributes.processPToken(attList);

      expect(result).toEqual(attList);
   });

   it('returns other tokens unchanged', () => {
      const xmlDecl = makeXmlDecl();

      const result = fixAttributes.processPToken(xmlDecl);

      expect(result).toBe(xmlDecl);
   });

   describe('attribute normalization', () => {
      it('modifies a CDATA attribute to replace newlines with spaces', () => {
         const attList = makeAttListDeclaration('CDATA');
         const elementStart = makeElementStartWithAttrValueFromString('\n\nxyz');
         fixAttributes.processPToken(attList);
         const expected: ElementStartPToken = new ElementStartPToken({
            ...elementStart,
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [new TextPToken({ text: new SToken('  xyz', '\n\nxyz', []) })],
                  normalized: true,
               },
            ],
         });

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(expected);
      });

      it('does only default normalization of attributes when there is no ATTLIST declaration for it', () => {
         const elementStart = makeElementStartWithAttrValueFromString('\n\nxyz');

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValueFromString('xyz', '\n\nxyz', {
               normalized: true,
               dtdChangedNormalization: true,
            }),
         );
      });

      it('modifies a CDATA attribute to replace newlines with spaces in an empty element', () => {
         const attList = makeAttListDeclaration('CDATA');
         const elementStart = makeElementEmptyWithAttrValueFromString('\n\nxyz');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementEmptyWithAttrValueFromString('  xyz', '\n\nxyz', {
               normalized: true,
            }),
         );
      });

      it('has no effect if the attribute list has no element name', () => {
         const attList = makeAttListDeclaration('CDATA');
         const nameless = new AttListDeclarationPToken(attList, { elementName: undefined });
         const elementStart = new ElementStartPToken({
            open: toSToken('<'),
            name: undefined,
            nameSpace: undefined,
            attributes: [
               {
                  name: toSToken('att1'),
                  value: toSToken('\n\nxyz'),
               },
            ],
         });
         fixAttributes.processPToken(nameless);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(elementStart);
      });

      it('modifies a CDATA attribute to replace multiple sequential whitespace characters with spaces', () => {
         const attList = makeAttListDeclaration('CDATA');
         const elementStart = makeElementStartWithAttrValueFromString('x\n\r\n\t yz');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValueFromString('x     yz', 'x\n\r\n\t yz', {
               normalized: true,
            }),
         );
      });

      it('ignores redeclarations of the same attribute', () => {
         const attList = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elStart'),
            elementNameSpace: toSToken(' '),
            attDefs: [
               {
                  name: toSToken('att1'),
                  nameSpace: toSToken(' '),
                  type: toSToken('NMTOKENS'),
                  typeSpace: toSToken(' '),
                  defaultType: toSToken('#REQUIRED'),
                  defaultTypeSpace: toSToken(' '),
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('x') })],
                  closeQuote: toSToken('"'),
               },
               {
                  name: toSToken('att1'),
                  nameSpace: toSToken(' '),
                  type: toSToken('CDATA'),
                  typeSpace: toSToken(' '),
                  defaultType: toSToken('#REQUIRED'),
                  defaultTypeSpace: toSToken(' '),
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('x') })],
                  closeQuote: toSToken('"'),
               },
            ],
            close: toSToken('>'),
         });
         const elementStart = makeElementStartWithAttrValueFromString('x\n\r\n\t yz');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValueFromString('x yz', 'x\n\r\n\t yz', {
               normalized: true,
               dtdChangedNormalization: true,
            }),
         );
      });

      it('modifies a non-CDATA attribute to trim leading newlines', () => {
         const attList = makeAttListDeclaration('NMTOKENS');
         const elementStart = makeElementStartWithAttrValueFromString('\n\nxyz');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValueFromString('xyz', '\n\nxyz', {
               normalized: true,
               dtdChangedNormalization: true,
            }),
         );
      });

      it('modifies a non-CDATA attribute to replace multiple sequential whitespace characters with space', () => {
         const attList = makeAttListDeclaration('NMTOKENS');
         const elementStart = makeElementStartWithAttrValueFromString('x\n\r\n\t yz');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValueFromString('x yz', 'x\n\r\n\t yz', {
               normalized: true,
               dtdChangedNormalization: true,
            }),
         );
      });

      it('modifies a non-CDATA attribute to remove trailing space', () => {
         const attList = makeAttListDeclaration('NMTOKENS');
         const elementStart = makeElementStartWithAttrValueFromString('x\n\r\n\t yz   ');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValueFromString('x yz', 'x\n\r\n\t yz   ', {
               normalized: true,
               dtdChangedNormalization: true,
            }),
         );
      });

      it('modifies a non-CDATA attribute to remove trailing space across multiple text tokens', () => {
         const attList = makeAttListDeclaration('NMTOKENS');
         fixAttributes.processPToken(attList);

         const otherStart = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: undefined,
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [
                     new TextPToken(toSToken(' one ')),
                     new TextPToken(toSToken('  ')),
                     new TextPToken(toSToken('  ')),
                  ],
               },
            ],
         });

         const result = fixAttributes.processPToken(otherStart);

         expect(result).toEqual(
            new ElementStartPToken({
               open: toSToken('<'),
               name: toSToken('elStart'),
               nameSpace: undefined,
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [
                        new TextPToken(new SToken('one', ' one ', toSToken(' ').ranges)),
                        new TextPToken(new SToken('', '  ', toSToken(' ').ranges)),
                        new TextPToken(new SToken('', '  ', toSToken(' ').ranges)),
                     ],
                     normalized: true,
                     dtdChangedNormalization: true,
                  },
               ],
            }),
         );
      });

      it('modifies a non-CDATA attribute to normalize across multiple tokens in interior and exterior', () => {
         const blankText = new TextPToken(toSToken('  '));
         const ranges = toSToken(' ').ranges;
         const normalizedText = new TextPToken(new SToken('', '  ', ranges));
         const attList = makeAttListDeclaration('NMTOKENS');
         fixAttributes.processPToken(attList);

         const otherStart = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: undefined,
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [
                     blankText,
                     blankText,
                     new TextPToken(toSToken(' one ')),
                     blankText,
                     blankText,
                     new TextPToken(toSToken(' two ')),
                     blankText,
                     new TextPToken(toSToken('  ')), // last needs to be unique because we use this to identify the lat item in the list
                  ],
               },
            ],
         });

         const result = fixAttributes.processPToken(otherStart);

         expect(result).toEqual(
            new ElementStartPToken({
               open: toSToken('<'),
               name: toSToken('elStart'),
               nameSpace: undefined,
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [
                        normalizedText,
                        normalizedText,
                        new TextPToken(new SToken('one ', ' one ', toSToken(' ').ranges)),
                        normalizedText,
                        normalizedText,
                        new TextPToken(new SToken('two', ' two ', toSToken(' ').ranges)),
                        normalizedText,
                        normalizedText,
                     ],
                     normalized: true,
                     dtdChangedNormalization: true,
                  },
               ],
            }),
         );
      });

      it('modifies a non-CDATA attribute remove space, but not space the spans a charref', () => {
         const attList = makeAttListDeclaration('NMTOKENS');
         const elementStart = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: undefined,
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [
                     new TextPToken({ text: toSToken('   \na   ') }),
                     new CharRefPToken({ open: toSToken('&'), digits: toSToken('65') }),
                     new TextPToken({ text: toSToken('   \na   ') }),
                  ],
               },
            ],
         });

         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart) as ElementStartPToken;

         // @ts-expect-error 2329/matchers
         expect(result.attributes[0].value).toEqualRangeless([
            new TextPToken({ text: new SToken('a ', '   \na   ', []) }),
            new CharRefPToken({ open: toSToken('&'), digits: toSToken('65') }),
            new TextPToken({ text: new SToken(' a', '   \na   ', []) }),
         ]);
      });

      it('modifies a non-CDATA attribute remove across general entity start and end', () => {
         const reference = new GeneralEntityReferencePToken({ open: toSToken('&') });
         const attList = makeAttListDeclaration('NMTOKENS');
         const elementStart = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: undefined,
            attributes: [
               {
                  name: toSToken('a'),
                  value: [
                     new TextPToken({ text: toSToken('   \na   ') }),
                     new GeneralEntityStartPToken(reference),
                     new TextPToken({ text: toSToken('   \n\t   ') }),
                     new GeneralEntityEndPToken(reference),
                     new TextPToken({ text: toSToken('   \na   ') }),
                  ],
               },
            ],
         });

         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart) as ElementStartPToken;

         // @ts-expect-error 2329/matchers
         expect(result.attributes[0].value).toEqualRangeless([
            new TextPToken({ text: new SToken('a ', '   \na   ', []) }),
            new GeneralEntityStartPToken(reference),
            new TextPToken({ text: new SToken('', '   \n\t   ', []) }),
            new GeneralEntityEndPToken(reference),
            new TextPToken({ text: new SToken('a', '   \na   ', []) }),
         ]);
      });

      it('modifies a CDATA attribute to replace various newlines with spaces', () => {
         const attList = makeAttListDeclaration('CDATA');
         const elementStart = makeElementStartWithAttrValue([
            ...entityD,
            ...entityD,
            makeTextPToken('A'),
            ...entityA,
            ...entityA,
            makeTextPToken('B'),
            ...entityDA,
         ]);
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValue(
               [
                  ...entityDSpace,
                  ...entityDSpace,
                  makeTextPToken('A'),
                  ...entityASpace,
                  ...entityASpace,
                  makeTextPToken('B'),
                  ...entityDASpace,
               ],
               {
                  normalized: true,
               },
            ),
         );
      });

      // <!ENTITY d "&#xD;">
      // <!ENTITY a "&#xA;">
      // <!ENTITY da "&#xD;&#xA;">
      // a="&d;&d;A&a;&#x20;&a;B&da;"
      it('modifies a non-CDATA attribute to replace various sequential newlines with individual spaces', () => {
         const attList = makeAttListDeclaration('NMTOKENS');
         const elementStart = makeElementStartWithAttrValue([
            ...entityD,
            ...entityD,
            makeTextPToken('A'),
            ...entityA,
            ...entityA,
            makeTextPToken('B'),
            ...entityDA,
         ]);
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValue(
               [
                  ...entityDEmpty,
                  ...entityDEmpty,
                  makeTextPToken('A'),
                  ...entityASpace,
                  ...entityAEmpty,
                  makeTextPToken('B'),
                  ...entityDAEmpty,
               ],
               {
                  normalized: true,
                  dtdChangedNormalization: true,
               },
            ),
         );
      });

      it('leaves char references in a CDATA attribute unchanged', () => {
         const attList = makeAttListDeclaration('CDATA');
         const elementStart = makeElementStartWithAttrValue([
            charRefD,
            charRefD,
            makeTextPToken('A'),
            charRefA,
            charRefA,
            makeTextPToken('B'),
            charRefD,
            charRefA,
         ]);
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValue([
               charRefD,
               charRefD,
               makeTextPToken('A'),
               charRefA,
               charRefA,
               makeTextPToken('B'),
               charRefD,
               charRefA,
            ]),
         );
      });

      it('leaves char references in a non-CDATA attribute unchanged', () => {
         const attList = makeAttListDeclaration('NMTOKENS');
         const elementStart = makeElementStartWithAttrValue([
            charRefD,
            charRefD,
            makeTextPToken('A'),
            charRefA,
            charRefA,
            makeTextPToken('B'),
            charRefD,
            charRefA,
         ]);
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            makeElementStartWithAttrValue([
               charRefD,
               charRefD,
               makeTextPToken('A'),
               charRefA,
               charRefA,
               makeTextPToken('B'),
               charRefD,
               charRefA,
            ]),
         );
      });
   });

   describe('public literal normalization', () => {
      it('normalizes the public literal in a notation declaration', () => {
         const notationDeclaration = new NotationDeclarationPToken(makeNotationDeclaration(), {
            externalId: new ExternalIdP({
               externalType: toSToken('PUBLIC'),
               public: {
                  openQuote: toSToken('"'),
                  value: [new TextPToken(toSToken(' one   two  '))],
                  closeQuote: toSToken('"'),
               },
            }),
         });

         const result = fixAttributes.processPToken(notationDeclaration);

         expect(result).toEqual(
            new NotationDeclarationPToken(makeNotationDeclaration(), {
               externalId: new ExternalIdP({
                  externalType: toSToken('PUBLIC'),
                  public: {
                     openQuote: toSToken('"'),
                     value: [
                        new TextPToken(new SToken('one two', ' one   two  ', toSToken(' ').ranges)),
                     ],
                     closeQuote: toSToken('"'),
                  },
               }),
            }),
         );
      });

      it('normalizes the public literal in a parameter entity declaration', () => {
         const notationDeclaration = new ParameterEntityDeclarationPToken(
            makeParameterEntityDeclaration(),
            {
               externalId: new ExternalIdP({
                  externalType: toSToken('PUBLIC'),
                  system: {
                     openQuote: toSToken('"'),
                     value: [new TextPToken(toSToken(' one   two  '))],
                     closeQuote: toSToken('"'),
                  },
                  public: {
                     openQuote: toSToken('"'),
                     value: [new TextPToken(toSToken(' one   two  '))],
                     closeQuote: toSToken('"'),
                  },
               }),
            },
         );

         const result = fixAttributes.processPToken(notationDeclaration);

         expect(result).toEqual(
            new ParameterEntityDeclarationPToken(makeParameterEntityDeclaration(), {
               externalId: new ExternalIdP({
                  externalType: toSToken('PUBLIC'),
                  system: {
                     openQuote: toSToken('"'),
                     value: [new TextPToken(toSToken(' one   two  '))],
                     closeQuote: toSToken('"'),
                  },
                  public: {
                     openQuote: toSToken('"'),
                     value: [
                        new TextPToken(new SToken('one two', ' one   two  ', toSToken(' ').ranges)),
                     ],
                     closeQuote: toSToken('"'),
                  },
               }),
            }),
         );
      });

      it('normalizes the public literal in a geenral entity declaration', () => {
         const notationDeclaration = new GeneralEntityDeclarationPToken(
            makeGeneralEntityDeclaration(),
            {
               externalId: new ExternalIdP({
                  externalType: toSToken('PUBLIC'),
                  public: {
                     openQuote: toSToken('"'),
                     value: [new TextPToken(toSToken(' one   two  '))],
                     closeQuote: toSToken('"'),
                  },
               }),
            },
         );

         const result = fixAttributes.processPToken(notationDeclaration);

         expect(result).toEqual(
            new GeneralEntityDeclarationPToken(makeGeneralEntityDeclaration(), {
               externalId: new ExternalIdP({
                  externalType: toSToken('PUBLIC'),
                  public: {
                     openQuote: toSToken('"'),
                     value: [
                        new TextPToken(new SToken('one two', ' one   two  ', toSToken(' ').ranges)),
                     ],
                     closeQuote: toSToken('"'),
                  },
               }),
            }),
         );
      });
   });

   describe('attribute default addition', () => {
      it('adds a default attribute if not in the element', () => {
         const attList = makeAttListDeclaration();
         const elementStart = makeElementStart();
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(
            new ElementStartPToken({
               open: toSToken('<'),
               name: toSToken('elStart'),
               nameSpace: toSToken(' '),
               attributes: [
                  {
                     name: toSToken('att1'),
                     equal: toSToken('='),
                     openQuote: toSToken('"'),
                     value: [new TextPToken({ text: toSToken('x') })],
                     closeQuote: toSToken('"'),
                     trailingSpace: toSToken(' '),
                     defaulted: true,
                  },
               ],
               close: toSToken('>'),
            }),
         );
      });

      it('does not add a default if the element start already has a value', () => {
         const attList = makeAttListDeclaration();
         const element = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: toSToken(' '),
            attributes: [
               {
                  name: toSToken('att1'),
                  equal: toSToken('='),
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('foo') })],
                  closeQuote: toSToken('"'),
                  trailingSpace: toSToken(' '),
               },
            ],
         });
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(element);

         expect(result).toEqual(element);
      });

      it('does not add a nameSpace if it is already present', () => {
         const attList = makeAttListDeclaration();
         const element = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: toSToken('\t'),
            attributes: [],
         });
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(element);

         expect(result).toEqual(
            new ElementStartPToken({
               open: toSToken('<'),
               name: toSToken('elStart'),
               nameSpace: toSToken('\t'),
               attributes: [
                  {
                     name: toSToken('att1'),
                     equal: toSToken('='),
                     openQuote: toSToken('"'),
                     value: [new TextPToken({ text: toSToken('x') })],
                     closeQuote: toSToken('"'),
                     trailingSpace: toSToken(' '),
                     defaulted: true,
                  },
               ],
            }),
         );
      });

      it('does not add a space to a previous attribute if already present', () => {
         const attList = makeAttListDeclaration();
         const element = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: toSToken('\t'),
            attributes: [
               {
                  name: toSToken('b'),
                  equal: toSToken('='),
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('b') })],
                  closeQuote: toSToken('"'),
                  trailingSpace: toSToken('\t'),
               },
            ],
         });
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(element);

         expect(result).toEqual(
            new ElementStartPToken({
               open: toSToken('<'),
               name: toSToken('elStart'),
               nameSpace: toSToken('\t'),
               attributes: [
                  {
                     name: toSToken('b'),
                     equal: toSToken('='),
                     openQuote: toSToken('"'),
                     value: [new TextPToken({ text: toSToken('b') })],
                     closeQuote: toSToken('"'),
                     trailingSpace: toSToken('\t'),
                  },
                  {
                     name: toSToken('att1'),
                     equal: toSToken('='),
                     openQuote: toSToken('"'),
                     value: [new TextPToken({ text: toSToken('x') })],
                     closeQuote: toSToken('"'),
                     trailingSpace: toSToken(' '),
                     defaulted: true,
                  },
               ],
            }),
         );
      });

      it('adds a space to a previous attribute if not present when adding a default', () => {
         const attList = makeAttListDeclaration();
         const element = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: toSToken('\t'),
            attributes: [
               {
                  name: toSToken('b'),
                  equal: toSToken('='),
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('b') })],
                  closeQuote: toSToken('"'),
               },
            ],
         });
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(element);

         expect(result).toEqual(
            new ElementStartPToken({
               open: toSToken('<'),
               name: toSToken('elStart'),
               nameSpace: toSToken('\t'),
               attributes: [
                  {
                     name: toSToken('b'),
                     equal: toSToken('='),
                     openQuote: toSToken('"'),
                     value: [new TextPToken({ text: toSToken('b') })],
                     closeQuote: toSToken('"'),
                     trailingSpace: toSToken(' '),
                  },
                  {
                     name: toSToken('att1'),
                     equal: toSToken('='),
                     openQuote: toSToken('"'),
                     value: [new TextPToken({ text: toSToken('x') })],
                     closeQuote: toSToken('"'),
                     trailingSpace: toSToken(' '),
                     defaulted: true,
                  },
               ],
            }),
         );
      });

      it('uses the original name token when available', () => {
         const attList = makeAttListDeclaration();
         const element = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: toSToken('\t'),
            attributes: [],
         });
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(element) as ElementStartPToken;

         expect(result.attributes[0].name).toBe(attList.attDefs[0].name);
      });

      it('adds no attribute if no default values provided', () => {
         const attList = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elStart'),
            elementNameSpace: toSToken(' '),
            attDefs: [
               {
                  name: toSToken('att1'),
                  nameSpace: toSToken(' '),
                  type: toSToken('CDATA'),
                  typeSpace: toSToken(' '),
                  defaultType: toSToken('#REQUIRED'),
                  defaultTypeSpace: toSToken(' '),
                  value: [],
               },
            ],
            close: toSToken('>'),
         });
         const element = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: toSToken('\t'),
            attributes: [],
         });
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(element) as ElementStartPToken;

         expect(result.attributes).toEqual([]);
      });

      it('uses the original quote tokens when available', () => {
         const attList = makeAttListDeclaration();
         const element = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: toSToken('\t'),
            attributes: [],
         });
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(element) as ElementStartPToken;

         expect(result.attributes[0].openQuote).toBe(attList.attDefs[0].openQuote);
         expect(result.attributes[0].closeQuote).toBe(attList.attDefs[0].closeQuote);
      });

      it('manufactures quote tokens when not provided', () => {
         const attList = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elStart'),
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('CDATA'),
                  value: [new TextPToken({ text: toSToken('x') })],
               },
            ],
         });

         const element = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elStart'),
            nameSpace: toSToken('\t'),
            attributes: [],
         });
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(element) as ElementStartPToken;

         expect(result.attributes[0].openQuote).toEqual(toSToken('"'));
         expect(result.attributes[0].closeQuote).toEqual(toSToken('"'));
      });
   });
});

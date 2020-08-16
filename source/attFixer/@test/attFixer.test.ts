import {
   AttListPToken,
   ElementStartPToken,
   TextPToken,
   GeneralEntityReferencePToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   CharRefPToken,
} from 'token';
import { toSToken } from 'sToken';

import { AttFixer } from '../attFixer';

type AttrValue = Array<
   GeneralEntityStartPToken | GeneralEntityEndPToken | TextPToken | CharRefPToken
>;

function makeTextPToken(text: string): TextPToken {
   return new TextPToken({
      text: toSToken(text),
   });
}

function makeElementStartWithValue(value: AttrValue): ElementStartPToken {
   return new ElementStartPToken({
      open: toSToken('<'),
      name: toSToken('one'),
      attributes: [
         {
            name: toSToken('a'),
            value,
         },
      ],
   });
}

function makeAttListPToken(type: string): AttListPToken {
   return new AttListPToken({
      open: toSToken('<!'),
      elementName: toSToken('one'),
      attDefs: [
         {
            name: toSToken('a'),
            type: toSToken(type),
            value: [],
         },
      ],
   });
}

function makeElementStart(value: string): ElementStartPToken {
   return makeElementStartWithValue([new TextPToken({ text: toSToken(value) })]);
}

describe('attFix', () => {
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
   let charSpace: TextPToken;
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
      charSpace = makeTextPToken(' ');
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
         charSpace,
         new GeneralEntityEndPToken(dReference),
      ];
      entityDEmpty = [
         new GeneralEntityStartPToken(dReference),
         new GeneralEntityEndPToken(dReference),
      ];
      entityASpace = [
         new GeneralEntityStartPToken(aReference),
         charSpace,
         new GeneralEntityEndPToken(aReference),
      ];
      entityAEmpty = [
         new GeneralEntityStartPToken(aReference),
         new GeneralEntityEndPToken(aReference),
      ];
      entityDASpace = [
         new GeneralEntityStartPToken(daReference),
         makeTextPToken('  '),
         new GeneralEntityEndPToken(daReference),
      ];
      entityDAEmpty = [
         new GeneralEntityStartPToken(daReference),
         new GeneralEntityEndPToken(daReference),
      ];

      fixAttributes = new AttFixer();
   });

   it('returns an ATTLIST unchanged when passed one', () => {
      const attList = makeAttListPToken('CDATA');

      const result = fixAttributes.processPToken(attList);

      expect(result).toEqual(attList);
   });

   describe('attribute normalization', () => {
      it('modifies a CDATA attribute to replace newlines with spaces', () => {
         const attList = makeAttListPToken('CDATA');
         const elementStart = makeElementStart('\n\nxyz');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(makeElementStart('  xyz'));
      });

      it('modifies a CDATA attribute to replace multiple sequential whitespace characters with spaces', () => {
         const attList = makeAttListPToken('CDATA');
         const elementStart = makeElementStart('x\n\r\n\t yz');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(makeElementStart('x     yz'));
      });

      it('modifies a non-CDATA attribute to trim leading newlines', () => {
         const attList = makeAttListPToken('NMTOKENS');
         const elementStart = makeElementStart('\n\nxyz');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(makeElementStart('xyz'));
      });

      it('modifies a non-CDATA attribute to replace multiple sequential whitespace characters with space', () => {
         const attList = makeAttListPToken('NMTOKENS');
         const elementStart = makeElementStart('x\n\r\n\t yz');
         fixAttributes.processPToken(attList);

         const result = fixAttributes.processPToken(elementStart);

         expect(result).toEqual(makeElementStart('x yz'));
      });

      it('modifies a CDATA attribute to replace various newlines with spaces', () => {
         const attList = makeAttListPToken('CDATA');
         const elementStart = makeElementStartWithValue([
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
            makeElementStartWithValue([
               ...entityDSpace,
               ...entityDSpace,
               makeTextPToken('A'),
               ...entityASpace,
               ...entityASpace,
               makeTextPToken('B'),
               ...entityDASpace,
            ]),
         );
      });

      it('modifies a non-CDATA attribute to replace various sequential newlines with individual spaces', () => {
         const attList = makeAttListPToken('NMTOKENS');
         const elementStart = makeElementStartWithValue([
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
            makeElementStartWithValue([
               ...entityDEmpty,
               ...entityDEmpty,
               makeTextPToken('A'),
               ...entityASpace,
               ...entityAEmpty,
               makeTextPToken('B'),
               ...entityDAEmpty,
            ]),
         );
      });

      it('leaves char references in a CDATA attribute unchanged', () => {
         const attList = makeAttListPToken('CDATA');
         const elementStart = makeElementStartWithValue([
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
            makeElementStartWithValue([
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
         const attList = makeAttListPToken('NMTOKENS');
         const elementStart = makeElementStartWithValue([
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
            makeElementStartWithValue([
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
});

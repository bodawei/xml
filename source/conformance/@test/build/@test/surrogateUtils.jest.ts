import {
   charToUtf8Bytes,
   convertToStringWithSurrogateHalves,
   extractAndReplaceSurrogateHalves,
   makeSurrogateHalvesIterator,
   mightContainSurrogateHalf,
   utf8BytesToChar,
} from '../surrogateUtils';

describe('surrogateUtils', () => {
   describe('charToUtf8Bytes()', () => {
      it('converts each input character to the expected set of bytes', () => {
         for (let charCode = 0; charCode <= 0xffff; charCode += 97) {
            const bytes = charToUtf8Bytes(String.fromCharCode(charCode));
            const buffer = Buffer.from(String.fromCharCode(charCode));
            const expected = [];

            for (let index = 0; index < buffer.length; index++) {
               expected.push(buffer[index]);
            }

            if (charCode >= 0xd800 && charCode <= 0xdfff) {
               // Buffer.from() doesn't convert the surrogate halves "correctly".
               // console.log(bytes);
               continue;
            }

            expect({ input: charCode, output: bytes }).toEqual({
               input: charCode,
               output: new Uint8Array(expected),
            });
         }
      });
   });

   describe('convertToStringWithSurrogateHalves', () => {
      it('replaces multiple surrogate halves', () => {
         const input = Buffer.from('01234---89---de---ij');
         input[5] = 0xed;
         input[6] = 0xa0;
         input[7] = 0x80;
         input[10] = 237;
         input[11] = 178;
         input[12] = 186;
         input[15] = 0xed;
         input[16] = 0xa0;
         input[17] = 0x80;
         const expected = '01234\ud80089\udcbade\ud800ij';

         const result = convertToStringWithSurrogateHalves(input);

         expect(result).toEqual(expected);
      });
   });

   describe('utf8BytesToChar()', () => {
      it('converts each set of bytes to the expected character', () => {
         for (let charCode = 0; charCode <= 0xffff; charCode += 97) {
            const bytes = charToUtf8Bytes(String.fromCharCode(charCode));

            const result = utf8BytesToChar(bytes);

            expect({ input: charCode, output: result }).toEqual({
               input: charCode,
               output: String.fromCharCode(charCode),
            });
         }
      });
   });

   describe('makeSurrogateHalvesIterator()', () => {
      it('first call to the iterator returns 0xD800', () => {
         const iterator = makeSurrogateHalvesIterator();

         const result = iterator.next();

         expect(result).toEqual({
            value: new Uint8Array([0xed, 0xa0, 0x80]),
            done: false,
         });
      });
   });

   describe('extractAndReplaceSurrogateHalves()', () => {
      it('replaces one surrogate half', () => {
         const input = Buffer.from('this is a test');
         input[5] = 0xed;
         input[6] = 0xa0;
         input[7] = 0x80;
         const expected = Buffer.from('this is a test');
         expected[5] = 0x01;
         expected[6] = 0x01;
         expected[7] = 0x01;

         const result = extractAndReplaceSurrogateHalves(input);

         expect(result).toEqual([['\ud800'], expected]);
      });

      it('replaces multiple surrogate halves i nthe right order', () => {
         const input = Buffer.from('this is a test');
         input[1] = 0xed;
         input[2] = 0xa0;
         input[3] = 0x83;
         input[5] = 0xed;
         input[6] = 0xa0;
         input[7] = 0x82;
         input[10] = 0xed;
         input[11] = 0xa0;
         input[12] = 0x81;
         const expected = Buffer.from('this is a test');
         expected[1] = 0x01;
         expected[2] = 0x01;
         expected[3] = 0x01;
         expected[5] = 0x01;
         expected[6] = 0x01;
         expected[7] = 0x01;
         expected[10] = 0x01;
         expected[11] = 0x01;
         expected[12] = 0x01;

         const result = extractAndReplaceSurrogateHalves(input);

         expect(result).toEqual([['\ud803', '\ud802', '\ud801'], expected]);
      });

      it('returns nothing when there are no surrogate halves', () => {
         const input = Buffer.from('this is a test');
         input[5] = 0xed;
         input[6] = 0xa0;
         input[7] = 0x7f;
         const expected = Buffer.from('this is a test');
         expected[5] = 0xed;
         expected[6] = 0xa0;
         expected[7] = 0x7f;

         const result = extractAndReplaceSurrogateHalves(input);

         expect(result).toEqual([[], expected]);
      });
   });

   describe('mightContainSurrogateHalf()', () => {
      it('returns true if the buffer contains a surrogate half', () => {
         const buffer = Buffer.from('This is a long example of text');
         buffer[10] = 237;
         buffer[11] = 174;
         buffer[12] = 169;

         expect(mightContainSurrogateHalf(buffer)).toEqual(true);
      });

      it('returns false if the buffer does not contain a surrogate half', () => {
         const buffer = Buffer.from('This is a long example of text');

         expect(mightContainSurrogateHalf(buffer)).toEqual(false);
      });

      it('returns true if the buffer contains something that starts with 237 but is not a surrogate half', () => {
         const buffer = Buffer.from('This is a long example of text');
         buffer[10] = 237;
         buffer[11] = 12;
         buffer[12] = 12;

         expect(mightContainSurrogateHalf(buffer)).toEqual(true);
      });
   });
});

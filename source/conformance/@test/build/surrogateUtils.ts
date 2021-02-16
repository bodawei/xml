/* Copyright ® 2021 by 柏大衛. All rights reserved. */

/*
 * This is a set of utilities that collectively are build to solve the problem of loading
 * files with lone surrogate characters, and thus the central routine is
 * convertToStringWithSurrogateHalves(). Several of the routines in here are "overbuilt",
 * wich mean they solve a wider range of problems.
 */
function charToUtf8Bytes(char: string): Uint8Array {
   const charCode = char.charCodeAt(0);

   if (charCode <= 0x007f) {
      return new Uint8Array([charCode]);
   } else if (charCode <= 0x07ff) {
      const bitsOne = charCode & 0b0000_0111_1100_0000; //0x07c0;
      const bitsTwo = charCode & 0b0000_0000_0011_1111; // 0x003f;
      const byteOne = 0xc0 | (bitsOne >> 6);
      const byteTwo = 0x80 | bitsTwo;

      return new Uint8Array([byteOne, byteTwo]);
   } else if (charCode <= 0xffff) {
      const bitsOne = charCode & 0b1111_0000_0000_0000; // 0xf000;
      const bitsTwo = charCode & 0b0000_1111_1100_0000; // 0x0fc0;
      const bitsThree = charCode & 0b0000_0000_0011_1111; // 0x003f;
      const byteOne = 0xe0 | (bitsOne >> 12);
      const byteTwo = 0x80 | (bitsTwo >> 6);
      const byteThree = 0x80 | bitsThree;

      return new Uint8Array([byteOne, byteTwo, byteThree]);
   } else {
      // not supported at this time
      return new Uint8Array([]);
   }
}

// My reference for this: https://en.wikipedia.org/wiki/UTF-8#Encoding
function utf8BytesToChar(bytes: Uint8Array | Buffer): string {
   const leadingByte = bytes[0];

   // 0x80
   if ((leadingByte & 0b1000_0000) !== 0b1000_0000) {
      return String.fromCharCode(bytes[0]);
   }

   let found = false;
   let header = 0b1100_0000; // 0xc0;
   let mask = 0b1110_0000; // 0xe0;
   let result = 0;
   let followingBytes = 1;

   // Figure out how many following bytes there are after the leading one
   while (!found) {
      const headerCandidate = leadingByte & mask;

      found = headerCandidate === header;

      if (found) {
         // extract the data bits because we found the header
         result = ~mask & leadingByte;
      } else {
         // increment to check for the next set of header bits
         header = (header >> 1) | 0b1000_0000; // 1100 0000 => 1110 0000
         mask = (mask >> 1) | 0b1000_0000; // 1110 0000 => 1111 0000
         followingBytes++;
      }

      if (followingBytes > 6) {
         throw new Error('We did not find a valid UTF8 leading byte');
      }
   }

   for (let index = 0; index < followingBytes; index++) {
      const nextByte = bytes[index + 1];
      const nextBits = nextByte & 0b0011_1111; // 0x3f;
      // Shift the bits we have so far up and add the additional bits
      result = (result << 6) + nextBits;
   }

   return String.fromCharCode(result);
}

function mightContainSurrogateHalf(data: Buffer): boolean {
   // All surrogate halves in utf8 start with a byte with decimal vaue 237
   return data.indexOf(237) !== -1;
}

function* makeSurrogateHalvesIterator(): Generator<Uint8Array> {
   for (let charCode = 0xd800; charCode < 0xdfff; charCode += 1) {
      yield charToUtf8Bytes(String.fromCharCode(charCode));
   }
}

/*
 * Find any surrogate halves in the input buffer. When found,
 * add the corresponding string character into the return value,
 * and replace the value in the buffer with three bytes each
 * with the value 0x01.  (these will be decoded properly by node)
 */
function extractAndReplaceSurrogateHalves(input: Buffer): [Array<string>, Buffer] {
   const halves: Array<string> = [];
   const newBuffer = Buffer.from(input);
   let index = newBuffer.indexOf(237);

   while (index !== -1 && index < newBuffer.length - 2) {
      const byteOne = newBuffer[index];
      const byteTwo = newBuffer[index + 1];
      const byteThree = newBuffer[index + 2];

      // 0xD800 is 0xED 0xA0 0x80
      // 0xDFFF is 0xED 0xBF 0xBF
      // Note that the largest value in utf8 for a third byte is 0xBF and lowest is 0x80
      if (
         byteTwo >= 0b1010_000 &&
         byteTwo <= 0b1011_1111 &&
         byteThree >= 0b1000_0000 &&
         byteThree <= 0b1011_1111
      ) {
         halves.push(utf8BytesToChar(new Uint8Array([byteOne, byteTwo, byteThree])));
         newBuffer[index] = 1;
         newBuffer[index + 1] = 1;
         newBuffer[index + 2] = 1;
      }

      index = newBuffer.indexOf(237, index + 1);
   }

   return [halves, newBuffer];
}

/*
 * This is similar to new Buffer().toString(), with the difference
 * that all surrogate halves are returned as their corresponding
 * "characters", rather than being converted to 0xFFFD.
 * As much as possible, we rely on the underlying Node buffer
 * to string conversion (and hence the native utf8 conversion)
 * since that is sure to be faster than doing it all ourselves.
 */
function convertToStringWithSurrogateHalves(input: Buffer): string {
   // Pull out all surrogate halves
   const [halves, inputWithPlaceholders] = extractAndReplaceSurrogateHalves(input);
   let srtWithPlaceholders = inputWithPlaceholders.toString('utf8');

   if (halves.length === 0) {
      return srtWithPlaceholders;
   }

   for (let index = 0; index < halves.length; index++) {
      srtWithPlaceholders = srtWithPlaceholders.replace('\u0001\u0001\u0001', halves[index]);
   }

   return srtWithPlaceholders;
}

export {
   charToUtf8Bytes,
   convertToStringWithSurrogateHalves,
   extractAndReplaceSurrogateHalves,
   mightContainSurrogateHalf,
   utf8BytesToChar,
   makeSurrogateHalvesIterator,
};

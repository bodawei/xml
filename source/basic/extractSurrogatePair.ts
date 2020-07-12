type SurrogatePair = [number, number];

// https://dmitripavlutin.com/what-every-javascript-developer-should-know-about-unicode/
function extractSurrogatePair(astralCodePoint: number): SurrogatePair {
   let highSurrogate =
      Math.floor((astralCodePoint - 0x10000) / 0x400) + 0xD800;
   let lowSurrogate = (astralCodePoint - 0x10000) % 0x400 + 0xDC00;
   return [highSurrogate, lowSurrogate];
}

export {
   extractSurrogatePair
}
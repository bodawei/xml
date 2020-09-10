type SurrogatePair = [number, number];

// https://dmitripavlutin.com/what-every-javascript-developer-should-know-about-unicode/
function extractSurrogatePair(astralCodePoint: number): SurrogatePair {
   const highSurrogate = Math.floor((astralCodePoint - 0x10000) / 0x400) + 0xd800;
   const lowSurrogate = ((astralCodePoint - 0x10000) % 0x400) + 0xdc00;
   return [highSurrogate, lowSurrogate];
}

export { extractSurrogatePair };

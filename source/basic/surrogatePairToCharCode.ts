// https://en.wikipedia.org/wiki/UTF-16#U+D800_to_U+DFFF
function surrogatePairToCharCode(surrogateHigh: number, surrogateLow: number): number {
   const high = (surrogateHigh - 0xd800) * 0x400;
   const low = surrogateLow - 0xdc00;

   return 0x10000 + (high + low);
}

export { surrogatePairToCharCode };

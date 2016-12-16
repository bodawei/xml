/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const Offset = require('./shared/Offset.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const EntityLocation = require('./shared/EntityLocation.js');
const TextChunk = require('./shared/TextChunk.js');
const util = require('./shared/util.js');

const DECIMAL = 'DECIMAL';
const HEX = 'HEX';

const LINE_ENDING_REGEX10 = /(\r\n)|(\r)/g;
const LINE_ENDING_REGEX11 = /(\r[\u0085\n])|([\r\u0085\u2028])/g;

/* eslint-disable max-len, max-block-comment-len */
/*
  For 1.0/5 and 1.1:
   [5]  Name          ::= NameStartChar (NameChar)*
   [4]  NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] |
                          [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] |
                          [#x37F-#x1FFF] | [#x200C-#x200D] |
                          [#x2070-#x218F] | [#x2C00-#x2FEF] |
                          [#x3001-#xD7FF] | [#xF900-#xFDCF] |
                          [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
    [4a] NameChar     ::= NameStartChar | "-" | "." | [0-9] | #xB7 |
                          [#x0300-#x036F] | [#x203F-#x2040]

  For 1.0/1-1.0/4
   [4]  NameChar      ::= Letter | Digit | '.' | '-' | '_' | ':' |
                          CombiningChar | Extender
   [5]  Name          ::= (Letter | '_' | ':') (NameChar)*
   [84] Letter	       ::= BaseChar | Ideographic
   [85] BaseChar      ::= [#x0041-#x005A] | [#x0061-#x007A] | [#x00C0-#x00D6] | [#x00D8-#x00F6] | [#x00F8-#x00FF] | [#x0100-#x0131] | [#x0134-#x013E] | [#x0141-#x0148] | [#x014A-#x017E] | [#x0180-#x01C3] | [#x01CD-#x01F0] | [#x01F4-#x01F5] | [#x01FA-#x0217] | [#x0250-#x02A8] | [#x02BB-#x02C1] | #x0386 | [#x0388-#x038A] | #x038C | [#x038E-#x03A1] | [#x03A3-#x03CE] | [#x03D0-#x03D6] | #x03DA | #x03DC | #x03DE | #x03E0 | [#x03E2-#x03F3] | [#x0401-#x040C] | [#x040E-#x044F] | [#x0451-#x045C] | [#x045E-#x0481] | [#x0490-#x04C4] | [#x04C7-#x04C8] | [#x04CB-#x04CC] | [#x04D0-#x04EB] | [#x04EE-#x04F5] | [#x04F8-#x04F9] | [#x0531-#x0556] | #x0559 | [#x0561-#x0586] | [#x05D0-#x05EA] | [#x05F0-#x05F2] | [#x0621-#x063A] | [#x0641-#x064A] | [#x0671-#x06B7] | [#x06BA-#x06BE] | [#x06C0-#x06CE] | [#x06D0-#x06D3] | #x06D5 | [#x06E5-#x06E6] | [#x0905-#x0939] | #x093D | [#x0958-#x0961] | [#x0985-#x098C] | [#x098F-#x0990] | [#x0993-#x09A8] | [#x09AA-#x09B0] | #x09B2 | [#x09B6-#x09B9] | [#x09DC-#x09DD] | [#x09DF-#x09E1] | [#x09F0-#x09F1] | [#x0A05-#x0A0A] | [#x0A0F-#x0A10] | [#x0A13-#x0A28] | [#x0A2A-#x0A30] | [#x0A32-#x0A33] | [#x0A35-#x0A36] | [#x0A38-#x0A39] | [#x0A59-#x0A5C] | #x0A5E | [#x0A72-#x0A74] | [#x0A85-#x0A8B] | #x0A8D | [#x0A8F-#x0A91] | [#x0A93-#x0AA8] | [#x0AAA-#x0AB0] | [#x0AB2-#x0AB3] | [#x0AB5-#x0AB9] | #x0ABD | #x0AE0 | [#x0B05-#x0B0C] | [#x0B0F-#x0B10] | [#x0B13-#x0B28] | [#x0B2A-#x0B30] | [#x0B32-#x0B33] | [#x0B36-#x0B39] | #x0B3D | [#x0B5C-#x0B5D] | [#x0B5F-#x0B61] | [#x0B85-#x0B8A] | [#x0B8E-#x0B90] | [#x0B92-#x0B95] | [#x0B99-#x0B9A] | #x0B9C | [#x0B9E-#x0B9F] | [#x0BA3-#x0BA4] | [#x0BA8-#x0BAA] | [#x0BAE-#x0BB5] | [#x0BB7-#x0BB9] | [#x0C05-#x0C0C] | [#x0C0E-#x0C10] | [#x0C12-#x0C28] | [#x0C2A-#x0C33] | [#x0C35-#x0C39] | [#x0C60-#x0C61] | [#x0C85-#x0C8C] | [#x0C8E-#x0C90] | [#x0C92-#x0CA8] | [#x0CAA-#x0CB3] | [#x0CB5-#x0CB9] | #x0CDE | [#x0CE0-#x0CE1] | [#x0D05-#x0D0C] | [#x0D0E-#x0D10] | [#x0D12-#x0D28] | [#x0D2A-#x0D39] | [#x0D60-#x0D61] | [#x0E01-#x0E2E] | #x0E30 | [#x0E32-#x0E33] | [#x0E40-#x0E45] | [#x0E81-#x0E82] | #x0E84 | [#x0E87-#x0E88] | #x0E8A | #x0E8D | [#x0E94-#x0E97] | [#x0E99-#x0E9F] | [#x0EA1-#x0EA3] | #x0EA5 | #x0EA7 | [#x0EAA-#x0EAB] | [#x0EAD-#x0EAE] | #x0EB0 | [#x0EB2-#x0EB3] | #x0EBD | [#x0EC0-#x0EC4] | [#x0F40-#x0F47] | [#x0F49-#x0F69] | [#x10A0-#x10C5] | [#x10D0-#x10F6] | #x1100 | [#x1102-#x1103] | [#x1105-#x1107] | #x1109 | [#x110B-#x110C] | [#x110E-#x1112] | #x113C | #x113E | #x1140 | #x114C | #x114E | #x1150 | [#x1154-#x1155] | #x1159 | [#x115F-#x1161] | #x1163 | #x1165 | #x1167 | #x1169 | [#x116D-#x116E] | [#x1172-#x1173] | #x1175 | #x119E | #x11A8 | #x11AB | [#x11AE-#x11AF] | [#x11B7-#x11B8] | #x11BA | [#x11BC-#x11C2] | #x11EB | #x11F0 | #x11F9 | [#x1E00-#x1E9B] | [#x1EA0-#x1EF9] | [#x1F00-#x1F15] | [#x1F18-#x1F1D] | [#x1F20-#x1F45] | [#x1F48-#x1F4D] | [#x1F50-#x1F57] | #x1F59 | #x1F5B | #x1F5D | [#x1F5F-#x1F7D] | [#x1F80-#x1FB4] | [#x1FB6-#x1FBC] | #x1FBE | [#x1FC2-#x1FC4] | [#x1FC6-#x1FCC] | [#x1FD0-#x1FD3] | [#x1FD6-#x1FDB] | [#x1FE0-#x1FEC] | [#x1FF2-#x1FF4] | [#x1FF6-#x1FFC] | #x2126 | [#x212A-#x212B] | #x212E | [#x2180-#x2182] | [#x3041-#x3094] | [#x30A1-#x30FA] | [#x3105-#x312C] | [#xAC00-#xD7A3]
   [86] Ideographic   ::= [#x4E00-#x9FA5] | #x3007 | [#x3021-#x3029]
   [87] CombiningChar ::= [#x0300-#x0345] | [#x0360-#x0361] | [#x0483-#x0486] | [#x0591-#x05A1] | [#x05A3-#x05B9] | [#x05BB-#x05BD] | #x05BF | [#x05C1-#x05C2] | #x05C4 | [#x064B-#x0652] | #x0670 | [#x06D6-#x06DC] | [#x06DD-#x06DF] | [#x06E0-#x06E4] | [#x06E7-#x06E8] | [#x06EA-#x06ED] | [#x0901-#x0903] | #x093C | [#x093E-#x094C] | #x094D | [#x0951-#x0954] | [#x0962-#x0963] | [#x0981-#x0983] | #x09BC | #x09BE | #x09BF | [#x09C0-#x09C4] | [#x09C7-#x09C8] | [#x09CB-#x09CD] | #x09D7 | [#x09E2-#x09E3] | #x0A02 | #x0A3C | #x0A3E | #x0A3F | [#x0A40-#x0A42] | [#x0A47-#x0A48] | [#x0A4B-#x0A4D] | [#x0A70-#x0A71] | [#x0A81-#x0A83] | #x0ABC | [#x0ABE-#x0AC5] | [#x0AC7-#x0AC9] | [#x0ACB-#x0ACD] | [#x0B01-#x0B03] | #x0B3C | [#x0B3E-#x0B43] | [#x0B47-#x0B48] | [#x0B4B-#x0B4D] | [#x0B56-#x0B57] | [#x0B82-#x0B83] | [#x0BBE-#x0BC2] | [#x0BC6-#x0BC8] | [#x0BCA-#x0BCD] | #x0BD7 | [#x0C01-#x0C03] | [#x0C3E-#x0C44] | [#x0C46-#x0C48] | [#x0C4A-#x0C4D] | [#x0C55-#x0C56] | [#x0C82-#x0C83] | [#x0CBE-#x0CC4] | [#x0CC6-#x0CC8] | [#x0CCA-#x0CCD] | [#x0CD5-#x0CD6] | [#x0D02-#x0D03] | [#x0D3E-#x0D43] | [#x0D46-#x0D48] | [#x0D4A-#x0D4D] | #x0D57 | #x0E31 | [#x0E34-#x0E3A] | [#x0E47-#x0E4E] | #x0EB1 | [#x0EB4-#x0EB9] | [#x0EBB-#x0EBC] | [#x0EC8-#x0ECD] | [#x0F18-#x0F19] | #x0F35 | #x0F37 | #x0F39 | #x0F3E | #x0F3F | [#x0F71-#x0F84] | [#x0F86-#x0F8B] | [#x0F90-#x0F95] | #x0F97 | [#x0F99-#x0FAD] | [#x0FB1-#x0FB7] | #x0FB9 | [#x20D0-#x20DC] | #x20E1 | [#x302A-#x302F] | #x3099 | #x309A
   [88] Digit         ::= [#x0030-#x0039] | [#x0660-#x0669] | [#x06F0-#x06F9] | [#x0966-#x096F] | [#x09E6-#x09EF] | [#x0A66-#x0A6F] | [#x0AE6-#x0AEF] | [#x0B66-#x0B6F] | [#x0BE7-#x0BEF] | [#x0C66-#x0C6F] | [#x0CE6-#x0CEF] | [#x0D66-#x0D6F] | [#x0E50-#x0E59] | [#x0ED0-#x0ED9] | [#x0F20-#x0F29]
   [89] Extender      ::= #x00B7 | #x02D0 | #x02D1 | #x0387 | #x0640 | #x0E46 | #x0EC6 | #x3005 | [#x3031-#x3035] | [#x309D-#x309E] | [#x30FC-#x30FE]
*/
const NAMESTART_REGEX11 = /[A-Za-z:_\u00C0-\u00D6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\uD800-\uDB7F\uDC00-\uDFFF]/; // The last two are for high plane

const NAMESTART_REGEX10 = /[_:\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u0131\u0134-\u013E\u0141-\u0148\u014A-\u017E\u0180-\u01C3\u01CD-\u01F0\u01F4-\u01F5\u01FA-\u0217\u0250-\u02A8\u02BB-\u02C1\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D6\u03DA\u03DC\u03DE\u03E0\u03E2-\u03F3\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E-\u0481\u0490-\u04C4\u04C7-\u04C8\u04CB-\u04CC\u04D0-\u04EB\u04EE-\u04F5\u04F8-\u04F9\u0531-\u0556\u0559\u0561-\u0586\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0641-\u064A\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D3\u06D5\u06E5-\u06E6\u0905-\u0939\u093D\u0958-\u0961\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8B\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B36-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0E01-\u0E2E\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EAE\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0F40-\u0F47\u0F49-\u0F69\u10A0-\u10C5\u10D0-\u10F6\u1100\u1102-\u1103\u1105-\u1107\u1109\u110B-\u110C\u110E-\u1112\u113C\u113E\u1140\u114C\u114E\u1150\u1154-\u1155\u1159\u115F-\u1161\u1163\u1165\u1167\u1169\u116D-\u116E\u1172-\u1173\u1175\u119E\u11A8\u11AB\u11AE-\u11AF\u11B7-\u11B8\u11BA\u11BC-\u11C2\u11EB\u11F0\u11F9\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u212E\u2180-\u2182\u3041-\u3094\u30A1-\u30FA\u3105-\u312C\uAC00-\uD7A3\u4E00-\u9FA5\u3007\u3021-\u3029]/;
const NAME_REGEX11 = /[-\.A-Za-z0-9:_\u00B7\u00C0-\u00D6\u00F8-\u02FF\u0300-\u036F\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u203F-\u2040\uD800-\uDB7F\uDC00-\uDFFF]/;
const NAME_REGEX10 = /[-\._:\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u0131\u0134-\u013E\u0141-\u0148\u014A-\u017E\u0180-\u01C3\u01CD-\u01F0\u01F4-\u01F5\u01FA-\u0217\u0250-\u02A8\u02BB-\u02C1\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D6\u03DA\u03DC\u03DE\u03E0\u03E2-\u03F3\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E-\u0481\u0490-\u04C4\u04C7-\u04C8\u04CB-\u04CC\u04D0-\u04EB\u04EE-\u04F5\u04F8-\u04F9\u0531-\u0556\u0559\u0561-\u0586\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0641-\u064A\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D3\u06D5\u06E5-\u06E6\u0905-\u0939\u093D\u0958-\u0961\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8B\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B36-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0E01-\u0E2E\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EAE\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0F40-\u0F47\u0F49-\u0F69\u10A0-\u10C5\u10D0-\u10F6\u1100\u1102-\u1103\u1105-\u1107\u1109\u110B-\u110C\u110E-\u1112\u113C\u113E\u1140\u114C\u114E\u1150\u1154-\u1155\u1159\u115F-\u1161\u1163\u1165\u1167\u1169\u116D-\u116E\u1172-\u1173\u1175\u119E\u11A8\u11AB\u11AE-\u11AF\u11B7-\u11B8\u11BA\u11BC-\u11C2\u11EB\u11F0\u11F9\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u212E\u2180-\u2182\u3041-\u3094\u30A1-\u30FA\u3105-\u312C\uAC00-\uD7A3\u4E00-\u9FA5\u3007\u3021-\u3029\u0300-\u0345\u0360-\u0361\u0483-\u0486\u0591-\u05A1\u05A3-\u05B9\u05BB-\u05BD\u05BF\u05C1-\u05C2\u05C4\u064B-\u0652\u0670\u06D6-\u06DC\u06DD-\u06DF\u06E0-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0901-\u0903\u093C\u093E-\u094C\u094D\u0951-\u0954\u0962-\u0963\u0981-\u0983\u09BC\u09BE\u09BF\u09C0-\u09C4\u09C7-\u09C8\u09CB-\u09CD\u09D7\u09E2-\u09E3\u0A02\u0A3C\u0A3E\u0A3F\u0A40-\u0A42\u0A47-\u0A48\u0A4B-\u0A4D\u0A70-\u0A71\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0B01-\u0B03\u0B3C\u0B3E-\u0B43\u0B47-\u0B48\u0B4B-\u0B4D\u0B56-\u0B57\u0B82-\u0B83\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C01-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55-\u0C56\u0C82-\u0C83\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5-\u0CD6\u0D02-\u0D03\u0D3E-\u0D43\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB-\u0EBC\u0EC8-\u0ECD\u0F18-\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86-\u0F8B\u0F90-\u0F95\u0F97\u0F99-\u0FAD\u0FB1-\u0FB7\u0FB9\u20D0-\u20DC\u20E1\u302A-\u302F\u3099\u309A\u0030-\u0039\u0660-\u0669\u06F0-\u06F9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE7-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u00B7\u02D0\u02D1\u0387\u0640\u0E46\u0EC6\u3005\u3031-\u3035\u309D-\u309E\u30FC-\u30FE]/;
/* eslint-enable max-len, max-block-comment-len */

const ENCODING = {
   UNENCODED: 'UNENCODED',
   UTF8: 'UTF-8',
   UTF8_BOM: 'UTF-8/BOM',
   UCS4BE: 'UCS-4BE',
   UCS4BE_BOM: 'UCS-4BE/BOM',
   UCS4LE: 'UCS-4LE',
   UCS4LE_BOM: 'UCS-4LE/BOM',
   UCS4UNUSUAL1: 'UCS-4UNUSUAL1',
   UCS4UNUSUAL1_BOM: 'UCS-4UNUSUAL1/BOM',
   UCS4UNUSUAL2: 'UCS-4UNUSUAL2',
   UCS4UNUSUAL2_BOM: 'UCS-4UNUSUAL2/BOM',
   UTF16BE: 'UTF-16BE',
   UTF16BE_BOM: 'UTF-16BE/BOM',
   UTF16LE: 'UTF-16LE',
   UTF16LE_BOM: 'UTF-16LE/BOM',
   EBCDIC: 'EBCDIC'
};

/**********************************************************************\
  An implementation of a cursor interface, where the source data for the
  cursor is a plain string.

  All getXxx() routines return either undefined or an XmlStringToken
  instance. An unknown return value means either that the specified item
  can not be retrieved, EOF or some other catastrophic read problem where
  reading can not procede.

  peekXxx() routines look ahead in the input stream by one character, but
  do not alter the position of the cursor.

  getToXxxx() routines return a descriptor including a possibly undefined
  token and additional meta data.
\**********************************************************************/

class XmlStringCursor {

   /**********************************************************************\
    Constructs an instance with the specified source string and entity
    info.  Note that the second parameter ultimately turns into an
    EntityMetaData instance, but various alternate parameters can be provided
    (this is so construction is as easy as possible for the caller).
    If the paramter is
       - an EntityMetaData, it is used directly (not cloned).
       - an EntityLocation, it is passed to an otherwise default-valued
         EntityMetaData instance.
       - a String, it is assumed to be the URL locating the entity this
         is processing, so is passed to an EntityLocation and then an
         EntityMetaData
       - the undefined value, it is assumed we should use the default
         location for the entity, and that is passed to an EntityLocation
         and then EntityMetaData.

    Encodings
    Handling the encoding of the XML data can get to be complex.
    Note: An unencoded string in JavaScript here is just called a
    "Unicode string" (here, an 'a' is represented as an 'a'). In
    contrast, an encoded string might represent an 'a' as '\u0000a'.

    Factors to consider:
      1. The XML entity itself may specify its own encoding in the
         XML Declaration or Text Declaration (<?xml encoding="foo"?>
      2. The cursor will try to examine the first few bytes of the
         entity to see if it can recognize at least an approximation
         of the encoding initially
      3. The cursor has an option (called encoding) which will let you
         explicitly state the encoding of the data in the string.
      4. The XmlTokenStream has an option, ignoreDocumentEncoding, which
         will tell it to not inform the cursor of the encoding specified
         in the entity data.
    Here are the most likely use cases:
      A. You have an XML entity whose data you have already decoded into
         a literal JavaScript string (e.g. you got it as a UTF-16
         encoded string or buffer, and you converted it into a plain
         unencoded string).
            In this case, pass it to the cursor, and set
            ignoreDocumentEncoding on the stream.
      B. You have a string which is encoded, and you happen to know the
         encoding (e.g. it is ISO-8859-2, whose lower 128 characters
         look ASCII or a Unicode string, so #2 above will think it is
         unencoded), and the XML document doesn't carry the encoding
         name in it.
            Pass the encoded string and encoding option to the cursor
      C. You have a string which is encoded and looks like ASCII/Unicode/
         etc), and the encoding is also stated in the XML or Text
         Declaration.
            Pass the encoded string to the cursor
      D. You have an encoded string that is in UTF-16 (either LE or BE)
         that has a byte order marker on it
            If the encoding is also in the XML/Text Decl, same as C.
            If the encoding is not, you can do either B or C
               (the cursor can identify UTF-16 automatically)
      E. Same as D, but no byte order mark.
            Strictly, this is an error, since all UTF-16 must have a
            byte order mark.  However, a lax XmlTokenStream will
            continue.
            If the encoding is in the Decl, you can do the same as C
            If the encoding is not in the Decl, do the same as B.
   Other notes:
      - If the results of #2 and #1, or #2 and #3 are obviously
         contradictory, the cursor will throw an Error (e.g. the
         cursor looks at the string (#2) and concludes it is
         ASCII/Unicode string, but the file says (#1) it is UTF-16)
      - The encoding option to the cursor (#3), if specified, takes
         precedence over the value specified in the document (#1).

    PARAM
    The string that this cursor should use.
    info: undefiend, a string (URL), EntityLocation, or an EntityMetaData
    options: An object with any one or more of the following
      encoding: The name of the encoding that the source string is in.
         Generally, you should be making sure that the string is already
         properly decoded to a normal JavaScript string. But if you have
         a string that actually contains encoded data, and you specify
         this encoding value with the name of that encoding, the cursor
         will try to decode the string before processing it.
   \**********************************************************************/

   constructor(source, info, options) {
      if (typeof source !== 'string' && !(source instanceof String)) {
         throw new Error('Must pass a string to a StringCursor.');
      }

      if (!info || typeof info === 'string') {
         info = new EntityLocation(info);
      }

      if (info instanceof EntityLocation) {
         const temp = new EntityMetaData();
         temp.location = info;
         info = temp;
      }

      if (!(info instanceof EntityMetaData)) {
         throw new Error('Must pass an EntityMetaData, or something that can become one, into XmlStringCursor.');
      }

      this._source = source;
      this._offset = new Offset(0, 0, 0);
      this._chunks = [];
      this._entityMd = info;
      this._encoding = {
         specifiedEncoding: (options || {}).encoding,
         autodetectedEncoding: this._autodetectEncoding()
      };
      this._encoding.currentEncoding = this._encoding.autodetectedEncoding;

      this._decodeSource();
   }

   get entityMd() {
      return this._entityMd;
   }

   set specifiedEncoding(value) {
      if (this._encoding.specifiedEncoding) {
         return;
      }

      this._encoding.specifiedEncoding = value;
      this._decodeSource();
   }

   // Two ways into this:
      // At startup time, in which case we may convert from what we were given to something else
      // After reading the XML Declaration. We may already have a converted (by autoconvert) so we may want to re-convert the source
         // so if we convert from the autoDetected, we need to keep the original around just in case
   _decodeSource() {
      if (this._encoding.autodetectedEncoding === ENCODING.UNENCODED &&
         this._encoding.specifiedEncoding === ENCODING.UNENCODED) {
         this._encoding.currentEncoding = ENCODING.UNENCODED;
         return;
      }

      // set BOM flag

      const canConvertToTarget = true;

      if (!this._encoding.specifiedEncoding) {
         // preserve the source. this only happens at startup time

         // We could detect no encoding or it was seen to be unencoded, assume unencoded
         if (!this._encoding.autodetectedEncoding ||
            this._encoding.autodetectedEncoding === ENCODING.UNENCODED) {
            this._encoding.currentEncoding = ENCODING.UNENCODED;
         } else {
            // Otherwise, convert the input to the encoding we discovered
            const targetEncoding = this._bestEncoding(this._encoding.autodetectedEncoding);
            if (canConvertToTarget) {
               // convert.  Deal with new offsets?
               this._encoding.currentEncoding = ENCODING.UNENCODED;
            } else {
               throw new Error('1');
            }
         }
         return;
      }

      // This only happens at startup or at setSpecifiedEncoding
      const targetEncoding = this._bestEncoding(this._encoding.specifiedEncoding);
      if (canConvertToTarget) {
         // convert.  Deal with new offsets?
         this._encoding.currentEncoding = ENCODING.UNENCODED;
      } else {
         throw new Error('2');
      }
   }

   _bestEncoding(encoding) {
      switch (encoding) {
         case ENCODING.UTF8:
         case ENCODING.UTF8_BOM:
            return ENCODING.UTF8;
         case ENCODING.UCS4BE:
         case ENCODING.UCS4BE_BOM:
            return ENCODING.UCS4BE;
         case ENCODING.UCS4BE:
         case ENCODING.UCS4BE_BOM:
            return ENCODING.UCS4BE;
         case ENCODING.UCS4LE:
         case ENCODING.UCS4LE_BOM:
            return ENCODING.UCS4LE;
         case ENCODING.UCS4LE:
         case ENCODING.UCS4LE_BOM:
            return ENCODING.UCS4LE;
         case ENCODING.UCS4UNUSUAL1:
         case ENCODING.UCS4UNUSUAL1_BOM:
            return ENCODING.UCS4UNUSUAL1;
         case ENCODING.UCS4UNUSUAL2:
         case ENCODING.UCS4UNUSUAL2_BOM:
            return ENCODING.UCS4UNUSUAL2;
         case ENCODING.UTF16BE:
         case ENCODING.UTF16BE_BOM:
            return ENCODING.UTF16BE;
         case ENCODING.UTF16LE:
         case ENCODING.UTF16LE_BOM:
            return ENCODING.UTF16LE;
      }

      return encoding;
   }



   /**********************************************************************\
    Returns the most likely type for the next token in the cursor. In some
    cases, the next token is ambiguous (e.g. is it a CHAR or a WORD or a
    STRING?). In those cases, this assumes STRING.

    RETURN
    One of the XmlStringToken constants: MARKUP, CLOSE, SPACE, or STRING.
   \**********************************************************************/

   peekType() {
      const nextChar = this._source[this._offset.index];

      if (!nextChar) {
         return;
      }

      if (nextChar === '<' || nextChar === '&') {
         return TextChunk.TYPE.MARKUP;
      } else if (this._isSpace(this._source[this._offset.index])) {
         return TextChunk.TYPE.SPACE;
      } else if (nextChar === ']') {
         return TextChunk.TYPE.CLOSE;
      } else {
         return TextChunk.TYPE.STRING;
      }
   }

   /* ---------------------------------------------------------------------*\
    Returns the next character from the string, no matter what it is.
    RETURN
    The next character in the cursor as a CHAR token.
   \*----------------------------------------------------------------------*/

   peekChar() {
      let invalidChars;
      const startOffset = this._offset.clone();
      const endOffset = this._offset.clone();
      const is1dot1 = this._entityMd.isVersion1dot1;
      let nextChar = this._source[this._offset.index];

      if (!nextChar) {
         return;
      }

      endOffset.index ++;
      endOffset.column ++;

      // Deal with section 2.11 of the standard for end of line handling
      if (nextChar === '\n' || nextChar === '\r' ||
         (is1dot1 && (nextChar === '\u0085' || nextChar === '\u2028'))) {
         endOffset.line ++;
         endOffset.column = 0;
         const nextNextChar = this._source[this._offset.index + 1];

         if (nextChar === '\r' &&
            (nextNextChar === '\n' || (is1dot1 && nextNextChar === '\u0085'))) {
            endOffset.index ++;
         }

         nextChar = '\n';
      } else {
         const charKind = util.charKind(nextChar, this.entityMd);

         if (charKind === util.CHARKIND_INVALID) {
            invalidChars = [ 0 ];
         }
      }

      const chunk = new TextChunk.PlainChunk(nextChar, startOffset, endOffset, this._entityMd.location);
      chunk.invalidChars = invalidChars;

      return chunk;
   }

   /**********************************************************************\
    RETURN
    Returns the next S in the input.  That is, the next series of spaces,
    tabs, and newlines. As per the XML standard, any \r's or \r\n's are
    converted into single \n's. Note that the unmodified version of the
    string is included in the return chunk as a property named originalText.

        [3] S ::= (#x20 | #x9 | #xD | #xA)+
   \**********************************************************************/

   getSpace() {
      let fixString = false;
      const startOffset = this._offset.clone();
      const is1dot1 = this._entityMd.isVersion1dot1;
      let nextChar = this._source[this._offset.index];

      if (!nextChar || !this._isSpace(nextChar)) {
         return;
      }

      while (nextChar && this._isSpace(nextChar)) {
         if (nextChar === '\r') {
            const nextNextChar = this._source[this._offset.index + 1];

            nextChar = '\n';

            if (nextNextChar === '\n' || (is1dot1 && nextNextChar === '\u0085')) {
               this._offset.index ++;
            }
            this._offset.line ++;
            this._offset.column = 0;
            fixString = true;
         } else if (nextChar === '\n' || (is1dot1 && (nextChar === '\u0085' || nextChar === '\u2028'))) {
            this._offset.line ++;
            this._offset.column = 0;
            fixString = true;
         } else {
            this._offset.column ++;
         }

         this._offset.index ++;
         nextChar = this._source[this._offset.index];
      }

      const originalString = this._source.substring(startOffset.index, this._offset.index);
      let rawString = originalString;

      if (fixString) {
         // Address section 2.11 (Line Ending). \r\u0085. \r\n, \r, \u0085 and \u2028 all exposed as \n
         rawString = rawString.replace(is1dot1 ? LINE_ENDING_REGEX11 : LINE_ENDING_REGEX10, '\n');
      }

      return this._makeChunkWithSpace(rawString, originalString, startOffset);
   }

   /**********************************************************************\
     Returns the next delimited substring from the current position in
     the cursor. The substring is considered to be terminated by any
     Space (see getSpace()) or any of the strings in the terminators
     array.

     This returns a text chunk that has a couldBeName property. This will
     be set to true if the word adheres to the XML rules for names.

     PARAM
     terminators: an array of strings
     RETURN
     The next word in the cursor, or undefined if there is none.
   \**********************************************************************/

   getWord(terminators) {
      this._assertValuesHaveNoSpaces(terminators);

      const startOffset = this._offset.clone();
      const atTerminator = this._makeTerminatorCheckFunction(terminators, true);
      let nextChar = this._source[this._offset.index];

      if (!nextChar || atTerminator()) {
         return;
      }

      const use11Names = this._entityMd.isVersion1dot1 ||
         (this._entityMd.isVersion1dot0 && this._entityMd.revision === 5);
      const nameStartRegEx = use11Names ? NAMESTART_REGEX11 : NAMESTART_REGEX10;
      const nameRegEx = use11Names ? NAME_REGEX11 : NAME_REGEX10;

      let couldBeName = !!nameStartRegEx.exec(nextChar);
      let couldBeNmToken = couldBeName || !!nameRegEx.exec(nextChar); // if it is a name, it is a nmtoken
      let index = this._offset.index + 1;

      while (nextChar && !atTerminator()) {
         const isNameChar = !!nameRegEx.exec(nextChar);
         couldBeName = couldBeName && isNameChar; // first time through is redundant
         couldBeNmToken = couldBeNmToken && isNameChar;
         this._offset.index ++;
         this._offset.column ++;

         nextChar = this._source[index];
         index++;
      }

      const rawString = this._source.substring(startOffset.index, index - 1);
      return this._makeWordChunk(rawString, couldBeName, couldBeNmToken, startOffset);
   }

   /**********************************************************************\
     Returns the next delimited substring from the current position in
     the cursor. The substring is considered to be terminated by any
     Space (see getSpace()) or any of the strings in the terminators
     array.

     This returns a text chunk that has a couldBeName property. This will
     be set to true if the word adheres to the XML rules for names.

     PARAM
     terminators: an array of strings
     RETURN
     The next word in the cursor, or undefined if there is none.
   \**********************************************************************/

   getDigits() {
      const startOffset = this._offset.clone();
      let isDecimal = true;
      let type = this._nextCharDigitType();

      if (!type) {
         return;
      }

      do {
         isDecimal = isDecimal && (type === DECIMAL);
         this._offset.index ++;
         this._offset.column ++;
         type = this._nextCharDigitType();
      } while (type);

      const rawString = this._source.substring(startOffset.index, this._offset.index);
      return this._makeDigitChunk(rawString, isDecimal, startOffset);
   }

   /**********************************************************************\
     RETURN
     Returns the next character from the cursor.  Like peekChar(), this
     does not care what that character is. Thus, < and any S is returned
     as readily as any other character. Note, however, that this does
     do line-ending normalization automatically.
   \**********************************************************************/

   getChar() {
      const chunk = this.peekChar();

      if (!chunk) {
         return;
      }

      this._offset = chunk.endOffset.clone();
      this._chunks.push(chunk);

      return chunk;
   }

   /**********************************************************************\
    getClose() returns the close character from the input stream.

    RETURN
    A TextChunk chunk containing "]" or "]]>", or undefined if no close is
    at the current position
   \**********************************************************************/

   getClose() {
      const startOffset = this._offset.clone();
      const firstChar = this._source[this._offset.index];
      const secondChar = this._source[this._offset.index + 1];
      const thirdChar = this._source[this._offset.index + 2];

      if (!firstChar || firstChar !== ']') {
         return;
      }

      this._offset.index ++;
      this._offset.column ++;

      if (firstChar === ']' && secondChar === ']' && thirdChar === '>') {
         this._offset.index += 2;
         this._offset.column += 2;
      }

      const rawString = this._source.substring(startOffset.index, this._offset.index);
      return this._makePlainChunk(rawString, startOffset);
   }

   /**********************************************************************\
     RETURN
     A TextChunk token if the next characters in the cursor are the opening
     of some markup (<, <? <!, </,  <!-- or &) or undefined (if the current
     cursor position has no markup)
   \**********************************************************************/

   getMarkup() {
      const startOffset = this._offset.clone();
      const firstChar = this._source[this._offset.index];
      const secondChar = this._source[this._offset.index + 1];

      if (!firstChar || (firstChar !== '<' && firstChar !== '&')) {
         return;
      }

      this._offset.index ++;
      this._offset.column ++;

      if (firstChar === '<' && (secondChar === '?' || secondChar === '!' || secondChar === '/')) {
         this._offset.index ++;
         this._offset.column ++;

         if (secondChar === '!' &&
            this._source[this._offset.index] === '-' &&
            this._source[this._offset.index + 1] === '-') {
            this._offset.index += 2;
            this._offset.column += 2;
         }
      }

      const rawString = this._source.substring(startOffset.index, this._offset.index);
      return this._makePlainChunk(rawString, startOffset);
   }

   /**********************************************************************\
     PARAM
     toMatch: The string value to match at the current position in
     the cursor. This may not contain any whitespace.

     RETURN
     Gets a TextChunk that contains the exact string passed in as a
     parameter. In this process, the cursor is advanced past this value.
     If this value is not at the current cursor position, this returns
     undefined.
   \**********************************************************************/

   getMatch(toMatch) {
      if (!toMatch || toMatch === '') {
         throw new Error('Must pass a non-empty string to getMatch().');
      }
      this._assertValuesHaveNoSpaces([ toMatch ], 'Parameter to getMatch() may not contain any whitespace characters.');

      if (this._source.substr(this._offset.index, toMatch.length) !== toMatch) {
         return;
      }

      const startOffset = this._offset.clone();

      const rawString = this._source.substr(startOffset.index, toMatch.length);
      this._offset.index += rawString.length;
      this._offset.column += rawString.length;

      return this._makePlainChunk(rawString, startOffset);
   }

   /**********************************************************************\
     Returns all characters from the cursor up to the first of the strings
     specified in the input.

     For example, if this is passed [ '<', '&' ] and the cursor has
        "this is an example<name>&value;
     this will return the string "this is an example", with the terminator
     of '<'.

     Any \r's in the input will be converted (see the doc for getSpace()).
     Like that routine, this will return the unmodified original input
     string on the chunk in a property called originalText.

     PARAM
     An array of 1 or more strings that could terminate the string.

     RETURN
     An object with two properties. "chunk" includes all characters from
     the current position in the cursor up to, but not including, the
     first termination string found in the input. If the cursor is not at
     one of those terminators, this will be undefined. Similarly, if at
     EOF, this chunk will also be undefined. "terminator" is whiever
     terminator was found to terminate the input string. This will be
     undefined if at EOF.
   \**********************************************************************/

   getToTerminator(terminators) {
      if (!terminators || terminators.length === 0) {
         throw new Error('Must pass a non-empty array of terminators to getToTerminator().');
      }
      this._assertValuesHaveNoSpaces(terminators);

      const atTerminator = this._makeTerminatorCheckFunction(terminators, false);
      const startOffset = this._offset.clone();
      let nextChar = this._source[this._offset.index];
      let terminator;

      terminator = atTerminator();
      if (!nextChar || terminator) {
         return {
            chunk: undefined,
            terminator: terminator
         };
      }

      let index = this._offset.index + 1;

      while (nextChar && !terminator) {
         this._offset.index ++;
         this._offset.column ++;

         nextChar = this._source[index];
         terminator = atTerminator();
         index++;
      }

      const originalString = this._source.substring(startOffset.index, this._offset.index);
      let rawString = originalString;
      const regex = this._entityMd.isVersion1dot1 ? LINE_ENDING_REGEX11 : LINE_ENDING_REGEX10;
      let ctr = 0;
      let lineCount = 0;
      let lengthToEnd = rawString.length;

      if (regex.exec(rawString)) {
         rawString = rawString.replace(regex, '\n');

         while (ctr !== -1) {
            ctr = rawString.indexOf('\n', ctr);
            if (ctr !== -1) {
               ctr++; // skip over the match
               lineCount++;
               lengthToEnd = rawString.length - ctr;
            }
         }
      }

      // change the offset based on line endings we found in the string
      if (lineCount > 0) {
         this._offset.line += lineCount;
         this._offset.column = lengthToEnd - 1; // length to index
      }

      return {
         chunk: this._makeChunkWithSpace(rawString, originalString, startOffset),
         terminator: terminator
      };
   }

   /**********************************************************************\
     unget() backs the cursor up past the specified chunk.  That chunk
     must have been the most recent chunk returned by this cursor, and
     it must be called before getRecentChunks() has been called.
     Note that if this cursor has returned A, B, C, you can call unget(C),
     unget(B), unget(A).

     Note: This could actually operate without the parameter. However,
     this signature makes it more explicit in the client code what is
     happening, and provides some error reporting in case the user is
     confused.

     PARAM
     chunk the most recent chunk returned
   \**********************************************************************/

   unget(chunk) {
      // validate that this is the most recent chunk returned
      if (this._chunks.length === 0 || this._chunks[this._chunks.length - 1] !== chunk) {
         throw new Error('Chunk passed to unget() is not the most recent chunk returned.');
      }

      this._chunks.length = this._chunks.length - 1;
      this._offset = chunk.startOffset.clone();
   }

   /**********************************************************************\
     RETURN
     All the chunks generated since the last time this routine was called.
   \**********************************************************************/

   getRecentChunks() {
      const temp = this._chunks;
      this._chunks = [];

      return temp;
   }

   /**********************************************************************\
     PARAM
     a single character string

     RETURN
     True if this character is one of the possible space characters in input.
   \**********************************************************************/

   _isSpace(aChar) {
      const base = aChar === ' ' || aChar === '\t' || aChar === '\n' || aChar === '\r';

      if (this._entityMd.isVersion1dot0) {
         return base;
      }

      return base || aChar === '\u0085' || aChar === '\u2028';
   }

   /**********************************************************************\
     PARAM
     terminators: An array of strings that could be considered terminators
     checkSpace: true if we should also check for whitespace as terminator

     RETURN
     A function that will return undefined if the cursor is not at one of
     the specified terminators, and otherwise return the terminator that
     the cursor is at.
     A function is returned so that a pre-calculation to make the check
     more efficient is done first.
   \**********************************************************************/

   _makeTerminatorCheckFunction(terminators, checkSpace) {
      let maxLen = 0;
      const self = this;

      for (let index = 0; index < terminators.length; index++) {
         const len = terminators[index].length;
         if (maxLen < len) {
            maxLen = len;
         }
      }

      return function atTerminator() {
         if (checkSpace && self._isSpace(self._source[self._offset.index])) {
            return self._source[self._offset.index];
         }

         const nextSeg = self._source.substr(self._offset.index, maxLen);

         for (let index = 0; index < terminators.length; index++) {
            if (nextSeg.indexOf(terminators[index]) === 0) {
               return terminators[index];
            }
         }
      };
   }

   /**********************************************************************\
     RETURN
     DECIMAL if the next character in the cursor is 0-9, HEX if it is
     A-Fa-f, and undefined otherwise.
   \**********************************************************************/

   _nextCharDigitType() {
      switch (this._source[this._offset.index]) {
         case '0':
         case '1':
         case '2':
         case '3':
         case '4':
         case '5':
         case '6':
         case '7':
         case '8':
         case '9':
            return DECIMAL;
         case 'A':
         case 'a':
         case 'B':
         case 'b':
         case 'C':
         case 'c':
         case 'D':
         case 'd':
         case 'E':
         case 'e':
         case 'F':
         case 'f':
            return HEX;
         default:
            return;
      }
   }

   /**********************************************************************\
     PARAM
     values: An array of values to examine
     message: An optional message to include in error message

     RETURN
     none

     THROWS
     Error if any terminators have space in them
   \**********************************************************************/

   _assertValuesHaveNoSpaces(values, message) {
      for (const index in values) {
         const value = values[index];

         for (let ctr = 0; ctr < value.length; ctr++) {
            if (this._isSpace(value[ctr])) {
               throw new Error(message || 'Terminators may not have any space characters (space, tab, newline, etc).');
            }
         }
      }
   }

   /**********************************************************************\
     PARAM
     values: An array of values to examine
     message: An optional message to include in error message

     RETURN
     none

     THROWS
     Error if any terminators have space in them
   \**********************************************************************/

   _autodetectEncoding() {
      const firstFour = this._source.substr(0, 4);

      switch (firstFour) {
         case '<?xm':
            return ENCODING.UNENCODED;
         case '\u004C\u006F\u00A7\u0094':
            return ENCODING.EBCDIC;
         case '\u0000\u003C\u0000\u003F':
            return ENCODING.UTF16BE;
         case '\u003C\u0000\u003F\u0000':
            return ENCODING.UTF16LE;
         case '\u0000\u0000\u0000\u003C':
            return ENCODING.UCS4BE;
         case '\u003C\u0000\u0000\u0000':
            return ENCODING.UCS4LE;
         case '\u0000\u0000\u003C\u0000':
            return ENCODING.UCS4UNUSUAL1;
         case '\u0000\u003C\u0000\u0000':
            return ENCODING.UCS4UNUSUAL2;
         case '\u0000\u0000\u00FE\u00FF':
            return ENCODING.UCS4BE_BOM;
         case '\u0000\u0000\u00FF\u00FE':
            return ENCODING.UCS4UNUSUAL1_BOM;
      }

      if (firstFour[0] === '\u00FE' && firstFour[1] === '\u00FF') {
         if (firstFour[2] !== '\u0000' || firstFour[3] !== '\u0000') {
            return ENCODING.UTF16BE_BOM;
         } else { // both second bytes are 0
            return ENCODING.UCS4UNUSUAL2_BOM;
         }
      }

      if (firstFour[0] === '\u00FF' && firstFour[1] === '\u00FE') {
         if (firstFour[2] !== '\u0000' || firstFour[3] !== '\u0000') {
            return ENCODING.UTF16LE_BOM;
         } else {
            return ENCODING.UCS4LE_BOM;
         }
      }

      if (firstFour[0] === '\u00EF' && firstFour[1] === '\u00BB' && firstFour[2] === '\u00BF') {
         return ENCODING.UTF8_BOM;
      }
   }

   /**********************************************************************\
     PARAM
     data for a chunk, the unmodified data, and the start offset.

     RETURN
     a with space chunk using the parameters and the current cursor offset.
     Note this also pushes the chunk into the set of recent chunks.
   \**********************************************************************/

   _makeChunkWithSpace(data, originalString, startOffset) {
      const chunk = new TextChunk.WithSpaceChunk(data, originalString, startOffset, this._offset.clone(),
         this._entityMd.location);
      this._chunks.push(chunk);
      return chunk;
   }

   /**********************************************************************\
     PARAM
     data for a chunk, and the start of the string's offset.

     RETURN
     a plain chunk using the parameters and the current cursor offset.
     Note this also pushes the chunk into the set of recent chunks.
   \**********************************************************************/

   _makePlainChunk(data, startOffset) {
      const chunk = new TextChunk.PlainChunk(data, startOffset, this._offset.clone(), this._entityMd.location);
      this._chunks.push(chunk);
      return chunk;
   }

   /**********************************************************************\
     PARAM
     data for a word chunk, whether it could be a name, and the start offset.
     couldBeName boolean flag could this be a name (production 5)
     couldBeNmToken boolean flag could this be a nmtoken (production 7)
     startOffset Offset data structure where this word started

     RETURN
     a word chunk using the parameters and the current cursor offset.
     Note this also pushes the chunk into the set of recent chunks.
   \**********************************************************************/

   _makeWordChunk(data, couldBeName, couldBeNmToken, startOffset) {
      const chunk = new TextChunk.WordChunk(data, couldBeName, couldBeNmToken, startOffset, this._offset.clone(),
         this._entityMd.location);
      this._chunks.push(chunk);
      return chunk;
   }

   /**********************************************************************\
     PARAM
     data for a number chunk, whether it is decimal, and the start offset.

     RETURN
     a number chunk using the parameters and the current cursor offset.
     Note this also pushes the chunk into the set of recent chunks.
   \**********************************************************************/

   _makeDigitChunk(data, isDecimal, startOffset) {
      const chunk = new TextChunk.DigitChunk(data, isDecimal, startOffset, this._offset.clone(),
         this._entityMd.location);
      this._chunks.push(chunk);
      return chunk;
   }

}

module.exports = XmlStringCursor;

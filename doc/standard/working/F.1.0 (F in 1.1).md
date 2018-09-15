## F.1 Detection Without External Encoding Information

> **1.1/1: Modified** "E.1"

Because each XML entity not accompanied by external encoding information and not in UTF-8 or UTF-16 encoding must begin with an XML encoding declaration, in which the first characters must be '<?xml', any conforming processor can detect, after two to four octets of input, which of the following cases apply. In reading this list, it may help to know that in UCS-4, '<' is "#x0000003C" and '?' is "#x0000003F", and the Byte Order Mark required of UTF-16 data streams is "#xFEFF". The notation ## is used to denote any byte value except that two consecutive ##s cannot be both 00.

With a Byte Order Mark:

|   |     |
|-----|---|
| 00 00 FE FF	| UCS-4, big-endian machine (1234 order) |
| FF FE 00 00	| UCS-4, little-endian machine (4321 order) | 
| 00 00 FF FE| 	UCS-4, unusual octet order (2143)
| FE FF 00 00| 	UCS-4, unusual octet order (3412)
| FE FF ## ##	| UTF-16, big-endian
| FF FE ## ##	| UTF-16, little-endian
| EF BB BF	| UTF-8

Without a Byte Order Mark:

|   |   |
|---|---|
|00 00 00 3C	|
|3C 00 00 00|
|00 00 3C 00|
| 00 3C 00 00 | UCS-4 or other encoding with a 32-bit code unit and ASCII characters encoded as ASCII values, in respectively big-endian (1234), little-endian (4321) and two unusual byte orders (2143 and 3412). The encoding declaration must be read to determine which of UCS-4 or other supported 32-bit encodings applies. |
|00 3C 00 3F	|UTF-16BE or big-endian ISO-10646-UCS-2 or other encoding with a 16-bit code unit in big-endian order and ASCII characters encoded as ASCII values (the encoding declaration must be read to determine which)|
|3C 00 3F 00	|UTF-16LE or little-endian ISO-10646-UCS-2 or other encoding with a 16-bit code unit in little-endian order and ASCII characters encoded as ASCII values (the encoding declaration must be read to determine which)|
|3C 3F 78 6D	|UTF-8, ISO 646, ASCII, some part of ISO 8859, Shift-JIS, EUC, or any other 7-bit, 8-bit, or mixed-width encoding which ensures that the characters of ASCII have their normal positions, width, and values; the actual encoding declaration must be read to detect which of these applies, but since all of these encodings use the same bit patterns for the relevant ASCII characters, the encoding declaration itself may be read reliably |
|4C 6F A7 94	|EBCDIC (in some flavor; the full encoding declaration must be read to tell which code page is in use)|
|Other	|UTF-8 without an encoding declaration, or else the data stream is mislabeled (lacking a required encoding declaration), corrupt, fragmentary, or enclosed in a wrapper of some kind|

Note:

In cases above which do not require reading the encoding declaration to determine the encoding, section 4.3.3 still requires that the encoding declaration, if present, be read and that the encoding name be checked to match the actual encoding of the entity. Also, it is possible that new character encodings will be invented that will make it necessary to use the encoding declaration to determine the encoding, in cases where this is not required at present.

This level of autodetection is enough to read the XML encoding declaration and parse the character-encoding identifier, which is still necessary to distinguish the individual members of each family of encodings (e.g. to tell UTF-8 from 8859, and the parts of 8859 from each other, or to distinguish the specific EBCDIC code page in use, and so on).

Because the contents of the encoding declaration are restricted to characters from the ASCII repertoire (however encoded), a processor can reliably read the entire encoding declaration as soon as it has detected which family of encodings is in use. Since in practice, all widely used character encodings fall into one of the categories above, the XML encoding declaration allows reasonably reliable in-band labeling of character encodings, even when external sources of information at the operating-system or transport-protocol level are unreliable. Character encodings such as UTF-7 that make overloaded usage of ASCII-valued bytes may fail to be reliably detected.

Once the processor has detected the character encoding in use, it can act appropriately, whether by invoking a separate input routine for each case, or by calling the proper conversion function on each character of input.

Like any self-labeling system, the XML encoding declaration will not work if any software changes the entity's character set or encoding without updating the encoding declaration. Implementors of character-encoding routines should be careful to ensure the accuracy of the internal and external information used to label the entity.



### Appendix: Standards
* 1.0/2: https://www.w3.org/TR/2000/REC-xml-20001006#sec-guessing-no-ext-info
* 1.0/3: https://www.w3.org/TR/2004/REC-xml-20040204/#sec-guessing-no-ext-info
* 1.0/4: https://www.w3.org/TR/2006/REC-xml-20060816/#sec-guessing-no-ext-info
* 1.0/5: https://www.w3.org/TR/xml/#sec-guessing-no-ext-info
* 1.1/1: https://www.w3.org/TR/2004/REC-xml11-20040204/#sec-guessing-no-ext-info
* 1.1/2: https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-guessing-no-ext-info
* 1.1/3: https://www.w3.org/XML/xml-V11-2e-errata



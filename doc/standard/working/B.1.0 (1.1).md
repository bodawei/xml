## B Definitions for Character Normalization

This appendix contains the necessary definitions for character normalization. For additional background information and examples, see [Charmod].

[Definition: Text is said to be in a Unicode encoding form if it is encoded in UTF-8, UTF-16 or UTF-32.]

[Definition: Legacy encoding is taken to mean any character encoding not based on Unicode.]

[Definition: A normalizing transcoder is a transcoder that converts from a legacy encoding to a Unicode encoding form and ensures that the result is in Unicode Normalization Form C (see UAX #15 [Unicode]).]

[Definition: A character escape is a syntactic device defined in a markup or programming language that allows one or more of:]

1. expressing syntax-significant characters while disregarding their significance in the syntax of the language, or

2. expressing characters not representable in the character encoding chosen for an instance of the language, or

3. expressing characters in general, without use of the corresponding character codes.

[Definition: Certified text is text which satisfies at least one of the following conditions:]

1. it has been confirmed through inspection that the text is in normalized form

2. the source text-processing component is identified and is known to produce only normalized text.

[Definition: Text is, for the purposes of this specification, Unicode-normalized if it is in a Unicode encoding form and is in Unicode Normalization Form C, according to a version of Unicode Standard Annex #15: Unicode Normalization Forms [Unicode] at least as recent as the oldest version of the Unicode Standard that contains all the characters actually present in the text, but no earlier than version 3.2.]

[Definition: Text is include-normalized if:]

1. the text is Unicode-normalized and does not contain any character escapes or includes whose expansion would cause the text to become no longer Unicode-normalized; or

2. the text is in a legacy encoding and, if it were transcoded to a Unicode encoding form by a normalizing transcoder, the resulting text would satisfy clause 1 above.

[Definition: A composing character is a character that is one or both of the following:]

1. the second character in the canonical decomposition mapping of some primary composite (as defined in D3 of UAX #15 [Unicode]), or

2. of non-zero canonical combining class (as defined in Unicode [Unicode]).

[Definition: Text is fully-normalized if:]

1. the text is in a Unicode encoding form, is include-normalized and none of the relevant constructs comprising the text begin with a composing character or a character escape representing a composing character; or

2. the text is in a legacy encoding and, if it were transcoded to a Unicode encoding form by a normalizing transcoder, the resulting text would satisfy clause 1 above.




### Appendix: Standards

* 1.1/1: https://www.w3.org/TR/2004/REC-xml11-20040204/#sec-CharNorm
* 1.1/2: https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-CharNorm
* 1.1/3: https://www.w3.org/XML/xml-V11-2e-errata

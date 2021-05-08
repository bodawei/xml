# XToken

## Purpose
This system provides tools to convert PTokens into a simpler format, creatively called XTokens.
An XToken discards all but the most essential information from the corresponding PToken.

For example:
* STokens are presented as strings (the final value, not the orignal value)
* Things like quotes around literals and spaces between parts are not represented explicitly in XTokens.
* Things like `<!NOTATION` are explictily included represented either.

The intent is that if you do not need the detailed information about the original XML document, but simply want to do some kind of manipulation of the XML information, this formt should make it considerably easier to do this.

## Design standards
1. XToken constructors do not do wellformed or validity checks on parameters.  Thus, if you construct one with an invalid XML name, for example, it will accept the value.
2. Missing string values are represented as `""`, not as `undefined`
* If an XToken is constructed from a PToken, that PToken is attached to the XToken as a `.pToken` property.
* Except for the PToken property, all XToken properties are readonly.
* Any kind of entity value is represented as a series of strings and (if they have not been expanded) ParemterEntityReferences.
* Arrays are always present, with 0 elements. Thus, in some cases, it is ambiguous whether a literal was present and empty or was not present.
* Properties with fixed value (e.g. the attribute type in AttListDeclarations) will be converted to an enumerated value. If an invalid value is present in a PToken, then a default value will be inserted into the XToken. No error will be generated (if you care about errors, the Wellformed system will have reported it)

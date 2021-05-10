# XToken

## Purpose
PTokens contain detailed data about the syntactic units of an XML document. That detail makes them cumbersome to work with, and for some purposes that much detail is unneessary.

This system provides tools to convert PTokens into XTokens which are lean representations of the same syntactic units.  For example, this is the PToken for `<doc>`

```json
{
   "type": "ELEMENT_START_PTOKEN",
   "attributes": [],
   "open": {
      "str": "<",
      "originalStr": "<",
      "ranges": [
         {
            "entityId": {
               "type": "ENTITY_ID",
               "systemId": ""
            },
            "startIndex": 134,
            "startRow": 5,
            "startColumn": 6,
            "endIndex": 135,
            "endRow": 5,
            "endColumn": 7
         }
      ]
   },
   "name": {
      "str": "doc",
      "originalStr": "doc",
      "ranges": [
         {
            "entityId": {
               "type": "ENTITY_ID",
               "systemId": ""
            },
            "startIndex": 135,
            "startRow": 5,
            "startColumn": 7,
            "endIndex": 138,
            "endRow": 5,
            "endColumn": 10
         }
      ]
   },
   "close": {
      "str": ">",
      "originalStr": ">",
      "ranges": [
         {
            "entityId": {
               "type": "ENTITY_ID",
               "systemId": ""
            },
            "startIndex": 138,
            "startRow": 5,
            "startColumn": 10,
            "endIndex": 139,
            "endRow": 5,
            "endColumn": 11
         }
      ]
   }
}
```
And this is the XToken for the same `<doc>`:

```json
{
   "type": "ELEMENT_START_XTOKEN",
   "name": "doc",
   "attributes": [],
}
```

Examples of the differences include:

* There are no STokens, and thus no record of the original tex or the position of the text fragment in the original document
* Things like quotes around literals and spaces between parts are not represented explicitly in XTokens.
* Things like `<!NOTATION` are not explicitly represented either.

The intent is that if you do not need the detailed information about the original XML document, this formt should make it considerably easier to do this kind of work.

## Exported information

### Functions

* `convertPTokenToXToken(source: ParseValue): XToken`
   * As it says, this takes a PToken and returns an XToken representation.
   * Crucially, despite what the types say, if you put some other value in, that value will be returned unchanged. This allows for extensibility (e.g. adding another processor that feeds new kinds of tokens into a stream that feeds to this).

### Types
* `XToken` A union of all the types this will produce. This includes things like errors and conformance version types that are known to come from things like the pToken processor that this does not alter.

### XTokens

Like PTokens, the constructors here generate objects with no methods. As such, you can create a literal XToken "by hand" with no loss of fidelity (and so you can build other XTokens using patterns like: `{ ...oldXTken, newProp: newValue }`.

| XToken constructor | XToken type | PToken  | XML Data |
|--|--|--|--|
| `AttListDeclarationXToken`| `ATTLIST_DECLARATION_XTOKEN` | `AttListDeclarationPToken` | `<!ATTLIST ... >` |
| `CDataXToken`| `CDATA_SECTION_XTOKEN` | `CdataPToken` | `<![CDATA[...]]>` |
| `CharDataXToken`| `CHARDATA_XTOKEN` | `CharDataPToken` | `text` |
| `CharRefXToken`| `CHARREF_XTOKEN` | `CharRefPToken` | `&#65;` |
| `CommentXToken`| `COMMENT_XTOKEN` | `CommentPToken` | `<!-- comment -->` |
| `ConditionalEndXToken`| `CONDITIONAL_SECTION_END_XTOKEN` | `ConditionalEndPToken` | `]]>` |
| `ConditionalStartXToken`| `CONDITIONAL_SECTION_START_XTOKEN` | `ConditionalStartPToken` | `<[ INCLUDE [` |
| `DocTypeEndXToken`| `DOCTYPE_END_XTOKEN` | `DocTypeEndPToken` | `]>` |
| `DocTypeStartXToken`| `DOCTYPE_START_XTOKEN` | `DocTypeStartPToken` | `<!DOCTYPE foo [` |
| `ElementDeclarationXToken`| `ELEMENT_DECLARATION_XTOKEN` | `ElementDeclarationPToken` | `<!ELEMENT ... >` |
| `ElementEmptyXToken`| `ELEMENT_EMPTY_XTOKEN` | `ElementEmptyPToken` | `<MyElement/>` |
| `ElementEndXToken`| `ELEMENT_END_XTOKEN` | `ElementEndPToken` | `</MyElement>` |
| `ElementStartXToken`| `ELEMENT_START_XTOKEN` | `ElementStartPToken` | `<MyElement>` |
| `GeneralEntityEndXToken`| `GENERAL_ENTITY_END_XTOKEN` | `GeneralEntityEndPToken` | n/a |
| `GeneralEntityStartXToken`| `GENERAL_ENTITY_START_XTOKEN` | `GeneralEntityStartPToken` | n/a |
| `GeneralEntityDeclarationXToken`| `GENERAL_ENTITY_DECLARATION_XTOKEN` | `GeneralEntityDeclarationPToken` | `<!ENTITY ...` |
| `GeneralEntityReferenceXToken`| `GENERAL_ENTITY_REFERENCE_XTOKEN` | `GeneralEntityReferencePToken` | `&entity;` |
| `NotationDeclarationXToken`| `NOTATION_DECLARATION_XTOKEN` | `NotationDeclarationPToken` | `<!NOTATION ... >` |
| `ParameterEntityEndXToken`| `PARAMETER_ENTITY_END_XTOKEN` | `ParameterEntityEndPToken` | n/a |
| `ParameterEntityStartXToken`| `PARAMETER_ENTITY_START_XTOKEN` | `ParameterEntityStartToken` | n/a |
| `ParamterEntityDeclarationXToken`| `PARAMETER_ENTITY_DECLARATION_XTOKEN` | `ParamterEntityDeclarationPToken` | `<!ENTITY % ...` |
| `ParamterEntityReferenceXToken`| `PARAMETER_ENTITY_REFERENCE_XTOKEN` | `ParamterEntityReferencePToken` | `%entity;` |
| `ProcessingInstructionXToken`| `PROCESSING_INSTRUCTION_XTOKEN` | `ProcessingInstructionPToken` | `<?name instruction?>` |
| `SpaceXToken`| `SPACE_XTOKEN` | `SpacePToken` | `   ` |
| `TextXToken`| `TEXT_XTOKEN` | `TextPToken` | `text` |
| `TextDeclarationXToken`| `TEXTDECL_XTOKEN` | `TextDeclarationPToken` | `<?xml ... ?>` |
| `UnknownDeclarationXToken`| `UNKNOWN_DECLARATION_XTOKEN` | `...` | `<!BOGUS ... >` |
| `XmlDeclarationXToken`| `XMLDECL_XTOKEN` | `XmlDeclarationPToken` | `<?xml ... ?>` |

### Notes about conversion
Some assumptions are made when converting PTokens to XTokens:

* `AttListDeclarationXToken`
   * An unknown/erronious `type` in the PToken is marked as `CDATA` in the XToken
   * An unknown/erronious `defaultType` in the PToken is represented as `undefined` in the XToken
   * Like the PToken, an attribute definition with an enumerated value is given the type `ENUMERATION`.
* `ElementDeclarationXToken`
   * The content spec will be set to `ANY` if another can not be identified
   * The `#PCDATA` will be capitalized and moved to the start of the list of "names" if the content model is identified as a `MIXED` type.
      * Note that if the `contentModel` is not a simple list of names, but contains `#PCDATA` that will remain unaltered.
   * If the content model PToken has inconsistent delimiters (that is, `|` and `,`), the XToken conversion will use the first such delimiter in each `()`"ed group to specify the `listType` for that whole group. 
   * If the content model PToken has an unknown repeat value, then the XToken will have `ONE`.
* `TextDeclarationXToken` and `XmlDeclarationXToken`
   * A version that isn't `1.0` or `1.1` is assumed to be `1.0`
   * A standalone value that is not `yes` or `no` will be treated as `no`

## Design standards
1. XToken constructors do not do wellformed or validity checks on parameters.  Thus, if you construct one with an invalid XML name, for example, it will accept the value.
2. Missing string values are represented as `""`, not as `undefined`
* If an XToken is constructed from a PToken, that PToken is attached to the XToken as a `.pToken` property.
* Except for the PToken property, all XToken properties are readonly.
* Any kind of entity value is represented as a series of strings and (if they have not been expanded) ParemterEntityReferences.
* Arrays are always present, with 0 elements. Thus, in some cases, it is ambiguous whether a literal was present and empty or was not present.
* Properties with fixed value (e.g. the attribute type in AttListDeclarations) will be converted to an enumerated value. If an invalid value is present in a PToken, then a default value will be inserted into the XToken. No error will be generated (if you care about errors, the Wellformed system will have reported it)
* All properties are added by the XToken constructors.
   * Arrays are always present, but may be empty
   * A few properties are allowed to be set to `undefined` when they are optional (e.g. `notationDatanName` in a general entity declaration) 
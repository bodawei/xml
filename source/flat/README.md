# Flat

## Purpose
There are various circumstances one may want to turn aa set of PTokens back into a textual format.
The "Flat" system provides functions that convert each PToken into an array of STokens arranged in the same order they would originally have been parsed.
(The name comes from the vague analogy with the process of flattening an array containing other arrays into a single array).
One posessed of this array of STokens, one can extract the textul values from each.

This is likely most useful to perform partial or complete "round-trip" transformations (e.g. parsing an XML document, altering it, and then writing back out an XML Document).

These functions report whatever they are given, thus if expansion has happened what comes out will be the expanded versions.

## Exported information

### Functions

* `convertPTokenToSTokens(source: ParseValue): Array<SToken>`
   * As it says, this takes a PToken and returns a mutable array of STokens.
   * Any non-PToken (e.g. an Error, or a ConformanceVersion) will result in an empty array being returned

| Individual function | PToken  | XML Data |
|--|--|--|--|
| `attListDeclarationToSTokens()` | `AttListDeclarationPToken` | `<!ATTLIST ... >` |
| `cdataToSTokens()` | `CdataPToken` | `<![CDATA[...]]>` |
| `charDataToSTokens()` | `CharDataPToken` | `text` |
| `charRefToSTokens()` | `CharRefPToken` | `&#65;` |
| `commentToSTokens()` | `CommentPToken` | `<!-- comment -->` |
| `conditionalEndToSTokens()` | `ConditionalEndPToken` | `]]>` |
| `conditionalStartToSTokens()` | `ConditionalStartPToken` | `<[ INCLUDE [` |
| `docTypeEndToSTokens()` | `DocTypeEndPToken` | `]>` |
| `docTypeStartToSTokens()` | `DocTypeStartPToken` | `<!DOCTYPE foo [` |
| `elementDeclarationToSTokens()` | `ElementDeclarationPToken` | `<!ELEMENT ... >` |
| `elementEndToSTokens()` | `ElementEndPToken` | `</MyElement>` |
| `elementStartToSTokens()` | `ElementStartPToken`<br>`ElementEmptyPToken` | `<MyElement>` |
| n/a | `GeneralEntityEndPToken` | n/a |
| n/a | `GeneralEntityStartPToken` | n/a |
| `generalEntityDeclarationToSTokens()` | `GeneralEntityDeclarationPToken` | `<!ENTITY ...` |
| `generalEntityReferenceToSTokens()` | `GeneralEntityReferencePToken` | `&entity;` |
| `notationDeclarationToSTokens()` | `NotationDeclarationPToken` | `<!NOTATION ... >` |
| n/a | `ParameterEntityEndPToken` | n/a |
| n/a | `ParameterEntityStartToken` | n/a |
| `parameterEntityDeclarationToSTokens()` | `ParamterEntityDeclarationPToken` | `<!ENTITY % ...` |
| `parameterEntityReferenceToSTokens()` | `ParamterEntityReferencePToken` | `%entity;` |
| `processingInstructionToSTokens()` | `ProcessingInstructionPToken` | `<?name instruction?>` |
| `spaceToSTokens()` | `SpacePToken` | `   ` |
| `textDeclarationToSTokens()` | `TextPToken` | `text` |
| `textToSTokens()` | `TextDeclarationPToken` | `<?xml ... ?>` |
| `unknownDeclarationToSTokens()` | `...` | `<!BOGUS ... >` |
| `xmlDeclarationToSTokens()` | `XmlDeclarationPToken` | `<?xml ... ?>` |

## Design standards
1. All the converter functions use `STokenArrayBuilder` to help make sure the returned arrays have no undefined values in them.
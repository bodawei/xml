# PToken

This subsystem is responsible for taking an STokenSource and parsing the text from that into PTokens.  A PToken, is essentially the same as a node in an AST. That is, it is an object which contains the chunks of text that describe a syntactic unit, along with metadata about it.

Note: The "P" in PToken stands for "Parsed".

## Design philosophy

Each syntacic unit is parsed by a separate routine. So, for example, the `ElementStartPToken` represents an XML element start tag, and the corresponding `parseElementStart()` routine takes an STokenSource and tries to retrieve an `ElementStartPToken`.

In general, the individual parse routines are called by the main `parsePToken()` function. This keeps enough state to select which parsing routine to call next, and to resolve ambiguities.

It is expected some external system will be used to call `parsePToken()`. For example, it may be called from a node.js stream, or something else. The point being that the `pToken` system makes no assumptions about the highest level that is driving the processing.

It is important to note that this processing system does not use promises.

### Bad input
However, none of the parsing routines are doing anything but the most basic syntax checks. Whenever possible, the PToken types and the corresponding parsers strive to be as accepting of sloppy or incorrect syntax as possible.  For example, the XML specification requires no space between `<?` and `xml` in the XML Declaration. However, these parsers will allow that.  These rely on the `wellformedness` system to alert you when something is malformed.

When presented with unexpected input (e.g. `<myElement <foo`), the parse routines will elect to end the parsing of their syntactic element early.  in that case, you'll get the `<myElement ` recognized as an ElementStartPToken, but that PToken will have an `undefined` close, since `>` was not found.

## PTokens

* ProcessingInstructionPToken (§2.6)
* TextDeclarationPToken (§4.3.1)
* XmlDeclarationPToken (§2.8)

## Markup-internal parameter entity references
Thare are four markup declarations that may have paramter entity references placed between their `<` and `>` characters:

* Attribute list declarations
* Element declarations
* Entity declarations
* Notation declarations

During parsing, if a PE reference is encountered, this will extract all the text and parameter entity references up to the closing `>` and store the tokens in a property called `unexpanded`.

When it comes to time to be expanded, it is assumed that this content will be expanded, parsed and then the PToken re-populated with the new data by calling (for example) `resumeParseNotationDeclaration()` with the expanded content. If there is any remaining content in the STokenSource passed to the `resumeParse...()` function, it will be stored as a single SToken in the `extra` property. If there is no content left, `extra` will be set to `false`. Importantly, the contents of the `unexpanded` property will not be altered during this process.

## Implementation notes

### Processing Instructions

From an implementation standpoint, the XML Declaration and Text Declaration are specializations of Processing Instructions.  You can think of them in this relationship:

* parseInstruction()
   * parseProcessingInstruction()
   * parseFieldedInstruction()
      * parseTextDeclaration()
      * parseXmlDeclaration()

That is, there is a "bridge" processor called "instruction" which is given a `<?` and then determines whether it is parsing a PI or a declaration.  It considers the Text and XML Declarations to be "FieldedInstructions".  This is an "artificial" type of token (meaning, it is never seen outside of this PToken system, and has no reality in the XML Specification), which is handy as a way of capturing commonalities between the Text and XML Declrations.

### Coding conventions
- Files are named as camelCase nouns that describe the kind of entity they work with.
- Only named exports are used
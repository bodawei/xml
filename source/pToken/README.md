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

### Naming
#### Element declaration content specification
* contentSpec refers to identifying what kind of content is allowed (ANY, EMPTY or other)
* contentModel is a slight abuse of the word in the specification. There "content model" seems to be used only for element content, but this uses it for both element and mixed content.
   * a contentModel contains zero or more contentParticles
   * contentParticles contain either a contentModel or a contentName


### Coding conventions
- Files are named as camelCase nouns that describe the kind of entity they work with.
- Only named exports are used
- The suffix "PToken" is used for a "top-level" data structue that has a `type` property.
- The suffix "P" is used for "sub-level" data structures (e.g. ExternalID or ContentModels) that share the same characteristics (collections of STokens), but have no  `type` property.

## Interpreting the spec

### Phases
One of the problems I had as I started reading the spec was keeping track of what logical phases there are in the processing of the document. This gets particularly confusing with characters like 0x0D (CR) and entity handling.

#### Character processing
We can describe two versions of the document. The "Physical document" (by this, I mean the actualy bytes and characters in the `.xml` file on disk, for example) and the "Logical document" (I mean the characters that make up the document you wanted to produce, after all encoding has been decoded).

In 1.0, there is a production for `Char`:
```
[2] Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
```

This describes the characters allowed in the logical document.  It also closely resmbles the characters allowed in the physical document. But they are not identical.  In particular, 0xFFFE and 0xFFFF are allowed in the physical document, as these are optionally used for the byte order mark at the start of the physical document. Note that the "surrogte pairs" in 0xD800-0xDFFF are not part of the physical document because the bytes that form those sequences actually produce the characters in 0x10000+.  (thus, there is the bytes on disk, and then the UTF8 characters represented by the bytes on disk.  Our "physical document" is actually the UTF8 characters).

Interestingly, in version 1.1, `Char` is broadened to include any character except 0x00, the surrogate pairs and the byte order mark characters.  However, it also restricts the physical document to not allow 0x7F-0x84 and 0x86-0x9F.  

Almost immediately upon processing, the input stream is, at leat logically, processed so that CR and CRLF and LF (and 0x85 and 0x2028 in 1.1) are convertd to 0x0A (LF).  This can be a bit confusing when, for example, production 13 says:

```
[13] PubidChar ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]
```
the 0x0D in there is allowed in this input, but it will immediately be replaced by 0x0A.  (it is also interesting that 0x85 and 0x2028 are not allowed in production 13. Is that a bug?). 

So far, this gives us:

1. Disk representation
2. Line ending normalization
3. ???
4. Logical document

As the document is now processed, in certain circumstances, we recognize character references (e.g. `&#0A`). This is fundamentally a way to "escape" certain characters which have special meaning to an XML processor, or (in 1.1) to add characters into the logical document that can not be represented in the physical document.  This processing can be thought of as happening in the values of entity declarations, and in the document content. We might call this the "replacement text" process. This can be thought of as leaving us with a document that is just like the logical document, except entity replacement has not yet happened.  Thus:

Physical document:
```
<!DOCTYPE foo [
   <!ENTITY bar "&#x0A\r">
]>
<foo>
Hi.&#x0A;\rBye&bar;
</foo>
```
Line ending normalized  (notice the CRs have been replaced by LFs)
```
<!DOCTYPE foo [
   <!ENTITY bar "&#x0A\n">
]>
<foo>
Hi.&#x0A;\rBye&bar;
</foo>
```
Expanded charrefs document (notice the char refs have been replaced)
```
<!DOCTYPE foo [
   <!ENTITY bar "\r\n">
]>
<foo>
Hi.\r\nBye&bar;
</foo>
```

The only thing left, now, to produce the logical document is to substitute the entity values into the document
```
<!DOCTYPE foo [
   <!ENTITY bar "\r\n">
]>
<foo>
Hi.\r\nBye\r\n
</foo>
```

Entity replacement is actually a much more complex process that is beyond the scope of this writeup.  The only point here is to note that at this point in this abstract model of processing, the post-character-reference-replacement document contains all the final characters of the logical document.
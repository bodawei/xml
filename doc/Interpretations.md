# Validity
## Element Content
In production 43, `content` is defined as `(CharData | element | Reference | CDSect | PI | Comment)` (with some variation in latter spec revisions to prevent `]]>` from accidentally being possible).

Further by the time one is actually doing validation, the References must have been replaced by `CharData | element | CDSect | PI | Comment` or else some other error would have been encountered.

So, anything other than `CharData | element | CDSect | PI | Comment` are certainly not allowed in any element content.

However, not all of those are allowed in the four different content types specified in an ELEMENT declaration (ANY, EMPTY, Mixed, children). The spec is surprisingly imprecise about about these.  The text below captures the assumptions this project is making about these.

### EMPTY elements
In section 3.0 of the spec which says that none of those values are allowed in an empty element (not even entity references that expand to nothing!).

Section 3.1 does say that (for interoperability), if you have an element declared as EMPTY, then you should use an empty tag. But using a start tag immediately by an end tag is acceptable. This project reports a warning if a start and empty tag are used.

This project assumes that even whitespace between the start and end tag are invalid (because that would constitute CharData).

### Mixed content
It was only with versions 1.0/3 and beyond that text was put into section 3.0.0 that
said that comments and processing instructions were allowed within an element with Mixed content.

It seems reasonable to allow comments and processing instructions in these contexts.  On the other hand, there's no evidence that these are allowed in elements with EMPTY content. Thus, I am interpreting this as a change in the spec and they are not allowed in 1.0/1 and 1.0/2 versions.

It is worth noting that in 1.0/4 and beyond, there is an added mention of allowing CDATA sections in mixed content. However, given the definition of "character data" and given that even from the start the body of a CDATA section appears to have been considered to be character data, I'm interpreting this to be a clarification and not a change.

Of course, if an element appears in the Mixed content that is not the same type as one any of the types listed in the ELEMENT declaration, it is also treated as an error


## Attribute-list declarations
* When processing ATTLIST's, ordering is top-to-bottom when processing the DTD, with the inner subset being processed before the external subset.
* This allows for multiple ATTLIST's for the same element
   * It reports an XMLWarning for each encountered after the first
* If there are multiple ATTLIST's for the same element, the attribute declarations are combined.
* If a second attribute declaration is found (as judged soley by the attribute name), whether in the same ATTLIST or a subsequent one, it is ignored and a warning is reported.
* If an ATTLIST has no attributes, this reports nothing (it is mentioned as a good practice not to do this, but the spec doesn't encourage a warning)
* This does report if a warning if there is an ATTLIST for an element type that hasn't been declared.
   * The spec is ambiguous on ordering, in this case. Does it mean that it may warn if the ELEMENT is not declared in the DTD anywhere, or just at the point the ATTLIST is encountered?  This currently assumes the latter, (going on precedence for general entity lookups in default attribute values, which seem to require that the ENTITY must have been declared before the ATTLIST is processes). An argument for the former, however, would be to allow the internal DTD subset to add attributes to elements declared in the external subset.


# Appendix

* XMLDeclaration
* DocType
   * ELEMENT declaration
   * ATTLIST declaration
   * ENTITY declaration
   * NOTATION declaration
* Char
* CDATA
* Space
* Comment
* Processing Instruction
* Entity Reference
* Element Start
* Element End
* Pseudo/Special
   * Text
   * EntityStart
   * EntityEnd
   * <internal subset>?


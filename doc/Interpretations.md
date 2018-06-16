# Validity
## Element Content
### EMPTY elements
This follows the text in section 3.1 of the spec which says that
for interoperability, if you have an element declared as EMPTY, then you should use
an empty tag. Since this doesn't seem to be an outright error, this reports a warning,
but not an error.
Thus, this allows one to use a start tag immediately followed by an empty tag.
Anything at all between them is an error.

### Mixed elements
It was only with versions 1.0/3 and beyond that words were put into section 3.0 that
said that comments and processing instructions were allowed in the content of a Mixed
element. It seems likely that this was intended from the start, but it also seems
very reasonable to assume that they weren't allowed (after all, they're never allowed in
EMPTY elements, which seems almost as strange. Like the change in 1.0/6, switching
from no comments to allowing comments will not break previous documents.

## Attribute-list declarations
* When processing ATTLIST's, ordering is top-to-bottom when processing the DTD, with the inner subset being processed before the external subset.
* This allows for multiple ATTLIST's for the same element
   * It reports an XMLWarning for each encountered after the first
* If there are multiple ATTLIST's for the same element, the attribute declarations are combined.
* If a second attribute declaration is found (as judged soley by the attribute name), whether in the same ATTLIST or a subsequent one, it is ignored and a warning is reported.
* If an ATTLIST has no attributes, this reports nothing (it is mentioned as a good practice not to do this, but the spec doesn't encourage a warning)
* This does report if a warning if there is an ATTLIST for an element type that hasn't been declared.
   * The spec is ambiguous on ordering, in this case. Does it mean that it may warn if the ELEMENT is not declared in the DTD anywhere, or just at the point the ATTLIST is encountered?  This currently assumes the latter, (going on precedence for general entity lookups in default attribute values, which seem to require that the ENTITY must have been declared before the ATTLIST is processes). An argument for the former, however, would be to allow the internal DTD subset to add attributes to elements declared in the external subset.
# Parsing

## Malformed input
If you run the parser in strict mode, then it will deliver various XTokens and XMLWarning values. However, the first error that is encountered will cause the system to report that error and then stop delivering anything else.

However, if it is run in lax mode, then the overall charter of the parser is to try to read through the document a liberally as it can. in theory you should be able to hand it any stream of characters nad you'll get something on the other side (if you hand it gibberish, you'll get an occasional XToken and lots of errors).

With that said, this does have certain patterns that it ties to stick to in terms of how it copes with bad input. The general rules are:

1. If some expected input is missing, ignore that expectation and keep going.
   * For instance, if you have `<name attr "value">` in your input, there is an `=` missing between the attribute name and value. This will simply say "hmm. I expected an equal sign, but I'll keep going"
   * If the parser is definitely expecting the ending of an element, but doesn't find it (e.g. `<!ELEMENT foo ANY   &something else`), it will assume the closing marker was missing (thus, it assumes `<!ELEMENT foo ANY> &something; else`).
2. Tolerate "minor" character problems:
   a. For keywords (e.g. `version`, `PUBLIC`, `#REQUIRED`), this doesn't care about case.
   b.  For other important words (e.g. element type names), this will parse and use words that have illegal characters in them (e.g. `<$badName>`)
      * The same is true for CharacterData.
3. Tolerate whitespace in as many locations as possible, even if not strictly allowed. (Thus `&  myReference\t\n;` will be recognized, albeit with errors being reported).
4. Do not even try to start reading some syntactic units if the initial start is not present.
   * Hopefully obviously, if no `<` or `&` is found, the parser will never try to read some markup.
   * Less obviously, if there could be some syntactic units in some locations, but if the initial part is not found, then none of it will be found.
      * For example, if you could legitimately find an ExternalID in some location, but no `SYSTEM` or `PUBLIC` word is found, then it won't even try to identify the ExternalID (even if you have `<NOTATION foo "systemid">` where, by the first rule, you might expect it to parse).
      * The full list of these elements are:
         * ExternalID's (`SYSTEM...` or `PUBLIC...`)
         * `children` content specs and EnumeratedTypes (`(...`)
         * AttrDefs (`attrname (CDATA "foo", or whatever)`) in ATTRLIST's
         * Attributes (`attrname (="value")`) in elements and XMLDeclarations
         * Literals (`'...` or `"...`)
      * A corollary of this is every other value in an XToken can potentially be undefined.
         * The fixer stream can be used to fully populate the XTokens with default values if you want to not have to cope with this.
5. Units that have a well defined ending will end at that ending. In this example, `<!ELEMENT elName > ( name2 | name3* )+>`, the element declaration would be considered to end right after the `elName`, even though as a human being you can see it might be nicer to just ignore the first `>`.
   * Put another way, the parser is generally eager to end a syntactic unit at the first indication it can (assuming 1-4 are satisfied, first).
      * One example of this is `<!ELEMENT foo (name 1 | (name2 , name3 | name4)+) >`. In this case, the second `|` is unexpected, so will cause the parser to assume that a `)` after `name3` was missing, and so it will close that sub-list and resume with the topmost list (where it will eventually find an unexpected `)` which will cause it to assume the `>` that should end the element declaration is missing, and then treat the subsequent `>` as a random character that is syntactically wrong.
5. The prevous rule tends to also be biased to keep the parser from ending up with text it doesn't know what to do with. An exception to this is when a parameter entity is used. It is possible to have `<!ENTITY % foo "blah junk"><!ELEMENT %foo; junk2>`, which leaves one with `junk junk2` with nowhere to go.  By the first rule, you would expect this to end the declaration. However, at this stage in the processing we already have made an assumption about the ending, and an error is reported about this and by the time this gets to being turned into an XToken, this text is simply discarded.
   @@@ note to self: I'd actually be comfortable with dumping this extra out as a CharData blob along with the `>` instead to remain consistent.
   @@ there may be a second exception here which is with XMLDec's attributes.
      - but, I'm also happy to have the xmldecl just have the array of attributes even in the XToken.
         * Can we make it esy to substitute in other token sets? e.g. put in a custom xmldecl handler?


## Whitespace (§2.10. and §3.2.1)
* `xml:space`: This always generates a validity error if a value other than default and preserve is specified. In lax mode, the erronious value will be passed on to the app.
   * The spec does allow for the processor to not report an error, and even not reporting the attribute. This could be added here in a latter version.
   * Note: the spec does not characterize this as a validity constraint.

## xml:lang (§2.12)
The `xml:lang` attribute is one of those surprisingly complex hidden corners of XML.

In 1.0/1 ( https://www.w3.org/TR/1998/REC-xml-19980210#sec-lang-tag ), there was an explicit syntax for the attribute value listed. It also referenced IETF RFC 1766 ( https://tools.ietf.org/html/rfc1766 ) which actually has slightly different syntax (e.g. XML allows a subtag to be any length, while the RFC allows only 1-8 characters). This implementation goes with the XML syntax in 1.0/1.

In 1.0/2, the syntax in the XML standard is dropped. Instead, only RFC 1766 (or it's successors!) is referenced. This intorudces an interesting detail. The successors of that are (at the time of _this_ writing):
   1. https://tools.ietf.org/html/rfc1766
   2. https://tools.ietf .org/html/rfc3066 (aka BCP-47)
   3. https://tools.ietf.org/html/rfc4646 (aka BCP-47)
   4. https://tools.ietf.org/html/rfc5646 (aka BCP-47)
This is interesting because RFC 3066 broadens the allowable syntax (allowing digits in subtags). Note that in both RFC 1766 and 3066, the stated syntax is more general than what the explanatory text allows. In the text, RFC 3066 also allows three letter primary tags (which is easily allowed given the general syntax).
In turn, RFC 4646 reduces the allowable syntax. In the case of the first tag, this seems to merely encode in the syntax what was in the text in previous versions. However, in all the subtags (no longer so called) there is considerable restriction. However, presumably even though the stated syntax is restricted, these actually take into account what had been registered in earlier versions. So, I assume that these are fully forwards compatible (meaning, everything allowed by earlier versions is allowed.

1.0/3, 1.0/4, and all of 1.1 reference RFC 3066 (or its successor) and also allow "".

1.0/5 references RFC 4646 (or it's successor).

It is notable that we will check the value when doing pToken checkWellFormed() checks when it is available, and otherwise wait until expansion to determine if it is ok.

## limits
- commetn eetc

# Tokanes
(list tokens, including errors and warnigns)
* XMLDeclaration
* DocType <!DOCTYEPE name SYSTEM ... [ ... ]>>
   * ELEMENT declaration <!ELEMENT foo EPTY|ANY|( name | name...)>
   * ATTLIST declaration <!ATTLIST foo x notation ( a | b |c ) #FIXED "foo">
   * ENTITY declaration <!ENTITY % name "valeu"  | SYSTEM x ndecl>
   * NOTATION declaration <!NOTATION foo SYSTEM x y>
* CharData
* CDATA
* Space
* Processing Instruction
* Entity Reference
* Element Start
* Element End
* Pseudo/Special
   * Text
   * EntityStart
   * EntityEnd
   * <internal subset>?

## Comments
* Spec says "for interoperability, -- may not occur in a comment, which would imply to me that one can do this, but it should generate some kind of warning.  However, the syntax simply doesn't allow this, making it a well-formed error.

## Names
The syntactic construct, Name, is used for the identifiers for elements, attributes, entities notations, and processing instruction targets.
* Processing instructions may not have `[Xx][Mm][Ll]` anywhere in their target. This treats it as an error if that is found.
* In all versions of the spec except 1.0/6, names that start with `/^[Xx][Mm][Ll]/` is reserved. This will report a warning on any reserved name (note that PI's may report a warning, but will always report an error in this case)
* In 1.0/6.
   * The `/^[Xx][Mm][Ll]/` restriction is lifted for all.
   * The PI restriction remains and will report an error
   * Attribute and element names that start with `/^xml:/` are reserved, so a warning will be reported.
   * PI names starting with `/^xml-/` are reserved. Similarly with other versions, a warning may not be produced.

# Validity
## Element Content
In production 43, `content` is defined as `(CharData | element | Reference | CDSect | PI | Comment)` (with some variation in latter spec revisions to prevent `]]>` from accidentally being possible).

Further by the time one is actually doing validation, the References must have been replaced by `CharData | element | CDSect | PI | Comment` or else some other error would have been encountered.

So, anything other than `CharData | element | CDSect | PI | Comment` are certainly not allowed in any element content.

However, not all of those are allowed in the four different content types specified in an ELEMENT declaration (ANY, EMPTY, Mixed, children). The spec is surprisingly imprecise about about these.  The text below captures the assumptions this project is making about these.

### EMPTY content
In section 3.0 of the spec which says that none of those values are allowed in an empty element (not even entity references that expand to nothing!).

Section 3.1 does say that (for interoperability), if you have an element declared as EMPTY, then you should use an empty tag. But using a start tag immediately by an end tag is acceptable. This project reports a warning if a start and empty tag are used.

This project assumes that even whitespace between the start and end tag are invalid (because that would constitute CharData).

### Mixed content
It was only with versions 1.0/3 and beyond that text was put into section 3.0.0 that
said that comments and processing instructions were allowed within an element with Mixed content.

It seems reasonable to allow comments and processing instructions in these contexts.  On the other hand, there's no evidence that these are allowed in elements with EMPTY content. Thus, I am interpreting this as a change in the spec and they are not allowed in 1.0/1 and 1.0/2 versions.

It is worth noting that in 1.0/4 and beyond, there is an added mention of allowing CDATA sections in mixed content. However, given the definition of "character data" and given that even from the start the body of a CDATA section appears to have been considered to be character data, I'm interpreting this to be a clarification and not a change.

Of course, if an element appears in the Mixed content that is not the same type as one any of the types listed in the ELEMENT declaration, it is also treated as an error

### ANY content
The definition of what is allowed if an element has "ANY" content varies considerably across versions. Going just by the words, we know we can only pick from `element | CharData | Reference | CDSect | PI | Comment`.
* Version 1.0/1&2 only speak of child elements
* 1.0/3 and 1.1/1 allow (after entity replacement) character data and declared child elements.
* Other versions allow (after entity replacement) character data, CData sections, PI's and comments.

From this parser's standpoint, this means:
* CharData, Space, EntityReferences, EntityStart and EntityEnd (as well as XMLErrors) are acceptable in all versions.
* CData, Comments and PI's are allowed in 1.0/4-5 and 1.1/2

Obviously, References will be an error if they can't ultimately be expanded, but they won't be flagged as a violation of the ANY content validity rules.

### CHILDREN content
Like everything else here, there's differences across different versions of the XML Specification.
Like the others, it is unclear if the changes are clarifications or changes (if so, they are relxaxations). Like the others, this assumes these are changes.

* Version 1.0/1 only allow elements that match the grammar and whitespace.
* Version 1.0/2 only allow elements that match the grammar and whitespace (allowing whitespace before first child element and after the last), and explicitly disallows CData sections.
* All other versions allow elements that match the grammer, whitespace, comments and PI's.

The validity of entity references and character references here are ambiguous, as they are not mentioned in 1.0/1 or 2. They are mentioned in 1.0/3 and beyond, but only enough to say that if the if the replacement text is whitespace, it's OK (but it isn't ok if the replacement text is char refs that expand to whitespace).

This goes with the assumption that entity references are acceptable here.

Note that §3.2.1 has a constraint that the parameter entities must be properly balanced.  Since a parameter entity may be formed from the expansion of other parameter entities, this considers this constraing to mean that each topmost entity in the content spec must ultimately be balanced, but any "sub-entities" need not be. 

## Attribute-list declarations
* When processing ATTLIST's, ordering is top-to-bottom when processing the DTD, with the inner subset being processed before the external subset.
* This allows for multiple ATTLIST's for the same element
   * It reports an XMLWarning for each encountered after the first
* If there are multiple ATTLIST's for the same element, the attribute declarations are combined.
* If a second attribute declaration is found (as judged soley by the attribute name), whether in the same ATTLIST or a subsequent one, it is ignored and a warning is reported.
* If an ATTLIST has no attributes, this reports nothing (it is mentioned as a good practice not to do this, but the spec doesn't encourage a warning)
* This does report if a warning if there is an ATTLIST for an element type that hasn't been declared. (§3.3.0)
   * The spec is ambiguous on ordering, in this case. Does it mean that it may warn if the ELEMENT is not declared in the DTD anywhere, or just at the point the ATTLIST is encountered?  This currently assumes the latter, (going on precedence for general entity lookups in default attribute values, which seem to require that the ENTITY must have been declared before the ATTLIST is processes). An argument for the former, however, would be to allow the internal DTD subset to add attributes to elements declared in the external subset.
* The spec is also ambiguous about whether the values in a NOTATION attribute declaration must have been declared before the ATTLIST declaration. Like the above for the ELEMENT, this assumes that it must have already been declared at this point.
* Note that this validates individual attribute declarations, even if they are ones that will be ignored because they are a subsquent one (as above)
* Normally "for compatibility" is interpreted as a warning, not requirement. However, as of 1.0/2 NOTATION attributes may not be on  an EMPTY element, and this is both a validity constraint (error) an for compatibility (warning). We're assuming error
* 3.3.2 is a bit unclear about #FIXED handling. if an ATTLIST has a #FIXED attribute definition, and that attribute is not added on a start or empty element, is that an error (was the document author supposed to specify that value? or can it be omitted?. This reader can read the text either way.  The Validity constraint in that section says "If an attribute has a default value declared with the #FIXED keyword, instances of that attribute must match the default value." and the explanatory text says "the #FIXED keyword states that the attribute must always have the default value.". But, the text also says "If a default value is declared, when an XML processor encounters an omitted attribute, it is to behave as though the attribute were present with the declared default value."
* In 1.0/3 They point out that beyong base syntactic constraints, an attribute default's more semantic constraints are only checked if that default is actually used somewhere.  (so, the ordering here is: when encountering an attribute default, we must scan it or entity references and expand those, and make sure it is a name or nmtoken.  but we don't make sure, for example, that it is actually an id reference, for example, until it is used, which means if the default is never used we'll never report any violations). Despite this being added in 1.0/3, this implementation assumes this applies to all versions. (before 1.0/3 I think this would have been ambiguous. We could have interpreted it as do no checking until use, or do all checking at declaration, or this).
* This does assume that an entity reference in an ATTLIST default value must reference an entity declaration that has already been made. no forward references in this case.


This interprets this as saying the attribute can be omitted, in which case the default value will be used, but if it is present it must match. This relies on my reading of "If a default value is declared, when an XML processor encounters an omitted attribute, it is to behave as though the attribute were present with the declared default value.".

# Stages of processing:
1. Source
2. Character set conversion
3. Line ending replacement
4. Parsing (identifying markup, including references)
   (possibly two passes in parsing)
   ( normalization here? )
5. Replacement (replacing character and entity references with their replacement text)
6. Character reference expansion (this is because they are still visible in CHILDREN entity replacement)

Internal entities are parsed twice. The first time replaces any character references.
   - Are PEReferences allowed here?
The second time is at the point of use. Those character references from the first parse may form new markup, including other char references, which are all re-parsed and replaced at time of use.
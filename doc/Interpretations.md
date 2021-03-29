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

## Processing Instructions
* In 1.1/*, Production [16] says that the Processing instruction's instruction data is any Char (with no ?>). Yet, this slightly contradicts production [1] which indicates that there may be no RestrictedChars in the entire document. This goes with the assumption that there are no restricted chars allowed in PI's.

## Comments
* Spec says "for interoperability, -- may not occur in a comment, which would imply to me that one can do this, but it should generate some kind of warning.  However, the syntax simply doesn't allow this, making it a well-formed error.
* In 1.1/*, Production [16] says that the comnent's data is any Char (with no -). Yet, this slightly contradicts production [1] which indicates that there may be no RestrictedChars in the entire document. This goes with the assumption that there are no restricted chars allowed in comments.

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

However, not all of those are allowed in the four different content types specified in an ELEMENT declaration (ANY, EMPTY, Mixed, children). The spec is surprisingly imprecise about about these, by which I mean that the constraints for each content type is spelled out in words, not syntax. Further, as the XML spec was revised, some of the changes in wording may well be different from what the reader of an earlier version would have interpreted. The text below captures the assumptions this project is making about these.

### EMPTY content
In section 3.0.0 says that an elment with EMPTY contenttype may have no content. While 1.0/3+ clarifies to say
"this means not even...". This processor does interpert 1.0/1 to mean none of the above `content` values may be found (which happens to match subsequent versions). So, anything, even whitespace, or an entity reference that expands to nothing (`<!ENTITY foo "">  <isEmpty>&foo;</isEmpty>`), or a CDATA with nothing in it (`<isEmpty><![CDATA[]]></isEmpty>`), is considered an error.


Section 3.1 does say that (for interoperability), if you have an element declared as EMPTY, then you should use an empty tag. But using a start tag immediately by an end tag is acceptable. This project reports a warning if a start and empty tag are used (ELEMENT_WITH_EMPTY_DECL).

### Mixed content
What is considerd "Mixed" content varies across versions:

* Before 1.0/3 only CharData and elements in the content model
* In 1.0/3 and 1.1/1 entity references, comments, and PI's were added (entity references should expand to the same subset)
* Beyond those, CDATA sections were added.

As with all these content types, it is ambiguous if the things enumerated in later versions were allowed implicitly by earlier versions. Since this processor takes a pedantic stance, and since the way things are worded in 1.0/1 legitimately can be interpreted to mean these were not allowed, those types are not allowed with documents in those earlier versions.

Note also that CharRef's are never mentioned at all.  This assumes that they count as CharData, but there's no support one way or the other for that notion.  It is being assumed because by the "current" version (1.0/5), that's certainly expected.

Of course, if an element appears in the Mixed content that is not the same type as one any of the types listed in the ELEMENT declaration, it is also treated as an error

to summarize:

* 1.0/1-2: `mixedContent = (element | CharData | CharRef)*`
* 1.0/3 & 1.1/1: `mixedContent = (element | CharData | Reference | PI | Comment)*`
* 1.0/4-5 & 1.1/2: `mixedContent = (element | CharData | Reference | CDSect | PI | Comment)*`

In all cases, elements must match one of the types in the element declaration)

### ANY content
The definition of what is allowed if an element has "ANY" content varies considerably across versions.

* Version 1.0/1-2 only speak of child elements
* 1.0/3 and 1.1/1 allow (after entity replacement) CharData and declared child elements.
* Other versions allow (after entity replacement) CharData, CData sections, PI's, comments and declared elements.

While it is certainly reasonable to assume that any `content` is allowed in any version, this processor takes a pedantic view:

* Only declarad child elements are allowed in all versions.
   * This is driven by in 1.0/1, #3 calls out character data explicitly (Mixed), it isn't in #2 (elment content), and it isn't in #4 (ANY). While you might have legitimately assumed ANY meant any content at all, you would also have thought Mixed was the same as ANY except for the constraint of which elements were allowed, but they were described differently.  Which do you honor?  This goes with themore constrained view.
* CharData, EntityReferences, EntityStart and EntityEnd, as well as declared elements are allowed in 1.3 and beyond.
   * Obviously, references will be an error if they can't ultimately be expanded, but they won't be flagged as a violation of the ANY content validity rules.
   * This assumes CharRefs count as CharData here
* CData, Comments and PI's are allowed in 1.0/4-5 and 1.1/2

to summarize:

* 1.0/1-2: `anyContent = element*`
* 1.0/3 & 1.1/1: `anyContent = (element | CharData | Reference)*`
* 1.0/4-5 & 1.1/2: `anyContent = (element | CharData | Reference | CDSect | PI | Comment)*`

In all cases, elements must match a declared element

### ELEMENT content
Like everything else here, there's differences across different versions of the XML Specification.
Like the others, it is unclear if the changes are clarifications or changes (if so, they are relaxations). Like the others, this assumes these are changes.

* Version 1.0/1 only allow elements that match the grammar and whitespace.
* Version 1.0/2 only allow elements that match the grammar and whitespace (allowing whitespace before first child element and after the last), and explicitly disallows CData sections.
* All other versions allow elements that match the grammer, and whitespace, comments and PI's between elements (and before the first and after the last child). CData is explicitly disallowed if it contains only whitespace. Similarly, charrefs that are whitespace are not allowed.  However, entity references whose replacement text is whitespace (not charrefs of whitespace) are allowed.

Note: While the spec says that an EntityReference must expand to whitespace, it probably meant to say that PI and Comment were allowed to.  Thus, a bit out of it's pedantic character, this processor allows an expanded entity rererence to be space, comment or processing instruction in 1.0/5-6 and 1.1/2-3. The callout to CData sections is interesting in that it could be taken to mean CData might be allowed in some other capacity, but this thinks that that makes no sense under any circumstances, and so completely disallows CData sections.

Note that §3.2.1 has a constraint that the parameter entities must be properly balanced.  Since a parameter entity may be formed from the expansion of other parameter entities, this considers this constraint to mean that each topmost entity in the content spec must ultimately be balanced, but any "sub-entities" need not be.

Note also: The text between child elements should be S, not CharData. however, the parser will not recognize that without the validation system which is the first layer that knows about the content type of an element. Thus earlier layers will return those characters as CharData, and only when it comes out of the validator will it be Space!

to summarize:

* 1.0/1: `elementContent = (element, ((element | S)*, element)?)?`
* 1.0/2: `elementContent = (element | S)*`
* 1.0/3-4 & 1.1/1: `elementContent = (element | S | EntityRef | PI | Comment)*`
* 1.0/5 & 1.1/2: `elementContent = (element | S | EntityRef | PI | Comment)*`

In all cases, elements must match the regular expression.

* In everyting but 1.0/5 and 1.1/2, When an EntityRef is allowed, it must replacement text that is S.
* In 1.0/5 and 1.1/2, When an EntityRef is allowed, it can expand to S, PI and/or Comment

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
* Normally "for compatibility" is interpreted as a warning, not requirement. However, as of 1.0/2 NOTATION attributes may not be on  an EMPTY element, and this is both a validity constraint (error) an for compatibility (warning). We're assuming error  (not true.  They're errors. but there are only a few)
* 3.3.2 is a bit unclear about #FIXED handling. if an ATTLIST has a #FIXED attribute definition, and that attribute is not added on a start or empty element, is that an error (was the document author supposed to specify that value? or can it be omitted?. This reader can read the text either way.  The Validity constraint in that section says "If an attribute has a default value declared with the #FIXED keyword, instances of that attribute must match the default value." and the explanatory text says "the #FIXED keyword states that the attribute must always have the default value.". But, the text also says "If a default value is declared, when an XML processor encounters an omitted attribute, it is to behave as though the attribute were present with the declared default value."
* In 1.0/3 They point out that beyong base syntactic constraints, an attribute default's more semantic constraints are only checked if that default is actually used somewhere.  (so, the ordering here is: when encountering an attribute default, we must scan it or entity references and expand those, and make sure it is a name or nmtoken.  but we don't make sure, for example, that it is actually an id reference, for example, until it is used, which means if the default is never used we'll never report any violations). Despite this being added in 1.0/3, this implementation assumes this applies to all versions. (before 1.0/3 I think this would have been ambiguous. We could have interpreted it as do no checking until use, or do all checking at declaration, or this).
* This does assume that an entity reference in an ATTLIST default value must reference an entity declaration that has already been made. no forward references in this case.


This interprets this as saying the attribute can be omitted, in which case the default value will be used, but if it is present it must match. This relies on my reading of "If a default value is declared, when an XML processor encounters an omitted attribute, it is to behave as though the attribute were present with the declared default value.".

## Literals
- system literal in an external id
- public literal in an external id
- entity value literal
- attribute value literal

Spec is a little inconsistent about these:
- PE refs can't appear in most, but can in an entity value literal
- general entity references can appear in entity and attribute value literals (both on a nelement start tag and an attribute declaration), but are actually processed at different times
- syntax says that system and public literals cant' have either, but it also goes out of its way to say taht system literal can be parsed without looking for any markup.  implicitly the public can be @@@@QUESTION 1@@@@

## General Entities

- 4.4 says that external entities can't appear in an attribute value (mentioned elsewhere)  [no idea why there is this constraint]
- We assume a general entity is generally only referenced when content is being processed. That is, it is easy to set up an infinite loop between entities because their values aren't actually processed until they are referenced:
```
<!DOCTYPE foo [
      <!ENTITY one "&two">
      <!ENTITY two "&one">
]>
<foo>
   &one;
</foo>
```
- while the spec doesn't say, the command line xml processor on the mac does interpret the general entity references in an attribute default (as a part of ATTLIST declarations) at the pont of declaration.  Taht is, unlike entity values, we don't wait to process those values until they are used.  Which means an ATTLIST must follow any entity it wishes to reference.

- §4.6 says that "If the entities `lt` or `amp` are declared, they must be declared as internal entities whose replacement text is...".  In all the handling for §2.9 and §5, it seems that if a declaration isn't referenced, it doesn't matter if it is invalid.  This processor takes the same stance with the predefined entities.  If they are not correctly declared, but are not referenced, this will ignore those declarations.

- §4.1.0's "Well-formedness constraint: Entity Declared" is a nightmare to read in any version of the spec. As far as I can determine, the second paragraph is essentially re-expressing part of what the first paragraph says. Oddly, it seems to imply that a non-validating processor should not report a well-formedness error if a general entity reference is found and the document has no DTD.  This seems to contradict the first paragraph.  This first paragraph seems to make more sense, an so this goes with that. (put more clearly, I don't see why a non-validating processor that finds a document with no DTD at all shouldn't report entity references as problems)

- Another subtle detail here.  This reports an error if there is a General entity reference in a default value of an ATTLIST in the internal subset (and there is no declaration for that ref), as long as there were no parameter entity references before the attlist (there may be some after).  It is debatable whether this is the correct pedantic interpretation of the §4.1.0 Entity Declared well-formedness constraint. (this goes with that because at the point of processing the ATTLIST, there's no way to know if there are perefs after it)

- Flipping the coin the other way, this opts to go with the pedantic interpretation that if there's an external subset, and the ATTLIST (in the internal subset) has a reference in a default value with no declaration, it will not report an error. This isn't quite right, as the presence or absence of an external subset should have no effect on the ATTLIST in the internal subset, but this is what the spec says. (and this is knowable at the point of parsing the ATTLIST)

- §4.3.2 says that "A consequence of well-formedness in entities is that the logical and physical structures in an XML document are properly nested; no start-tag, end-tag... can begin in one entity and end in another".  The syntax productions in [39] and [43] certainly suggest that any start tag must also be balanced with an end tag in the same entity. This assumes that is so, even though the wording does not say that.

- §4.2.2 says that a NDATA name must be declared.  It doesn't specify when that validity constraint is checked. One might expect either at declaration time (like param entity references) or at reference time. However, ibm tests valid/P54/ibm54v01 and invalid/P76/ibm76i01 contradict those.  This assume that this is done at end of DTD. 

## Parameter Entities
- Can appear in an entity value literal
- Can't appear in any other literal
- can't appear in content
- can appear in dtd
   - must contain whole markup declarations. cant have start or end of one.
- can appear in markup declarations
   - Generally can appear between any two S's within the `<!FOO ... >`
   - in an element declaration, there are constraints about what can be in the replacement text, including that it not be only whitespace, not end with | , and must be properly balanced among the ()'s.
   - you might expect the same balanced constraint among the enumeration or notation value in an ATTLIST declaration, but nothing says that
- can appear in a conditional section, but evidently only at X `<![X[...` and replacement text must be one of two values
- One of the slight brain-twisters about XML is that we can not do well formed checks on parameter entity references. Put another way, if there is a parameter entity reference but no related entity declaration, there will never be a well formedness error. Technically, §4.1.0 doesn't specify that an a well formedness error. But, closely related, well formeness needs to be able to be evaluated by a non-validating processor, and such a processor is (minimally) ignorant about parameter entities and their references.  As such, this only turns up in the validity pass.

## Standalone
We assume that a document like the following is correct, as far as standalone processing goes. Which is to say, the non-validating processor wont' read the parameter entity, but will recognize that the reference to it is ok.
```
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE foo [
   <!ENTITY % internallyDeclared "whatever">
   <!ELEMENT test ANY>
   <!ATTLIST test
      attr1 CDATA #REQUIRED "%internallyDeclared">
]>
```
Note that we also assume that this is OK, since generalEntity is never referenced.
```
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE foo [
   <!ENTITY % internallyDeclared "<!ENTITY % externalyDeclared 'whatever'>">
   %internallyDeclared;
   <!ENTITY generalEntity "%externallyDeclared;">
]>
<foo>
</foo>
```
I'm puzzled, because a non-validating processor doesn't need to read pe's.
It really is not clear to me what standalone means or what it is for. It seems to be that some non-validaing processor may do some (e.g. the second example here).

## Entity Expansion
- The way this is built, the EntityExpander tries to know as little as it can about the correctness of the stream of tokens it is given. It has to know a bit about whether it is in the internal subset while not-validating so it can appropriately ignore some declarations. Aside from that, however, it relies on CheckWellFormed and CheckValid processes to make sure the stream is actually correct.

It is worth commenting on this table from 4.4.0

| | Entity Type: Parameter | Entity Type: Internal General| Entity Type: External Parsed General| Entity Type: Unparsed| Character |
|---|---|---|---|---|---|
| Reference In Content| Not recognized<br>(Parser will not see this. However, EntityExpander will include these if present)	 | Included |	Included if validating<br>(otherwise reference left in place) |	Forbidden<br>(reference left in place) |	Included |
| Reference in Attribute Value| Not recognized |	Included in literal |	Forbidden |	Forbidden |	Included |
| Occurs as Attribute Value| Not recognized |	Forbidden |	Forbidden |	Notify |	Not recognized |
| Reference in EntityValue | Included in literal | Bypassed |	Bypassed |	Error |	Included |
| Reference in DTD | Included as PE| Forbidden| Forbidden| Forbidden| Forbidden|

- Note that the "as Attribute Value" portion of this really involves no expansion, and so is only noted by the validator, since only it has knowledge about the types of attributes.
   - it is hard to understand how a character reference would be recognized in an attriute value!



# Terminology

## Entities ()
There are five kinds of entities in XML.
1. Document Entity: This is the "main document" which has the XML Declaration, DOCTYPE declaration (if any) and the root element in it.
2. External DTD Subset: This is an optional entity which has a portion of the document type declaration for the document.
3. Parameter Entities: These declare a value, or replacement text, which can be referenced in three places:
   a. In the body of the DTD (in either the internal or external DTD subset). Here, their replacement text is interpreted as a set of declarations, comments, and processing instructions.
   b. In entity values (including, potentially, in other parameter entity values). In practice, this means that the parameter entity has to have been declared before the entity declaration (@@@ But I have no idea what happens about uses of parameter entity references in external entities. are they constrained by what was declared at the point of the entity declaration?)
   c. Within markup declarations. This is only allowed in the external subset (@@ ref?). While the spec says that they must be placed between S's in the syntax, there are various other constraints on their placement that seem implicit in the spec.  Details are given, above, about how this has interpreted this.
4. General Parsed Entities: These also declare a value (or replacement text) which can be referenced in three places:
   a. In the content of the document (that is, between start and end tags)
   b. In attribute values (though, as a constraint, only internal general parsed entities may be referenced here)
   c. In attribute defaults in an ATTLIST declaration. It is implicit in the spec that these may also only be internal general parsed entities.
5. Unparsed entities: These declare some kind of non-XML data that can be referenced but not parsed by the XML processor.  These can only be used as an attribute value (not referenced from within an attribute value)

## Internal and External
There are actually three pairs of meanings for "internal" and "external" in the XML standard:

DTD Subsets (see §2.8)
   * Internal DTD Subset: This is the portion of the DTD in the main document entity within the DOCTYPE declaration (e.g. `<!DOCTYPE foo [ internalDTDSubset ]>`)
   * External DTD Subset: This is the portion of the DTD stored in another entity (e.g. a separate file) that is referenced from the DOCTYPE declaration (e.g. `<!DOCTYPE foo SYSTEM 'myExternalDTDSubset.xml'>`)

Entity Types (see §4.2)
   * Internal Entity: This means that the value of the entity is specified directly in the entity declaration: (e.g. `<!ENTITY foo 'myInternalValue'>`). Crucially, an Internal Entity can be found in either the internal or external DTD subsets. (so, you can have an internal entity in the external subset)
   * External Entity: The value of the entity is found in another entitity (e.g. a separate file) from where the entity is declared (e.g. `<!ENTITY foo SYSTEM 'myExternalEntityValue.xml'>`). An External Entity can be declared in either the internal or external DTD subsets.

Markup Declarations (§2.9)
   * Internal Markup Declration: This is not explicitly stated in the spec, but is implicit as the inverse of the next:
   * External Markup Declaration: This is any markup declaration (ELEMENT, ENTITY, ATTLIST, NOTATION) that is in the external DTD subset _or_ in any parameter entity value. So, it is easy to see that you may have an internal or external entity that has an external markup declaration (the declaration is in the external subset and the value is in the external subset or yet another file). But, you can also have an internal entity in the internal subset that is from an external markup declaration.  An example of this is:
      ```
      <!DOCTYPE foo [
         <!ENTITY % internalParameterEntity
            "<!ENTITY InternalEntity 'externallyDeclared'>">
         %internalParameterEntity;
      ]>
      ```

## Read ()
The word "read" is used in various places without being defined. I assume this means a superficial amount of parsing, such that we recognize that `<!ENTITY % foo "x">` is a parameter entity named foo, but we don't really know what is in its value.

## Standalone (§2.9, §4.1, §5.1)
One of the most head-twisting ideas in XML is that of the "standalone" document. In the XML Declaration, you can specify `standalone="yes"` (or `="no"`, though omitting it is the same as saying "no").

To this writer, the intuitive meaning of this is "the document entity fully describes the document, and there is nothing external to it". Or, more precisely: "This document has no external entities". This might seem to be a signal to a processor that it can do all of its work accurately without waiting to load other data. However, this isn't quite the case for four reasons:

First, one can still have an external subset (§2.9). The crucial thing is that the content that is delivered by the XML processor will be the same whether or not you read the external subset. Thus, you can have all the NOTATION, ELEMENT and ATTLIST declarations in the external subset that you want, as long as none of them have information you need to have to deliver results to the app.  Things that can cause problems are:
   1. if your ATTLIST attributes have default values that should be added to any element starts,
   2. if the ATTLIST attribute types would cause the processor to do more value normalization
   3. if knowing the content model of an ELEMENT would cause you to ignore whitespace

Second, one can also have externally declared entities, as long as they are never referenced in the document. So, in fact, these are not very interesting.

Third, one can have an internally declared external entity that is referenced in the document.

Fourth, and most head-hurtingly, your document entity may, in fact, be fully self-contained (have no external entities), but still not be standalone.  This is because if there are any markup declarations in any parameter entity values, then the document is considered to be not standalone.  §2.9 mentions that a non-validating processor is not required to process any parameter entity declarations, so they are, in fact, inaccessible to a strict one.

So, what does "standalone" mean? I interpret it to mean "Simple DTD". With that in mind, then the opening of section §2.9 makes more sense: "Markup declarations can affect the content of the document... The standalone document declaration ... signals whether or not there are such declarations which appear external to the document entity." (external includes within referenced parameter entity declarations). Put another way, you can ignore the external DTD subset, and ignore any parameter entity references in the internal subset, and the set of declarations that affect the document would be the same if you did read the external DTD subset and did not ignore any parameter entity references in the internal subset.

## Validating and Non-validating (§2.9, §4.1, §5.1)
A validating XML processor is easy to understand: It reads the document entity, external DTD subset, reads and processes and recognizes all the declarations in the internal and external subset, it reads all external entities, and processes every bit of markup througout the document while validating that all the validation constraints are correct.

A non-validating XML processor is generally also straightforward: A document may have an external subset, external entities, parameter entities, and references to internal entities.  But it doesn't have to process any of those except the document entity. As such there may be huge validity problems in the document that it won't notice. However, it at least assures that the document entity itself is minimally well formed.  There are two catches:
1) non-validating processors do not have to handle any parmaeter entities or their references. They are allowed to if they want to, but need not.
2) If there is a reference to a parameter entity in the internal subset (not in an entity value, that is) the non-validating processor need not expand it (of course, by the previous provision). But, that then means that declarations after that in the internal subset may be misleading since the expanded parameter entity might have declared some things that would have changed things that came after (e.g. the PE might have declared an entity foo which is also declared afterwards. because in XML first mention wins, that would mean the second one should be ignored).  Thus, the non-validating processor stops reading then.
3) Note that standalone is interesting in that if it is processed by a non-validating processor, it can reliably keep reading after the reference to a parameter entity, since the definition of standalone says that there are no relevant declarations in there.

It isn't entirely clear to this author what the point of the non-validating processor or the standalone mode are. Both leave you with potentially invalid documents. They give you a bit more confidence about the basic syntactic soundness of the documents, particularly standalone.  But their motivation is quite opaque to this writer.



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

ordering of things is so weird. in 4.4.0 it says an unparsed entity reference should be an error.  yet, this is almost the same as an unparsed reference in content.  put another way, the parsed entity references are bypassed.  Which seems fine.  but you can't know if an entity reference is unparsed in an entity value until it is used, ot at least until the end of the dtd.
   - So this isn't parse time.  Thsi is end of dtd time that you can know this.
   - it could be at expansion time, but then you need to be very clear that you are indeed in the middle of expanding an entity and encounter this there.  So, bypassed is at parse time, and error is at end of dtd or expansion time.



# QUESTIONS
- Doesn't a standalone=yes still produce wrong attribute values if #fixed is specified? but the specified elemnt starts have a value there so don't need the default?
- Why does systemliteral call out that it doesn't need to be parsed?
- "Well-Formedness Constraint: PEs in Internal Subset In the internal DTD subset, parameter-entity references can occur only where markup declarations can occur, not within markup declarations"  Does this apply to values in entity values?
   - if yes, then we're good.  so standalone is good.
   - If no, then in standalone are these errors?  4.1 speaks of the necessity of a declaration for a reference, but it isn't clear if this is general or parameter entities. (by 4.1 it seems like it must mean general entities, but then not clear what happens if a parameter entity is not declared).  This whole section is entity reference, and it inclues PERefs, so I asusme this does mean either. so it must mean you can't put these in entity values in the internal subset.  This seems like a horrible restriction.  this is independent of validating or non-validating.  the internal subset is really crippled.  I don't know why we did this. Except the mental model that the external subset is for general purpose use, and can be overridden.
- Why is an unparsed entity reference merely an "erorr" if in an entity value, but forbidden in an attribute value or content?


# Entities
The treatment of parameter entities can get really complex.  The relevant details are covered in sections
2.8, 2.9, 4.1 and 5.1 of the standard. Most of this is straightforward. In many ways, the most crucial line in the stanard for non-validating (and standalone) processing is from §2.9 "...non-validating processors are not required to read them [parameter entities]". This has the somewhat surprising result that (depending on how you interpret "read", we can't expand parameter entity references anywhere in this mode.  The most surprising thing is that you can have parameter entities in markup delcarations in the internal subset if that declaration has gotten in there by way of a parameter entity.

Note: This is essentially an expansion of the "Entity Value x Entity Type: Parameter" cell in the table in §4.4.

| In | Non-validating | Standalone | Validating |
|--|--|--|--|
| Internal DTD | **Ignored** §2.9 "...parameter entity (external or internal, ... because non-validating processors are not required to read them)" (indirectly §5.1 says the same)<br>Note: §5.1 Stops reading any ATTLIST or ENTITY declarationss after this |  **Ignored** <br>§2.9 implies nothing significant in here (e.g. used decls, comments, etc).<br>Note: §5.1 keeps reading ATTLIST and Entity decls | **OK** (§2.8/PE in Internal Subset)|
| External DTD | **n/a** (§5.1 do not need to load external subset)  | **n/a** (§5.1 do not need to load external subset. by §2.9 nothing significant here) | **OK** (can reference internal or external from internal or external subset) |
| Markup Declarations in internal subset | **Illegal** (§2.8/PE in Internal Subset) | **illegal** (§2.8/PE in Internal Subset) | **Illegal** (§2.8/PE in Internal Subset) |
| Markup Declarations in external subset | **n/a**  §5.1 do not need to load external subset  | **n/a**  §5.1 do not need to load external subset (by §2.9 nothing significant here) | **OK** §2.8 in def for external subset|
| Markup Declarations in the internal subset by way of a parameter entity (internal or external)  | **n/a**  §5.1 do not need to load external subset or external entity and §2.9 not required to read parameter entities.  | **n/a**  §5.1 do not need to load external subset or external entity (by §2.9 nothing significant here)) | **OK** §2.8 says that they can occur in external param entities, which by implication could then be expanded in internal subset)
| Entity Value | **OK** if internal declaration (implicit in §2.8). Note: §2.9 implies we do not have to read these at all, in which case the answer would be "n/a".<br>**n/a** if external since by §5.1 do not load external | **OK** if internal declaration (implicit in §2.8 and §2.9). Note: §2.9 implies we do not have to read these at all, in which case the answer would be "n/a"<br>**n/a** if external since by §5.1 do not load external | **OK** (§2.8 allows) |

Crucially: the definition of "read" is never given.

It is worth seeing these outcomes:
* internal General Parameter Entities only ever get expanded in attribute values and content
* external general parameter entities only ever gets expanded in content (not clear why attribute values are excluded)
* parameter entities either get expanded in the DTD, in entity values, or inside of markup declarations.
   * Crucially and uniquely, the places those parameter entities get expanded may, all, be within a parameter entity.

Another way to think of this:
* a general entity has two kinds of "parsing" that it may be subjected to
   * content: text, element start and end, general entity reference, char reference, comment, pi
   * attribute: text, char ref, general entity reference
* a parameter entity has three kinds of parsing
   * dtd: notation, attlist, entity or element declaration, comment, pi, space
   * markup declaration: space, words, literals, param entity ref
   * entity value: text, char ref, parameter entity reference


# Misc
Note that §2.4 in 1.0/1 said that you could have a & or < in the literal text of an internal entity declaration. This seems beyond reasonable, as & is explicitly diallowed in an entity value (because it introduces a reference).  interestingly, < is not disallowed, but it will always be interpreted as an error or as markup in the end.

# Implementation
* This doesn't scan all input to make sure it matches Char.  We check individual pieces. Often that is done indirectly.  Consider a nelement tag `<foo bar="baz"/>`. The `<`, ` `, `=`, and `/>` all are intrinsically good for just having been matched. `foo` and `bar` are checked to make sure they're legal names, and so are implicitily good.  We would only scan `baz`.




---
# NOTATION
## Declarations
- Notation declarations can be put anywhere in the internal or external DTD subset
## References
- Notations can be referenced from ENTITY declarations (`<!ENTITY ... NDATA notationName>`) that come either before or after the notation declaration
- Notations can be referenced from ATTLIST attribute notation enumerations either before or after the notation declaration.
- Notations can be referenced from ATTLIST attribute default values either before or after the notation declaration.
- Notations can be referenced from attributes in element start tags in the content.

# ELEMENT
## Declarations
- Element declarations can be put anywhere in the internal or external DTD subset
## References
- Element names can be referenced, of course, from the content portion of the document in start and end tags.  These are all (by definition) after all declarations.
- Element names can be referenced from ATTLIST declarations (`<!ATTLIST elementName ...>`). their declarations can be before or after the ATTLIST declaration.
- Element names can be referenced from content specs (children or mixed) in an element declaration. The named elements can be declared before or after (or not at all!) the element declaration

# ATTLIST
## Declarations
- Attlist declarations can be put anywhere in the internal or external DTD subset
## References
- Attlists do not have a name, and so are not referenced anywhere
- The individual attributes are referenced only from start (and empty) tags in the content of the document.

# ENTITY
## Declarations
There are 8 kinds of entity declarations.

### General entity
|  | internal entity | external entity |
|--|--|--|
| internally declared | in internal subset `<!ENTITY foo "bar">` | in internal subset `<!ENTITY foo SYSTEM "foo.ent">` |
| externally declared | in external subset `<!ENTITY foo "bar">`| in external subset `<!ENTITY foo SYSTEM "foo.ent">`|

### Parameter entity
|  | internal entity | external entity |
|--|--|--|
| internally declared | in internal subset `<!ENTITY % foo "bar">` | in internal subset `<!ENTITY % foo SYSTEM "foo.ent">` |
| externally declared | in external subset `<!ENTITY % foo "bar">`| in external subset `<!ENTITY % foo SYSTEM "foo.ent">`|

## References
### General entity
- in document content, between start and end tags.  By definiton this is always after the GE declarations
- in attribute values of start/empty tags internal entities may be referenced. By definition this is after all declarations.
- in general entity values: These can be before or after those entities are declared. indeed, if the entity is never referenced, the GE referenced in its value need not exist.
- in attribute value defaults: These must follow the declaration of the general entity (§4.1)  (this is an odd requirement, in the overall scope of the specification)

### Parameter entity
- in the internal DTD subset between markup declarations. These must be after the declaration of the entity
- in the external DTD subset between markup declarations. These must be after the declaration of the entity
- In the external DTD subset within NOTATION, ATTLIST, ELEMENT and ENTITY markup declarations. (presumably anywhere after the `<!FOO` portion, always between space delimited boundaries, and in the case of ELEMENT declarations in restricted portions of the children production)
- In the initial part of conditional sections (`<![%foo;[ ...`)
- In entity values. In the declaration of internal entities, these must follow the declaration of the referenced entity (§4.1 and §4.5). In the bodies of external entity values, any PE refs must have been declared before this entity is used.


# REPLACEMENT TEXT (§4.5)
- internal entities expand char refs and pe refs
- external do not do either.  

# STANDALONE
- Reminder, a standalone document does not mean that there are no markup declarations in external entities or subset, but just that such declarations can't affect the interpreation/validity of the document.


# Summary of PERefs:
- Internal entities have their perefs resolved at the point of declaration
   - "resolved" means that the referenced entity is looked up. Thus it must already have been declared.
- external entity A with a reference to entity B does not resolve B until A is used.
- A character reference (once you find a &) must be entirely within one entity.
- By 18 markup doesn't have to be so contained.

In conclusion:
- When we use an enternal entity, we must do the charref and peref resolution, but then we can dump the results into a parser and it is juse fine.  

# Mixed versions
How should this processor respond if it encounters different xml versions while processing a document (e.g. the XML Declaration is 1.0, but some Text Declaration is 1.1, or vice versa)?

This varies across revisions of the XML standard.  As a background, note that version 1.1 didn't formally exist until early 2004 (though drafts of it were being worked on in 2002).  Also note that all the text for the 1.0/* cases is from §2.8.0, while that for 1.1/* is from §4.3.4

* 1.0/1 and 1.0/2: Pretty silent about what happens if a 1.0 document references a version other than 1.0 (though, it does allow a very wide syntax for version numbers).  This is syntactically allowed, but it is also declared that this is an error if anything but "1.0" is specified.  Thus, this processor will report an XmlError if it is not 1.0 (it will, however, nonetheless process the non 1.0 document As a 1.0 document, so if it fails some other WF or validity constraint, it will produce an error)
* 1.0/3 and 1.0/4: These changed the syntax for `VersionNum` to only allow `1.0`. (this is interesting, since 1.0/3 was released the same time 1.1 was) (note that the eratta that produced this change is at https://www.w3.org/XML/xml-V10-2e-errata.html#E38 ) Thus, this processor considers the presence in an XML Declaration or Text Declaration of a version value that is not 1.0 to be a well formed error. It will then process the contents as 1.0, regardless of the specified version.
* 1.0/5: This allows versions other than 1.0 (`/1.[0-9]+/`) in both the XML and Text Declarations.  However, then it gets very murky. The spec says that it should process a 1.x document as a 1.0 (it does not explicitly say what should happen with external entities).  Left at this, I would think any 1.x version would not be an error. The spec does say "should not specify a version number other than '1.0'.", which I would interpret as a warning, however several tests ( among them:  `ibm-1-1-not-wf-P77-ibm77n13.xml`, `rmt-e2e-38` and `rmt-001`) consider a 1.0 document referencing a 1.1 entity to be not well formed.  However, `x-rmt-008b` allows the XML Declaration to contain 1.7. Again, this is not reported as an error, but instead a warning, and so is still valid.   Thus, we consider a non 1.0 as a warning in an xmldeclaration but an error in an text declaration (if we are processing it as 1.0). 
* 1.1/1 and 1.1/2: Here we have a problem. Going by the pattern established in 1.0/3, above, then any reference to a 1.0 document is in error, since the syntax only allows 1.1 as a version number. Yet, §4.3.4 explicitly allows external entities with a version 1.0 to be processed (with the stipulation that they are processed as 1.1 documents). This processor will not report an error if a 1.1 document tries to import a 1.0 entity, unless that entity has some other portion of its syntax which is not correct.

Added notes:

* Since 1.0/1, the absence of an XML Declaration implies 1.0
* ConformanceVersion: This processor has the ability for the user to force a particular version interpretation (that is, regardless of what is in the XML or Text declarations, the user can insist the document be processed as, say, 1.0/4 or 1.1/2). If the user doesn't specify a particular conformance version (the normal case), the conformance version is derived from the XML Declaration (or inferred to be 1.0).

In summary:

* In all cases, external entities will always be processed according to the syntax, wellformedness and validity rules of the ConformanceVersion.
* If the ConformanceVersion is 1.0/1-1.0/2, the version numbers in the XML And Text declarations will not report errors (unless they don't match the very generous rules)
* If the ConformanceVersion is 1.0/3-1.0/4, then if the version numbers in the XML and Text Declarations are not 1.0, an error will be produced.
* If the ConformanceVersion is 1.0/5, then if the version numbers in the XML Declarations are not 1.[0-9]+, an error will be produced. The version number in Text Declarations must be 1.0.
* If the ConformanceVersion is 1.1/*, then if the version number in the XML Declartion is not 1.1, it will report an error, and if the version number in the Text Declaration is not 1.1. or 1.0, an error will be produced.


<!--
   Revised hypothetical:

   Issue: xmllint notices if a PE entity is not declared at the declaration of an entity value
   Issue: xmllint doesn't allow % in an entity value

   entity values are untouched until usage
   At usage time, the algorithm is:
      if content is a plain character, then ad that character to he parser
      if content is a character reference, add that as a distinct character to the parser (essentially pass it through as a refence)
      If it is a peref, then repeat, except that charrefs ar expanded to strings and addedto the parser value

These can be used:
- in dtd
- in some markup declarations
- in entity values



NOTATIONS (4.7)
   - no notes.
   - xmllint NDATA values may be forward referenced
ELEMENT (3.2)
   - parsing
      - Base parsing
      - PERefExpansion parsing
         These are both ok
            <!ENTITY % fourfour "&#40;one&#41;">
            <!ELEMENT four %fourfour;>
            <!ENTITY % fivefive "&#37;fourfour;">
            <!ELEMENT five %fivefive;>
   - Questions:
      √ Must PE Refs be before this?
         xmllint barfs if it is not before (even if it is after it doesnot like it)
         Note: toplevel pefefs must not have charrefs. but second order ones may
      √ If the element declaration is never used, Do we care?
         - how would you even know? (except for PERefs)
      √ Must elment names be before this?
         - can't tell from the spec. xmllint does not care. It honors it if it comes afterwards 
            - Only warning if element is not declared (3.2)
ENTITIES (4.1)
   The declaration of a parameter entity must precede any reference to it.
   Similarly, the declaration of a general entity must precede any
   attribute-list declaration containing a default value with a direct
   or indirect reference to that general entity.

ATTLIST (3.3)
   It is an error if an attribute value contains a reference to
   an entity for which no declaration has been read.  (3.3.3)
   - default entity names can be forward referenced
-->


This makes the decision: if an entity can not be found, this will report an error, but it will also expand the entity as []
However, a ref with no declaration will leave the reference in the file



-----
2.3.1 notes that you can have an entityvalue with "<" just fine.  It is legal.  It will just be invalid in all uses.
   [ is that true?  even in a combination of pe's?]

2.4: note that this says < may not appear anywhere except comment, pi or cdata. otherwise must be escaped.

2.5
- perefs not in comments
2.6 not in pi's

2.8
- peref's anywhere in the dtd (internal and external subsets, and external parameter entities) EXCEPT literals and ignored conditionalsections, (but may be in entity value literals)

2.8 
- PE replacement text must contain whole markup declarations. those may not span  [in the internal subset]
   << really? how to enforce? >>

2.8 PE refs must not occur in internal markup declarations (but may appear where decls can happen)
   -- What it means "in markup declarations" here means anywhere between <! and >, whether in literal or not.
   -- 31-notInMarkupDeclarations.xml:10: parser error : PEReferences forbidden in internal subset
Of course, entity decls in internal subset take precedence over external.

2.9 external markup declaraton: markup occurs in the external subset or in a parameter entity

3.1
   ttriabute values ay not contain direct or indirect references to (value-external) entities.
   Replacement text of entitiesmust not contain <

3.2.1
   PE RT must be nested within () groups in a content spec
   PE RT should not have some non-blank, adn should not start or end with | or ,

3.3.3
   attr value normalization: char refs are added to the normalized value as their char, whitespace collapsed chars added, entity references, do the same for the replacement text

3.3.3 - attr value may not have an entity with no declaratoin (wf error)

3.4 in a conditional section has a peref, it must have whole conditional sections in it. not partial
- again, pe refs are not recognized in ignore'd conditional sections
- interesting that it notes that the keywoard can be a pe ref.

4.0.0 entities
   - pe and ge distinction. live in different name spaces
     - remainder "plain" "entity" means ge.

4.1
   - parsed entities may not be recursively defined (either directly or indirectly)
         - this happens easily with pe, as long as processor doesn't add until already loaded.
         - should test
   - perefs may not appear outside of dtd
   - ge references may not contain name of an unparsed ge entity
   - declaration of a param entity must preceed any reference to it
   - ge decl must precede any attlist containing a default value with a direct or indirect reference to it
   - non-validating do not need to read any general entity declarations occurring in param entities or in external subset
   - internal entities are always parsed entities

4.3.2
   - external entities must match extParsedEnt
   - Only parsed entities referenced direct or indirect in the doc must be well formed.
   - internal and external parsed entities must match content
      [but there are severe restrictions on some usage. and what does that mean...]
   - nesting: general entities: the structures in the document must be properly nested (no start, end, empty, elemnt, comment, pi char ref or entity reference can cross)

4.4
   - reminder: external parsed general not allowed in attr value. pe refs ignored
   - content: ignores pe, adds general
   - in entity value: pe added, general ignored
   in dtd - parameter: included, general not allwoed

4.5
- literal entity value is the value in the declaration, or the text in the entity
internal: replacement text: content of entity after replacing char refs and pe refs.
external: replacement text is content afte rreoving text decl, (but char refs and param refs not expanded
- pe and ge refs must be entirely within the literal text

4.6 < can be used as &#38;

5 has to do with validation
appendix D does more on entity reference expansion
----

?? extParsedEnt


Constructing repalcement text:
   - attribute value only has Gerefs, geStart/end, text and charrefs
   - geref : constructing replacement text:
      sequence of characters: text, charref chars, and geref. 
         When you see the geref, replace with the same.
         Note that a charref can't span the geref boundary. (but it can span the peref)
         Which means each gref is a separate parsing context.
         - need to protect against recursive.

- Should expand allow for validating vs. not expansion?

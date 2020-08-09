# AttFix

Once a document has had its entities expanded, we have enough information to make some modifications to attributes on element starts.

There are two broad tasks to be done:

* Attribute normalization
* Filling in default values for attributes

## Normalization
Attribute value normalization is, superficially, pretty straightforward (and is discussed in §3.3.3)

* If the attribute value type is `CDATA` then replace all whitespace characters with `' '`.
* Otherwise, not only replace whitespace chars with `' '`, but collapse adjacent sequences of spaces to a single space, and remove leading and trailing spaces.

There are a couple caveats to this:

1. If there is a character reference in the attribute value (`<el attr="hi &#65;...`) that reference gets passed along unchanged.
   * In this case of this syste, that will be referenced as a distinct CharRef PToken and that will be simply passed through.
2. When entities are referenced, their replacement text gets processed in the same way. Note that such references are always general entity references (though the replacement text may have been constructed from parameter entities)
   * In the case of this system, such references appear to this as a GeneralEntityStart and GeneralEntityEnd PToken with Text and CharRef PTokens (and possibly other GeneralEntityStart/End's) between (all records of any parameter entities involved will not be visible here by this point)
3. CR's and LF's need a bit of attention. As these sequences (CR, LF, and CRLF) are read in, they are all normalized to LF on input. Of course, char refernces may refer to CR or LF, but those we can ignore. A question arises what happens in these cases

   ```xml
   <!ENTITY CRLF_INDIRECT "&#xD;&#xA;">
   <!ENTITY CRLF "&CRLF_INDIRECT;">
   <body attr="&CRLF;" attr_indirect="&CRLF_INDIRECT;">
   ```
   * That is, by the time we get to processing the attribute, we'll have a TextPToken with content of `"\r\n"`
   * Revision 1.0/1 of the XML spec says `\r\n` should be normalized as `' '` when it "is part of an external parsed entity or the literal entity value of an internal parsed entity"
      * If it is part of an external parsed entity as literal characters 0x0D and 0x0A, then that will already have been converted to 0x0A by §2.11.  If it is specified with character references, then those character references will be passed through unchanged, as discussed above.
      * if they appear as the literal entity value (see §4.5.0) of an internal entity value (that is, before the value is converted to replacement test) it will also have been converted to a single `\n` by §2.11
      * In short, this bit of phrasing is a red-herring, and appers to be trying to help support what is said in §2.11 but at a glance implies other processing.
   * Subsequent versions and revisions all indicate it should be normalized as two spaces: `'  '`.
      * I don't see any indication that this kind of 
   * So, what happens in the above example?
      * The char references in CRLF_INDIRECT will be processed as is normal for internal entities.
      * When referenced in the attribute value, these will be parsed, as literal `\r` and `\n` characters, and will be normalized to two spaces.
      * You can essentially see this in the second row example in §3.3.3 or in the corresponding unit test for this feature.

## Default attributes

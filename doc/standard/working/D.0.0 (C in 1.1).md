## D. Expansion of Entity and Character References (Non-Normative)

> 1.0/1: Moves to "C" of course

This appendix contains some examples illustrating the sequence of entity- and character-reference recognition and expansion, as specified in "4.4 XML Processor Treatment of Entities and References".

If the DTD contains the declaration

```
<!ENTITY example "<p>An ampersand (&#38;#38;) may be escaped
numerically (&#38;#38;#38;) or with a general entity
(&amp;amp;).</p>" >
```

then the XML processor will recognize the character references when it parses the entity declaration, and resolve them before storing the following string as the value of the entity "example":

```
<p>An ampersand (&#38;) may be escaped
numerically (&#38;#38;) or with a general entity
(&amp;amp;).</p>
```

A reference in the document to "&example;" will cause the text to be reparsed, at which time the start- and end-tags of the "p" element will be recognized and the three references will be recognized and expanded, resulting in a "p" element with the following content (all data, no delimiters or markup):

> **1.0/2: Replaced:** A reference in the document to "&example;" will cause the text to be reparsed, at which time the start- and end-tags of the p element will be recognized and the three references will be recognized and expanded, resulting in a p element with the following content (all data, no delimiters or markup):


```
An ampersand (&) may be escaped
numerically (&#38;) or with a general entity
(&amp;).
```
A more complex example will illustrate the rules and their effects fully. In the following example, the line numbers are solely for reference.

```
1 <?xml version='1.0'?>
2 <!DOCTYPE test [
3 <!ELEMENT test (#PCDATA) >
4 <!ENTITY % xx '&#37;zz;'>
5 <!ENTITY % zz '&#60;!ENTITY tricky "error-prone" >' >
6 %xx;
7 ]>
8 <test>This sample shows a &tricky; method.</test>
```
This produces the following:

* in line 4, the reference to character 37 is expanded immediately, and the parameter entity "xx" is stored in the symbol table with the value "%zz;". Since the replacement text is not rescanned, the reference to parameter entity "zz" is not recognized. (And it would be an error if it were, since "zz" is not yet declared.)

* in line 5, the character reference "&#60;" is expanded immediately and the parameter entity "zz" is stored with the replacement text "<!ENTITY tricky "error-prone" >", which is a well-formed entity declaration.

* in line 6, the reference to "xx" is recognized, and the replacement text of "xx" (namely "%zz;") is parsed. The reference to "zz" is recognized in its turn, and its replacement text ("<!ENTITY tricky "error-prone" >") is parsed. The general entity "tricky" has now been declared, with the replacement text "error-prone".

* in line 8, the reference to the general entity "tricky" is recognized, and it is expanded, so the full content of the "test" element is the self-describing (and ungrammatical) string This sample shows a error-prone method.

> 1.0/2 Replaced: * in line 8, the reference to the general entity "tricky" is recognized, and it is expanded, so the full content of the test element is the self-describing (and ungrammatical) string This sample shows a error-prone method

> 1.0/5: Adds the following (not in 1.1/1, but back in 1.1/3):

In the following example

```
<!DOCTYPE foo [ 
<!ENTITY x "&lt;"> 
]> 
<foo attr="&x;"/>
```

the replacement text of x is the four characters "&lt;" because references to general entities in entity values are bypassed. The replacement text of lt is a character reference to the less-than character, for example the five characters "&#60;" (see 4.6 Predefined Entities). Since neither of these contains a less-than character the result is well-formed.

If the definition of x had been

```
<!ENTITY x "&#60;">
```
then the document would not have been well-formed, because the replacement text of x would be the single character "<" which is not permitted in attribute values (see WFC: No < in Attribute Values).

### Appendix: Standards
* 1.0/1: https://www.w3.org/TR/1998/REC-xml-19980210#sec-entexpand
   * Annotated: https://www.xml.com/axml/axml.html
* 1.0/2: https://www.w3.org/TR/2000/REC-xml-20001006#sec-entexpand
* 1.0/3: https://www.w3.org/TR/2004/REC-xml-20040204/#sec-entexpand
* 1.0/4: https://www.w3.org/TR/2006/REC-xml-20060816/#sec-entexpand
* 1.0/5: https://www.w3.org/TR/xml/#sec-entexpand
* 1.1/1: https://www.w3.org/TR/2004/REC-xml11-20040204/#sec-entexpand
* 1.1/2: https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-entexpand
* 1.1/3: https://www.w3.org/XML/xml-V11-2e-errata



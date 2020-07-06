# Tiramisu

## The XML standard
### The XML Docment: DTD and content

An XML document can be thought of as containing two parts:

1. A document type definition (DTD) which describes the syntactic constraints of the content
2. The document content, itself.

The "extensible" portion of XML's name comes from the fact that the "vocabulary" you use to construct the content can be fully customized to suit your needs. The "meta information" in the DTD describes what that vocabulary is and how it can be constructed.

Thus, it is possible to describe a legal constract as readily as a novel with XML.

(it is also possible to sprinkle comments and things called processing instructions throughout both the DTD and the content).

### Entities
An XML document is divided into pieces called entities. There are several kinds of entities:

* The document entity: This is likely what you think of as the main document. The simplest XML documents only have a document entity.
* The external DTD subset entity: An optional set of information that contains declarations of parts of the document. This augments the optional portion of the DTD found in the document entity (the internal DTD subset)
* Parsed entities: These are entities that contain XML text. They can be "included" in certain parts of the XML document. They come in two sub-types:
   * Parsed parameter entities: these contain XML text that can be added to either DTD subset
   * Parsed general entities: these contain XML text that can be added to the content of the XML document.
* Unparsed entities: These do not contain XML text (e.g. maybe they contain jpeg data), and can only be referenced from element attributes in the content of the document.

#### Example: To make all of these concrete:

##### Document entity
```xml
<?xml version="1.0">
<!DOCTYPE chapter [
   <!ELEMENT chapter #PCDATA>
   <!ENTITY % peExaple "./parsed-parameter.ent">

   %peExaple;
] SYSTEM "./external-dtd-subset.dtd">
<chapter bkImage="funny">
This is an example of &genEntity;.
</chapter>
````

##### Parsed parameter entity ( `parsed-parameter.ent`  )
```xml
<?xml version="1.0">
<!ATTLIST chapter
   bkImage ENTITY #REQUIRED>
````

##### External DTD subset ( `external-dtd-subset.dtd` )
```xml
<?xml version="1.0">
<!ENTITY genEntity SYSTEM "./parsed-general.ent">
<!ENTITY funny SYSTEM "./funny.jpg">
````

##### Parsed general entity ( `parsed-general.ent` )
```xml
<?xml version="1.0">
an XML document made up of several entities
````

##### The logical document tcontent hat those multiple entities describe
The document definition for this is:
```xml
<!DOCTYPE chapter [
   <!ELEMENT chapter #PCDATA>
   <!ATTLIST chapter
      bkImage ENTITY #REQUIRED>
   <!ENTITY funny SYSTEM "./funny.jpg">
]>
```

```xml
<chapter bkImage="funny">
This is an example of an XML document made up of several entities.
</chapter>
```

While the actual document is pretty small, the document definition tells us several important things, including:

* The root element has to be  called `chapter`
* `chapter` may only contain plain text (`#PCDATA`)
* `chapter` must have an attribute called `bkImage` which contains a reference to an unparsed entity.
* `chapter` may not have any other attributes.

This helps us make sure that the document is correctly written.

### Pieces of an XML document

* Character references ( `&#65;` )
* General entity references ( `&name;` )
* Parameter entity references ( `%name;` )


## The architecture of Tiramisu
Tiramisu is deliberately designed as a multi-layered, or phased, processor. While upper layers may know some details about lower layers, as much as possiblde these are kept as distinct from each other as possible. In theory, one should be able to remove layers that one does not want (e.g. if you do not care about validation of an XML document, you can remove the validation layer without harm), as well as add other layers into the processing.

The Tiramisu stack looks like this:

```
   to json
   xtoken
   valid
   wellformed
   expand
   token (parse)
   SToken, Extractors, error
   basic, error
```

The bottm-most layer is just fundamental bits used by other parts of the system.

The SToken and Extractors "packages" provide a way to extract "string tokens" (STokens) from a series of input strings. Specifically, strings are fed into an STokenSource, and then particular syntactic units (e.g. a space delimited word, or any series of characters up to a particular other character, or any of the XML markup starts (e.g. `<![`)) are extracted from the STokenSource and delivered as STokens.  While the default set of extractors does have knowledge of some XML things, the SToken system does not, and other sets of extractors can be provided to it.

Above this is the parsing system. This has significant knowledge of XML syntax, and it use the SToken system to deliver it sets of STokens which it assembles into PTokens (Parsed Tokens).  What comes out of here is equivalent to an AST, however since this is a streaming system and not a tree, it is more like an Abstract Syntax Stream, than an Abstract Syntax Tree.  the PToken system deliberately takes a very liberal interpretation of the XML syntax requirements, and it will readily parse documents that violate many, many XML rules. This should allow it to consume severely broken XML documents and keep on going.

Above this layer is the Expand system.  This expands parameter entity and general entity references throughout the document. This is easily the most complex part of this system, since the rules and behaviors of entity expansion are complex.  Significantly, this ultimately must reach back into the PToken system to do some re-parsing of content in three cases: entity content must be (re-)parsed in some circumstances, markup declarations with parameter entitiy references within them may need some parsing to be done, and some conditional sections (specifically, those with a parameter entity references that make them include) may need parsing as well.  This is accomplished by the caller providing some functions that presumably ultimately invoke some of the PToken system.  This aspect of this system is probably different than most parsers, since the resolution of these "includes" is done very far removed from the parsing phase.

The wellformed system examines PTokens it is parsed and validates them according to the rules of XML. It is at this point that the system will start to really notice that a malformed XML document has been handed to the system. If you know that your documents are well-formed, you can simply omit this and get the consequent performance improvement. Alternately, if you need to relax or even change some of the ordianry XML well formedness rules, you can do that here.

The validity system further examines the PTokens and does checks for XML validity, reporting a different set of errors.

What comes out of this is either a problematic document (if there are Error instances in the stream) or a set of tokens known to represent a good document. At this point the XML document can be manipulated.  For example, one manipulation takes the PTokens and produces XML Tokens (XTokens).  These are much simpler representation of the same information that have discarded low-level STokens and are consequently much easier to work with.

Alternately, one could turn around and re-serialize the XML document since there is enough information in the PTokens to reconstruct the original document, or to produce a normalized version of the document, or write out a single document entity instead of a set of multiple entiies. 






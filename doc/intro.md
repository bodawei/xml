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


## The architecture of Tiramisu
Tiramisu is deliberately designed as a multi-layered, or phased, processor. While upper layers may know some details about lower layers, as much as possiblde these are kept as distinct from each other as possible. In theory, one should be able to remove layers that one does not want (e.g. if you do not care about validation of an XML document, you can remove the validation layer without harm), as well as add other layers into the processing.



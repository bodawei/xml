# XML Toolkit for JavaScript

This is the XML Toolkit for JavaScript module



YAXT

What is it

- Yet another set of tools for working with XML in JavaScript languages
- This is a completely standards compliant xml parse
    - exercises the w3c xml test suite
- Can do validation with dtds etc
- Also tolerant of very bad xml.
- Provides roundtrip xml to json/javascript conversion

Why
- was playing with doing epub work, and was using node.js.  Couldn't find a good library

Example usage

- read in a file
    - munge
    - convert back

Technical details

- this is designed to be a multi-layered set of tools
    - There's a low level parser which chews through xml and spits out a set of "tokens"
    - higher level tools layer on top of this
        - e.g. one which takes these tokens and produces a javascript object
        - e.g. one which strips out warnings and errors
        - e.g. one which applies xml validation
        - e.g. one which genrates a dtd from a document
        - andthere could be many others
- goals is to keep addingother tools as there is interest
    - xml schema
    - json schema
    - etc

### ENTITIES
Entities can be fairly confusing, but they do not need to be.

An entity is just a named chunk of contnet which can be used elsewhere. Basically, a variable.

While entities must be declared in the DTD, their content can come from one of two places:
* internal: The content is actually "physically" in the DTD (e.g. <!ENTITY myEntity "my content in the DTD">
* external entities: Here, the content lives in a different file (or some other storage location). These are referenced by a URL of some sort

Note, though, that there are two kinds of entities: General entities and Parameter entities.  General entities can be used in your document, while Parameter entities are used within the DTD.

Let's step aside from entities for a moment and look at where your document content comes from:

* The main document (content between tags, and in the attribute values)
* Any general entities referenced from the document (or from other entities referenced from the entities referenced from the document). These can appear in the content between tags or the attribute values
* Any default values for attributes. These come from the ATTLIST declaractions in your DTD.  Or from general entities refered in the default declarations

From this, you can make reference to general entities in any of the places you can get the content for your document.


Any General Entities referenced from the document or attribute defaults must have been declared before they are used.
However, general entities in entity values only need to have been declared before they are used, not before it is declared.

Another factor to keep in mind here is that the DTD is actually made up of two parts: the internal and the external subset.  The internal is declared in the document entity itself.  The external is another file.  You can imagine the goal here is most documents use a common DTD, which is stored in an external location, but some want to 'override' or otherwise influence the interpretation of the common DTD, and so this is what the internal subset is for.  In the XML world, you need to consider the internal as coming BEFORE the external, because here it is first declaration which wins.  This means, if you declare an entity in both the internal and the external, the internal wins.  This has the somewhat surprising effect that you can reference an internal general entity in the attribute declaration in the external subset.  This probably hurts your head, but that so far this is probably the only thing which really hurts.

The next thing to consider, then is parameter entities.  You can think of these as serving four roles:
1)They are a way to declare some parts of the DTD in a parameterized way.
2) They can be used in entity value declarations
3) They can be used in the middle of any DTD declaration
4) This is really a special case of #3, which is that they can be used in a conditional value expression.

Most of these uses are a bit strange.

It is important to note a couple things:
1) parameter entities always have to be declared before they are used. *Even in an entity value*
2) In the internal subset, you can not make use of 2-4









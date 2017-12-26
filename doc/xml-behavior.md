
# XML: Step by Step

## Introduction
This guide will walk you through all the pieces that makes up an XML document.  When you finish reading it, you'll know more than most people who haven't read this, and your next step would be to read the actual standard where there are some very fine detils that this doesn't mention.

## What is XML?
The name stands for eXtensible Markup Language.

It is a system for "marking up", or adding extra meaning, to a set of text.

While it was used heavily for software programs to exchange information for a decade or so, it's origin was for adding extra meaning (structure) to things like books.  It still is pretty well suited for that, and is not terribly well suited for just exchanging data structures between softare programs.

## Document Entity
In the language of XML, an XML document can be made up of multiple chunks (generally, multiple files, but they could be multiple database entries, or other things). Each chunk is called an Entity.  We'll talk more about entities later.

For now, just consider: any XML Document has one entity (file) that one starts reading, and it almost always (99% of the time) contains most or all of the XML content.  This is called the Document Entity.

## XML Declaration
The first line in any XML Document is supposed to be something called the XML Declaration. This simply is a bit of text that makes it explicit that this is an XML entity, what version it is, what character encoding it is in, and whether it is "stand alone".  We'll talk about the encoding and stand alone-ness much later.

The typical XML Declaration looks like this:
   <?xml version="1.0" encoding="utf-8"?>
This must be the very first thing in the document entity, it must have a version. You'll see some XML Documents without this,and technically they're invalid.

## Content
After the declaration, you can have content (there may be other things between the declaration and content, but they are optional and so we'll talk about them later).

Content is made up of elements, and elements can contain text and other elements.

In XML, you can tell where an element starts by seeing its start tag, which looks something like <myElement>

You can tell where an element ends by seeing its end tag: </myElement>
Between them, you can have any text and any other elements (which are marked with their own start and end tags)

Thus, this is a perfectly good XML Document:

   <?xml version="1.0"?>
   <element>
   </element>

Note that from XML's standpoint, there is one character of text in that element: a \n character (even if your editor uses \r or \r\n, by the time your XML reader has read it, it comes out as \n).

This is also perfectly good:

   <?xml version="1.0"?>
   <book>
      <artist>
         <song>
            <verse>
               La la la la la la la!
            </verse>
            <verse>
               La la la la la la la!
            </verse>
         </song>
      </artist>
      <artist>
      </artist>
   </book>

You can have rules specifying which elements can and can not be put in other elements, what order they must occur in, etc.  We'll talk about that later.

You can also have elements that have nothing in them.  That is:
   <element></element>
can also be written:
   <element/>
There is no deep difference between these, except that in some cases rules can be declared that say that an element can be written in the latter way but not the former.
This kind of element is mainly useful for indicating the presence of something non-textual. For instance, you might represent an image with something liek this.

### Special characters, like "<"
What if you want to have a character like < in your content?  If you add one, XML is going to thnk you're declaring the start or end of an element, so it'll be unhappy with you:
   <element>
      5<6
   </element>
"Missing closing '>' of element named '6'"

You can get arond this by using &lt; (Less Than) instead.  these are called entity references, and we'll talk about them in more depth later.  For now, you can just use this like:
   <element>
      5&lt;6
   </element>

## Attributes

In some cases, you may want to add some extra information to an element.  For instance, you might want to indicate what language the text within it is. Or you might want to indicate the author of that text. XML allows you to attach certain attributes to elements. That is, adding some "metadata" to the structural elements.  So, you could have something like:

   <?xml version="1.0"?>
   <anthology>
      <paragrah language="french" author="Le Grande">
         blah blah blah
      </paragraph>
      <paragrah language="Chinese" author="李慕白">
         啦啦啦啦啦
      </paragraph>
   </anthology>

## An interlude

At this point, you know as much about XML as probably 50-60% of the people out there.  Furthermore, you probably know enough now that you can basically read 90% of the XML documents that exist.  But, as you can see below, there's a lot more to XML than this.

Before we delve into the guts of XML, I (your writer) want to point out a philosophical point.

In the early days of the world wide web, XML became a very fashionable thing. Its original purpose of XML was doubtlessly to allow you to add information about where structural things like paragrahs, chapters, quotations, and so forth were in an otherwise unstructured blob of text. However, as it became fashionable, it began to be used for many things, including representing computer data structures.

If you look at a book marked up in XML, you'll see that if you took away the start and end tags and attributes, the "important" information isn't affected, but just your ease of interpreting it (much like if you took away the spaces and periods, you could still read it, it just wouldn't be as easy)
   <chapter>
      <quote>
         A beginning is a very difficult time.
         <speaker>Princess Irulan</speaker>
      </quote>
      <paragraph>
      The man in blak fled across the desert, and the gunslinger followed.
      </paragraph>
   </chapter>
versus
   A beginning is a very difficult time.Princess IrulanThe man in blak fled across the desert, and the gunslinger followed.

However, XML started to be used for things like:
   <customer>
      <name>Fred Jones</name>
      <address>555 Main Street</address>
   </customer>

and for things like:
   <customer name="Fred Jones" address="555 Main Street">

This latter usage is particularly odd, given the original purpsoe of XML. In this case, the important information (the name and adress) are being stored in attributes, which originally seemed to be there to carry incidental metadata, not core content.

While I, your humble author, has an opinion about these different uses, it is important to point out that all of them exist. They're all valid XML.

Now that you have some orientation about XML, let's begin to delve in more deeply.

## Comments

## Procesing Instructions

## CData Sections

## Document Types

## DTD's
(elements and attributes in more detail)
### Internal Subset

### External Subsets

### Element Declarations

### Attribute Declarations

### Notation Declarations

### Entity Declarations


# Entities
Another complexity with XML is the handling of entities.

In the land of XML, each chunk of information is called an entity.

The main document is, itself, an entity. Often it is called the document entity, creatively enough.

You can also declare "external entities". You do this with a declaration in the DTD like this:
   <!ENTITY externalEntity SYSTEM "http://somewhere.com/myEntity.xml">
This indicates that there is another entity that can be found at the URL specified here. With this kind of a declaration, you can then include &externalEntity; in your document, and it indicates that the contents of that file should be inserted at that location. It is a variable or something like a mail-merge marker.

You can also declare "internal entities". These are declared like this:
   <!ENTITY internalEntity "some value">
In this case, the entity named "internalEntity" is the text "some value", so whenever you use &internalEntity; in your document, it will ultimately be replaced by "some value". These are called "internal entities" because they are specified within the DTD, and not in an external file.

Let's stop for a moment to note that this can get confusing, since there is an "external DTD subset", and it can contain the declarations for both internal and external entities. I don't know about you, but my head often explodes when I think about an "internal entity" in the "external subset". (who picked these names?)

Some major reasons for having entities are:
* You have some value that you need to use repeatedly in your document (e.g. maybe you have some legal document and you need to repeat an address a dozen times in the document.  How much easier to say <!ENTITY address "23 Hayward Ave, Columbus, Ohio"> and thereafter just have "... the claiment at &address;..." in your document rather than re-typing he same value over and over
* This allows you to have values (especially with external entities) that can be changed easily independent of the main document. For instance, you might have an external entity that contains your company's motto. You can reference it as an external entity from every document that you create, and then whenever you change the motto you can update that one file and thereafter all your documents will show the correct motto.

Every external entity can (optionally) start with something called a Text Declaration. This is simply a statement like <?xml version="1.0" encoding="utf-8"?> which states what version of XML it conforms to and what encoding the data is in. Notably, and importantly, this declaration is NOT part of the content of the entity itself (that is, if you reference that entity with &entityName; in your document, when the content is subsituted in, it will not include that declaration).

Note: You might have noticed that the external subset is, itself, an external entity. It, too, can start with a text declaration.

## Let's talk Nitty-Gritties

Entities can be referenced in three places:
* They can be referenced in the "content" of your document (that is, in the text between <element> and </element> tags)
* They can be referenced in attribute values (that is, in <element attribute="here&myEntity;">)
* They can be referenced in other entities (internal or external) (that is <!ENTITY foo "another&bar;">)

There are many places they can not be referenced. They can not be referenced in the DTD (unless that is within an entity value or attribute default), they can not be referenced inside of element tags (unless within an attribute value), they can not be referenced inside an entity reference (e.g. &my&someRefName;;), a character reference, or outside of the outermost element declaration.  If they are in comments or processing instructions,they will be ignored.

This introduces a couple things to be careful of:

First, the tet from each entity is processed as if it appeard in the location it is referenced. This means you can have an entity like
   <!ENTITY myParagraph "<para>some stuff</para>">
This may work fine when used in the document content, or it may cause an error (it would cause an error if, for example, you are not allowed to put a "para" element in that location).

That entity could also be referenced from another entity.

However, if this entity were referenced from an attribute value, it would ultimately cause an error to happen, because <'s are not allowed in attribute values.  If we ignore that rule, then it is important to note that the entity still would not be interpreted as an element, since you can not put elements in an attribute value. It would only appear as a sequence of charaters.

However, there is an important details about this notion that the entity reference is replaced by the text from the entity: Entities can not be used to represent part of an element's tag.  For instance, this is not legal:
   <!ENTITY myParagraph "blah blah</para">
(then, in your document)
   ... then <paragraph>&myParagraph;graph>
This is illegal in two ways:
* First, essentially this says that the entity reference is appearing in the middle of a tag, which is not allowed by the basic syntax of XML
* Furthermore, the "Well formed" rules of XML says that if an entity contains the start or end tag of some element, it must also include the end or start tag. That is, it must include complete syntactic chunks. It can also not inclue partial entity references.

Similar things hold for comments, processing instructions and the like: you can't have part of a comment in an entity value and part not in it.


### Declarations
When an entity is declared with a particular name, then any subsequent entity declarations with the same name are ignored.  Thus in this case:
   <!ENTITY foo "bar">
   <!ENTITY foo "oof">
Then, later: &foo; will be replaced by "bar".
Since the internal subset is considered to be processed before the external subset, it will override anything declared at any position in the external subset.

### References
As far as entity references are concerned, the value of an entity is not processed until it is actually referenced.  Thus, it IS possible for an entity to contain the reference of an entity that is declared after it.

The enterprising among you may notice that it is therefore possible to set up an entity that references another that references itself, and thus creates something that would, on expansion, be infinitely long. This is, unsurprisingly, illegal in XML. Don't do that, or expect something bad to happen.

### Parsing
It is possible to have a non-validating XML parser which can parse a full XML document entity, but does not replace some or all of the entity references in the document. That is, you could imagine a document full of entity references, but all of those entities are declared in the external subset (which a non-validating parser is not obligated to read). The point here, in terms of understanding the entity references is that the document should still be parsable without knowing the value of an entity.

In practice, some languages have some kind of import facility which allows you to replace arbitrary parts of the input text with some values. The C/C++ preprocessor is an example of this.  Entities behave fairly differently because they are not applied entirely before the document is parsed (if they were, it would be no problem to have a reference that happened at arbitrary points in the document), but is instead a fundamental syntactic part of the XML language, as a peer of element declarations or comments or the like.

### Referenced in Attributes and Attribute Defaults
Surprisingly, an external entity may not be referenced in an attribute value.
The only indication of the reason for this is in http://www.xml.com/axml/testaxml.htm ("There's a good reason for this rule. XML goes to a lot of work to make external entities self-identifying and allowing them to use different character encodings; this is the reason for the text declaration. But an efficient XML processor is probably going to treat attribute values in quite a different way, and it's hard to figure out what the right way would be to deal with a text declaration in the middle of an attribute value.

So in XML, it's internal entities only in attribute values."), which I don't particularly buy at this time. While I can imagine a efficient XML processor might handle attributes differently, the effort to strip off the text declaration seems quite small relative to this restriction.

In any case, it is important to note that entities must have been declared before they are referenced in an attribute value or an attribute list default.

### Referenced in Attribute Defaults
A general entity must have been declared before it is referenced in an attribute

# Parameter Entities
The previous section about entities was actually introducing just one kind of entity. They are actually called "general entities".

XML includes another kind of entity called a Parameter Entity. These are similar in many respects to a general entity, but also have some dramatic differences. The corner cases of these differences lead parameter entities to be much more complex.  So, let's walk through these one step at a time.

If the purpose of a general entity is to add content into the content of the document or an attribute value, then you can think of a parameter entity as adding content into the DTD. They only have meaning when referenced inside of the DTD and never appear outside of it.

Like a general entity, a parameter entity is declared in the DTD. In fact, the only difference between the two is the parameter entity has a '%' character in its declaration:
   <!ENTITY % iAmAParameterEntity "someValue">
They are referenced like this: %iAmAParameterEntity;

Like a general entity, they can be internal or external, and the external ones may start with a text declaration.
Similarly, if a declared name is used once, any subsequent declarations are ignored. Note that you can have a general entity with a name, and a parameter entity with the same name.  They do not conflict.

Also like a general entity, the paramer entity value is not really parsed until is referenced.

After this, the two kinds of entities diverge in some significant ways.

## Referenced in the DTD

A parameter entity's value can contain any whole declaration from the DTD.  Thus:
   <!ENTITY % foo "<!ENTITY bar 'iron'>">
Thus, you can, in the DTD, say:

   %foo;

and then in your document you can reference &bar;

In this usage, it is again a requirement that the value of the parameter entity is whole syntactic items. You can not do:
   <!ENTITY % foo "<!ENTITY bar 'i">
and
   %foo;ron'>

This usage is both pretty easy to understand and predict.  This is probably primarily useful for the internal subset to declare some declarations that will then be included and subsequently used in the external subset.

## Referenced in an entity value
Parameter entities can be referenced from an entity value:
   <!ENTITY foo "bar%someParameterEntity;bar">
We mentioned earlier that entity values are not parsed until the parser encounters a reference and tries to expand them. Howeer, that isn't entirely true. All entity values are parsed, when the entity declaration is encountered, enough to discover if there are parameter entity references within their values. If so, those are immediately replaced by the parameter entity's value. Note that in this case, the value of the parameter entity is parsed only enough to discover if there are other parameter entity references in there (and if so, those are then immediately expanded).

This has a couple notable effects:
Most notably, an entity value can not reference a parameter entity that has not already been parsed (again, the order is internal subset, external subset, content of the document, with external entities being parsed at arbitrary times).

Parameter entities can, themselves, have references to parameter entities in their values. however, since there are no "forward references" it is not possible to end up with mutually referencing entities.

Once any parameter entity references are fully expanded in the entity values, then the general entity values will be processed as described above: when referenced, and in the context of the place they are referenced.

As you may have noticed, it would be possible to have various parameter entities in the internal subset build up a bunch of declarations in their values that are then expanded in the external subset. This can get a bit head-hurting, and I'm not sure why you would do it, but it does seem possible.


## Referenced in other literals
Parameter entities can not be referenced from other literals (quoted strings) in delarations.  Thus, if you have a parameter entity in your attribute default values, it will be treated as the string '%', 'somename', and ';', not as a parameter entity reference.

Similarly, you can not use them in external ID's (e.g. PUBLIC "foo%bar;foo" "other%blah;other"), these too will be ignored (and are syntactically simply illegal in the public literal)

If you have one in a comment or a processing instruction, they'll also be ignored.

## Referenced within declarations
The places parameter entities will cause your head to explode is that they can be referenced inside of a declaration. Thus, you can say:
   <!ELEMENT %myPEntity;>
where you might previously have declared
   <!ELEMENT % myPEEntity "one ANY">
so that that previous is identical to
   <!ELEMENT one ANY>

You can use this to build up arbitrary declarations.
There are a couple catches to this:
First, implicitly, these must occur within the <!...> boundaries.  you can't have a parameter entity value include the closing ">".
Secondly, in this use (and this use alone) the parser must treat them as if they are surrounded by spaces. It must contain only whole tokens. Thus, you can not do
   <!ELEMENT % myPEEntity "e AN">
   <!ELEMENT on%myPEntity;Y>

This usage of parameter entity references can only be done in the external subset.  It is illegal in the internal subset. I assume this is done, in part, to allow a non-validating parser be able to parse the document entity without getting confused, as this usage makes it very hard to parse the internal DTD if you do not have the referenced values at hand.

The chief use for this is likely to be conditional sections, below. But, again, you could use it to parameterize portions of the external subset in other funky ways if you wanted.

In this regard, it is important to note that the value of the entity will, ultimately, be parsed as if it were appearin in the document at this point. Thus:
   <!ENTITY foo %value;>
does require that the referenced entity contain the quotes that must surround the entity value:
   <!ENTITY % value '"foo"'>

## Esoteric note
% is not allowed in an entity value (presumably to make parsing for param entity references sane). However, you can use a character reference in this position, and it is fine, allowing you to do:
   <!ENTITY %decl;> where <!ENTITY % decl "&#37; name 'value'"?


@@ do you get an error if you have a PERef up against something that requires n explicit space before it?
@@ there is some condition with element modesl

# Character references

# Conditional sections

# Encodings and characters

## PE References
### Q1 Is this allowed <!NOTATION foo SYSTEM "foo%whatever;> ?
Answer: No, Because any enclosed quote can not terminate the quoted value (4.4.5) Also, no parsing for markup is done in the systemLiteral (2.3)

### Q2 Is this allowed <!NOTATION foo SYSTEM "%whatever;"> ?
Answer: No.  Section 2.3 says you need not look for markup in the system value.

### Q3 how about <!NOTATION foo PUBLIC "%pubValue;" "system"> ?
Answer: No.  Section 2.8 says that PE Refs are not recognized in literals (except for entity value literals). (note also that the public literal may contain %'s)

### Q4 how about <!NOTATION foo PUBLIC %systemValue;> ?
Answer: I can't see why not. However, `xmllint --loaddtd  --noent  --valid  2-bad.xml` really doesn't like it at all.

### Q5 How about  <!NOTATION foo %externalIdReference;>  (where <!ENTITY % externalIdReference "SYSTEM...">)?
Answer: Yes. That works OK

### Q6 how about <!ENTITY foo %startValue;end"> ?
Answer: This causes xmllint to barf

### Q7 how about <!ENTITY foo %value;>  ?
Answer: This works ok, as long as value contains the quote ( <!ENTITY % value '"foo"'>)

### Q8 how about <!ENTITY %decl;> where <!ENTITY % decl "% name 'value'"?
Answer: No.  In particular, % is not allowed in an entity value.

### Q9 how about <!ENTITY %decl;> where <!ENTITY % decl "&#37; name 'value'"?
Answer: Yes

### Q10 how about <!ENTITY %decl;> where <!ENTITY % decl "name 'value'"?
Answer: Yes

### Notes
* PERefs may not occur inside markup in the internal subset
* PERefs may not occur in literals (except EntityValues) within markup
* PERefs are expanded so there is a space on either side
* xmllint limits which might also be xml standard limits
   * can not have a PERef span a literal start
   * can not have a PERef instead of a system or public value
      * But can be part of the externalID as long as the SYSTEM or PUBLIC is part of it (12)

## Order of parsing:
* Attribute defaults are parsed for General Entity references when they are first encountered in the DTD.
   * This means an ATTLIST declared in the internal subset can not reference an enty, in any of its default values, that is declared after it or in the external subset.

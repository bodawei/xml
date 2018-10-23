## E. Deterministic Content Models (Non-Normative)

For compatibility, it is required that content models in element type declarations be deterministic.

SGML requires deterministic content models (it calls them "unambiguous"); XML processors built using SGML systems may flag non-deterministic content models as errors.

For example, the content model ((b, c) | (b, d)) is non-deterministic, because given an initial b the parser cannot know which b in the model is being matched without looking ahead to see which element follows the b. In this case, the two references to b can be collapsed into a single reference, making the model read (b, (c | d)). An initial b now clearly matches only a single name in the content model. The parser doesn't need to look ahead to see what follows; either c or d would be accepted.

> **1.0/2: Replace all the above** As noted in 3.2.1 Element Content, it is required that content models in element type declarations be deterministic. This requirement is for compatibility with SGML (which calls deterministic content models "unambiguous"); XML processors built using SGML systems may flag non-deterministic content models as errors.

> **1.0/2: Replace all the above** For example, the content model ((b, c) | (b, d)) is non-deterministic, because given an initial b the XML processor cannot know which b in the model is being matched without looking ahead to see which element follows the b. In this case, the two references to b can be collapsed into a single reference, making the model read (b, (c | d)). An initial b now clearly matches only a single name in the content model. The processor doesn't need to look ahead to see what follows; either c or d would be accepted.

More formally: a finite state automaton may be constructed from the content model using the standard algorithms, e.g. algorithm 3.5 in section 3.9 of Aho, Sethi, and Ullman [Aho/Ullman]. In many such algorithms, a follow set is constructed for each position in the regular expression (i.e., each leaf node in the syntax tree for the regular expression); if any position has a follow set in which more than one following position is labeled with the same element type name, then the content model is in error and may be reported as an error.

Algorithms exist which allow many but not all non-deterministic content models to be reduced automatically to equivalent deterministic models; see Brüggemann-Klein 1991 [Brüggemann-Klein].

### Appendix: Standards
* 1.0/1: https://www.w3.org/TR/1998/REC-xml-19980210#determinism
   * Annotated: https://www.xml.com/axml/axml.html
* 1.0/2: https://www.w3.org/TR/2000/REC-xml-20001006#determinism
* 1.0/3: https://www.w3.org/TR/2004/REC-xml-20040204/#determinism
* 1.0/4: https://www.w3.org/TR/2006/REC-xml-20060816/#determinism
* 1.0/5: https://www.w3.org/TR/xml/#determinism
* 1.1/1: https://www.w3.org/TR/2004/REC-xml11-20040204/#determinism
* 1.1/2: https://www.w3.org/TR/2006/REC-xml11-20060816/#determinism
* 1.1/3: https://www.w3.org/XML/xml-V11-2e-errata



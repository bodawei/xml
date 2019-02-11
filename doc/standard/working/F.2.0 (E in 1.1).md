## F.2 Priorities in the Presence of External Encoding Information

The second possible case occurs when the XML entity is accompanied by encoding information, as in some file systems and some network protocols. When multiple sources of information are available, their relative priority and the preferred method of handling conflict should be specified as part of the higher-level protocol used to deliver XML. In particular, please refer to [IETF RFC 2376] or its successor, which defines the text/xml and application/xml MIME types and provides some useful guidance. In the interests of interoperability, however, the following rule is recommended.

> **1.0/3: Modify:  [IETF RFC 3023]

* If an XML entity is in a file, the Byte-Order Mark and encoding declaration are used (if present) to determine the character encoding.


### Appendix: Standards
* 1.0/2: https://www.w3.org/TR/2000/REC-xml-20001006#sec-guessing-with-ext-info
* 1.0/3: https://www.w3.org/TR/2004/REC-xml-20040204/#sec-guessing-with-ext-info
* 1.0/4: https://www.w3.org/TR/2006/REC-xml-20060816/#sec-guessing-with-ext-info
* 1.0/5: https://www.w3.org/TR/xml/#sec-guessing-with-ext-info
* 1.1/1: https://www.w3.org/TR/2004/REC-xml11-20040204/#sec-guessing-with-ext-info
* 1.1/2: https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-guessing-with-ext-info
* 1.1/3: https://www.w3.org/XML/xml-V11-2e-errata



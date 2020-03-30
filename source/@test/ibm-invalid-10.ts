const testData = {
    "ibm": {
        "tests": {
            "P28": {
                "ibm28i01.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE tiger [\r\n   <!ELEMENT tiger EMPTY>\r\n]>\r\n<!-- This against VC of P28. The Name in the document type declaration\r\n does not match the element type of the root element. --> \r\n<animal/>",
                    "output": "<animal></animal>"
                }
            },
            "P29": {},
            "P32": {
                "ibm32i01.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"yes\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32i01.dtd\" [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- This is against VC: Standalone Document Declaration in P32\r\n The standalone document declaration has the value \"yes\", there is an external \r\n markup declaration of attributes with default values, and the associated \r\n element appears in the document with specified values for those attributes.   \r\n-->\r\n<animal/>\r\n",
                    "output": "<animal color=\"yellow\"></animal>"
                },
                "ibm32i03.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"yes\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32i03.dtd\" [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- This is against VC: Standalone Document Declaration in P32\r\n The standalone document declaration has the value \"yes\", there is an external\r\n markup declaration of attributes with values containing character reference.\r\n-->\r\n<animal class=\"   NMTOKEN_with_leading_and_trailing_space\t \"/>\r\n\r\n\r\n\r\n\r\n",
                    "output": "<animal class=\"NMTOKEN_with_leading_and_trailing_space\"></animal>"
                },
                "ibm32i04.xml": {
                    "input": "<?xml version='1.0' standalone='yes' ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32i04.dtd\" [\r\n  <!ATTLIST animal xml:space (default|preserve) 'preserve'>\r\n]>\r\n<!-- This is against VC: Standalone Document Declaration in P32\r\n The standalone document declaration has the value \"yes\", there is an \r\n external markup declaration of element with a element only content type, and \r\n white space occurs directly within the mixed content.\r\n-->\r\n<animal><a>This is a \r\n\r\nyellow tiger</a> <b/>\r\n<c/>\r\n\r\n</animal>\r\n",
                    "output": "<animal xml:space=\"preserve\"><a>This is a &#10;&#10;yellow tiger</a> <b></b>&#10;<c></c>&#10;&#10;</animal>"
                }
            },
            "P39": {
                "ibm39i01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (a,b)>\r\n  <!ELEMENT a EMPTY>\r\n  <!ELEMENT b (#PCDATA|c)* >\r\n  <!ELEMENT c ANY>\r\n\r\n]>\r\n<!--* EMPTY element a has content *-->\r\n<root><a>should not have content here</a><b>\r\n   <c></c> \r\n   content of b element\r\n</b></root>\r\n\r\n",
                    "output": "<root><a>should not have content here</a><b>&#10;   <c></c> &#10;   content of b element&#10;</b></root>"
                },
                "ibm39i02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (a,b)>\r\n  <!ELEMENT a EMPTY>\r\n  <!ELEMENT b (#PCDATA|c)* >\r\n  <!ELEMENT c ANY>\r\n\r\n]>\r\n<!--* root element have text content *-->\r\n<root>\r\n root can't have text content\r\n<a></a><b>\r\n   <c></c> \r\n   content of b element\r\n</b></root>\r\n\r\n",
                    "output": "<root>&#10; root can't have text content&#10;<a></a><b>&#10;   <c></c> &#10;   content of b element&#10;</b></root>"
                },
                "ibm39i03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (a,b)>\r\n  <!ELEMENT a EMPTY>\r\n  <!ELEMENT b (#PCDATA|c)* >\r\n  <!ELEMENT c ANY>\r\n]>\r\n<!--* illgal element in b's Mixed content *-->\r\n<root><a/><b>\r\n   <c></c> \r\n   content of b element\r\n   <a/>\r\n   could not have 'a' as 'b's content\r\n</b></root>\r\n\r\n",
                    "output": "<root><a></a><b>&#10;   <c></c> &#10;   content of b element&#10;   <a></a>&#10;   could not have 'a' as 'b's content&#10;</b></root>"
                },
                "ibm39i04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (a,b)>\r\n  <!ELEMENT a EMPTY>\r\n  <!ELEMENT b (#PCDATA|c)* >\r\n  <!ELEMENT c ANY>\r\n  <!ELEMENT f EMPTY>\r\n]>\r\n<!--* element c has undeclared element as its ANY content *-->\r\n<root><a/><b>\r\n   <c><f/></c> \r\n   content of b element\r\n   <c>\r\n      <d>not declared in dtd</d>\r\n   </c>\r\n</b></root>\r\n\r\n",
                    "output": "<root><a></a><b>&#10;   <c><f></f></c> &#10;   content of b element&#10;   <c>&#10;      <d>not declared in dtd</d>&#10;   </c>&#10;</b></root>"
                }
            },
            "P41": {
                "ibm41i01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA|b)* >\r\n  <!ELEMENT b (#PCDATA) >\r\n  <!ATTLIST b attr2 (abc|def) \"abc\">\r\n  <!ATTLIST b attr3 CDATA #FIXED \"fixed\">\r\n]>\r\n<root>\r\n  <b attr1=\"value1\" attr2=\"def\" attr3=\"fixed\">attr1 not declared</b>\r\n</root>\r\n<!--* testing VC:Attribute Value Type  *-->\r\n",
                    "output": "<root>&#10;  <b attr1=\"value1\" attr2=\"def\" attr3=\"fixed\">attr1 not declared</b>&#10;</root>"
                },
                "ibm41i02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (PCDATA|b)* >\r\n  <!ELEMENT b (#PCDATA) >\r\n  <!ATTLIST b attr1 CDATA #REQUIRED>\r\n  <!ATTLIST b attr2 (abc|def) \"abc\">\r\n  <!ATTLIST b attr3 CDATA #FIXED \"fixed\">\r\n]>\r\n<root>\r\n  <b attr1=\"value1\" attr2=\"abc\" attr3=\"shoudbefixed\">attr3 value not fixed</b>\r\n</root>\r\n<!--* testing P41 VC: AtributeValueType*-->\r\n",
                    "output": "<root>&#10;  <b attr1=\"value1\" attr2=\"abc\" attr3=\"shoudbefixed\">attr3 value not fixed</b>&#10;</root>"
                }
            },
            "P45": {
                "ibm45i01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA|b)* >\r\n  <!ELEMENT b EMPTY>\r\n  <!ELEMENT not_unique ANY>\r\n  <!ELEMENT not_unique EMPTY>\r\n  <!ELEMENT not_unique (b,b) >\r\n  <!ELEMENT unique. ANY>\r\n  <!ATTLIST b attr1 CDATA #IMPLIED>\r\n  <!ATTLIST b attr2 CDATA #IMPLIED>\r\n  <!ATTLIST b attr3 CDATA #IMPLIED>\r\n]>\r\n<root>\r\n  <b/>without white space\r\n  <b /> with a white space\r\n  <b attr1=\"value1\" />\r\n  <b attr1=\"value1\" attr2=\"value2\" attr3 = \"value3\"/>\r\n</root>\r\n<!--* a invalid test: testing P45 VC unique element type decl  *-->\r\n",
                    "output": "<root>&#10;  <b></b>without white space&#10;  <b></b> with a white space&#10;  <b attr1=\"value1\"></b>&#10;  <b attr1=\"value1\" attr2=\"value2\" attr3=\"value3\"></b>&#10;</root>"
                }
            },
            "P49": {
                "ibm49i01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm49i01.dtd\" [\r\n  <!ELEMENT root (a,b)>\r\n]>\r\n<root><a/><b>\r\n   <c></c >\r\n   content of b element\r\n</b></root>\r\n<!--* a invalid test: tests VC:Proper Group/PE Nesting in P49 *-->\r\n",
                    "output": "<root><a></a><b>&#10;   <c></c>&#10;   content of b element&#10;</b></root>"
                },
            },
            "P50": {
                "ibm50i01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm50i01.dtd\" [\r\n  <!ELEMENT root (a,b)>\r\n]>\r\n<root><a/><b>\r\n   <c></c >\r\n   content of b element\r\n</b></root>\r\n<!--* a invalid test: tests VC:Proper Group/PE Nesting in P50 *-->\r\n",
                    "output": "<root><a></a><b>&#10;   <c></c>&#10;   content of b element&#10;</b></root>"
                }
            },
            "P51": {
                "ibm51i01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm51i01.dtd\" [\r\n  <!ELEMENT root ANY>\r\n]>\r\n<root>\r\n  <a> Element type a </a>\r\n  <b> Element type b </b>\r\n</root>\r\n<!--* a invalid test: tests P51 VC: Proper Group/PE Nesting *-->",
                    "output": "<root>&#10;  <a> Element type a </a>&#10;  <b> Element type b </b>&#10;</root>"
                },
                "ibm51i03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root ANY>\r\n  <!ELEMENT a (#PCDATA)* >\r\n  <!ELEMENT b (#PCDATA) >\r\n  <!ELEMENT c ( #PCDATA)*>\r\n  <!ELEMENT d (#PCDATA|c)* >\r\n  <!--* Duplicate element types in Mixed content decl *-->\r\n  <!ELEMENT e (#PCDATA|a|a|b|c)* >\r\n]>\r\n<root>\r\n  <a> Element type a </a>\r\n  <b> Element type b </b>\r\n</root>\r\n<!--* a invalid test: tests P51 VC: No Duplicate Types *-->\r\n",
                    "output": "<root>&#10;  <a> Element type a </a>&#10;  <b> Element type b </b>&#10;</root>"
                }
            },
            "P56": {
                "ibm56i01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(negative Test)-->\r\n<!DOCTYPE tokenizer\r\n [\r\n <!ELEMENT tokenizer ANY>\r\n <!ATTLIST tokenizer UniqueName ID #REQUIRED>\r\n ]>\r\n<tokenizer UniqueName = \"@c999\">\r\nThis is a negative test for validity constraints\r\nthe value of the attribute with a type ID does not match the Name production\r\n</tokenizer>",
                    "output": "<tokenizer UniqueName=\"@c999\">&#10;This is a negative test for validity constraints&#10;the value of the attribute with a type ID does not match the Name production&#10;</tokenizer>"
                },
                "ibm56i02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(negative Test)-->\r\n<!DOCTYPE tokenizer\r\n [\r\n <!ELEMENT tokenizer ANY>\r\n <!ELEMENT b EMPTY>\r\n <!ATTLIST b attr ID #REQUIRED>\r\n <!ATTLIST tokenizer UniqueName ID #REQUIRED>\r\n  ]>\r\n<tokenizer UniqueName = \"Ac999\">\r\n<b attr = \"Ac999\"></b>\r\nThis is a negative test for validity constraints\r\nthe value of the attribute with a type ID appears more than once in the XML document\r\n</tokenizer>\r\n",
                    "output": "<tokenizer UniqueName=\"Ac999\">&#10;<b attr=\"Ac999\"></b>&#10;This is a negative test for validity constraints&#10;the value of the attribute with a type ID appears more than once in the XML document&#10;</tokenizer>"
                },
                "ibm56i03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative Test)-->\r\n<!DOCTYPE tokenizer\r\n [\r\n <!ELEMENT tokenizer ANY>\r\n <!ATTLIST tokenizer UniqueName ID #FIXED \"AC1999\">\r\n ]>\r\n<tokenizer>\r\nThis is a Negative validity test for ID Attribute Default.\r\nGiving the attribute default as #FIXED\r\n</tokenizer>\r\n",
                    "output": "<tokenizer UniqueName=\"AC1999\">&#10;This is a Negative validity test for ID Attribute Default.&#10;Giving the attribute default as #FIXED&#10;</tokenizer>"
                },
                "ibm56i05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative Test)-->\r\n<!DOCTYPE tokenizer\r\n [\r\n <!ELEMENT tokenizer ANY>\r\n <!ATTLIST tokenizer UniqueName ID \"BOGUS\">\r\n ]>\r\n<tokenizer UniqueName = \"AC1999\">\r\nThis is a Negative validity test for ID Attribute Default.\r\nGiving the attibute default as a const string\r\n</tokenizer>\r\n",
                    "output": "<tokenizer UniqueName=\"AC1999\">&#10;This is a Negative validity test for ID Attribute Default.&#10;Giving the attibute default as a const string&#10;</tokenizer>"
                },
                "ibm56i06.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative Test)-->\r\n<!DOCTYPE tokenizer\r\n [\r\n <!ELEMENT tokenizer ANY>\r\n <!ELEMENT a EMPTY>\r\n <!ATTLIST a first ID #REQUIRED>\r\n <!ATTLIST a second ID #REQUIRED>\r\n ]>\r\n<tokenizer>\r\n<a first = \"AC1999\" second=\"BC1999\"></a>\r\nThis is a Negative validity test for ID.\r\nThere is more than attribute of type ID for the element a\r\n\r\n</tokenizer>\r\n",
                    "output": "<tokenizer>&#10;<a first=\"AC1999\" second=\"BC1999\"></a>&#10;This is a Negative validity test for ID.&#10;There is more than attribute of type ID for the element a&#10;&#10;</tokenizer>"
                },
                "ibm56i07.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT id EMPTY>\r\n <!ELEMENT idref EMPTY>\r\n <!ATTLIST id UniqueName ID #REQUIRED>\r\n <!ATTLIST idref reference IDREF #IMPLIED>\r\n ]>\r\n<test>\r\n<id UniqueName = \"AC456\"></id>\r\n<idref reference = \"@456\"></idref>\r\nNegative test for validity constraint of IDREF.\r\nIn an attribute decl, values of type IDREF does not match the name production\r\n</test>",
                    "output": "<test>&#10;<id UniqueName=\"AC456\"></id>&#10;<idref reference=\"@456\"></idref>&#10;Negative test for validity constraint of IDREF.&#10;In an attribute decl, values of type IDREF does not match the name production&#10;</test>"
                },
                "ibm56i08.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT id EMPTY>\r\n <!ELEMENT idref EMPTY>\r\n <!ATTLIST id UniqueName ID #REQUIRED>\r\n <!ATTLIST idref reference IDREF #IMPLIED>\r\n ]>\r\n<test>\r\n<id UniqueName = \"AC456\"></id>\r\n<idref reference = \"BC456\"></idref>\r\nNegative test for validity constraint of IDREF.\r\nIn an attribute decl, values of type IDREF match the name production and\r\nIDREF value does not match the value assigned to any ID attribute somewhere\r\nin the XML document.\r\n</test>",
                    "output": "<test>&#10;<id UniqueName=\"AC456\"></id>&#10;<idref reference=\"BC456\"></idref>&#10;Negative test for validity constraint of IDREF.&#10;In an attribute decl, values of type IDREF match the name production and&#10;IDREF value does not match the value assigned to any ID attribute somewhere&#10;in the XML document.&#10;</test>"
                },
                "ibm56i09.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT id1 EMPTY>\r\n <!ELEMENT id2 EMPTY>\r\n <!ELEMENT idrefs EMPTY>\r\n <!ATTLIST id1 UniqueName ID #REQUIRED>\r\n <!ATTLIST id2 UName ID #IMPLIED>\r\n <!ATTLIST idrefs reference IDREFS #IMPLIED>\r\n ]>\r\n<test>\r\n<id1 UniqueName = \"AC456\"></id1>\r\n<id2 UName = \"BC567\"></id2>\r\n<idrefs reference = \"AC456 #567\"></idrefs>\r\nNegative test for validity constraint of IDREFS.\r\nIn an attribute decl, values of type IDREFS does not match the name production\r\n</test>",
                    "output": "<test>&#10;<id1 UniqueName=\"AC456\"></id1>&#10;<id2 UName=\"BC567\"></id2>&#10;<idrefs reference=\"AC456 #567\"></idrefs>&#10;Negative test for validity constraint of IDREFS.&#10;In an attribute decl, values of type IDREFS does not match the name production&#10;</test>"
                },
                "ibm56i10.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT id1 EMPTY>\r\n <!ELEMENT id2 EMPTY>\r\n <!ELEMENT idrefs EMPTY>\r\n <!ATTLIST id1 UniqueName ID #REQUIRED>\r\n <!ATTLIST id2 UName ID #IMPLIED>\r\n <!ATTLIST idrefs reference IDREFS #IMPLIED>\r\n ]>\r\n<test>\r\n<id1 UniqueName = \"BC456\"></id1>\r\n<id2 UName = \"AC567\"></id2>\r\n<idrefs reference = \"EF456 DE355\"></idrefs>\r\nNegative test for validity constraint of IDREFS.\r\nIn an attribute decl, values of type IDREFS match the name production\r\nbut IDREFS value do not match the values assigned to one or more ID attributes\r\nsomewhere in the XML document\r\n</test>",
                    "output": "<test>&#10;<id1 UniqueName=\"BC456\"></id1>&#10;<id2 UName=\"AC567\"></id2>&#10;<idrefs reference=\"EF456 DE355\"></idrefs>&#10;Negative test for validity constraint of IDREFS.&#10;In an attribute decl, values of type IDREFS match the name production&#10;but IDREFS value do not match the values assigned to one or more ID attributes&#10;somewhere in the XML document&#10;</test>"
                },
                "ibm56i11.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT landscape EMPTY>\r\n <!ENTITY image SYSTEM \"d:\\testspec\\images\\sunset.gif\" NDATA gif>\r\n <!ATTLIST landscape sun ENTITY #IMPLIED>\r\n]>\r\n<test>\r\n<landscape sun = \"ima ge\"></landscape>\r\nIn the attribute decl, values of type ENTITY do not match the Name production\r\n</test>",
                    "output": "<test>&#10;<landscape sun=\"ima ge\"></landscape>&#10;In the attribute decl, values of type ENTITY do not match the Name production&#10;</test>"
                },
                "ibm56i12.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT landscape EMPTY>\r\n <!ENTITY image SYSTEM \"d:\\testspec\\images\\sunset.gif\" NDATA gif>\r\n <!ATTLIST landscape sun ENTITY #IMPLIED>\r\n]>\r\n<test>\r\n<landscape sun = \"notimage\"></landscape>\r\nIn the attribute decl, values of type ENTITY match the Name production\r\nbut does not match the name of any entity declared in the DTD\r\n</test>",
                    "output": "<test>&#10;<landscape sun=\"notimage\"></landscape>&#10;In the attribute decl, values of type ENTITY match the Name production&#10;but does not match the name of any entity declared in the DTD&#10;</test>"
                },
                "ibm56i13.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT landscape EMPTY>\r\n <!ENTITY parsedentity SYSTEM \"ibm56iv01.xml\" >\r\n <!ATTLIST landscape sun ENTITY #IMPLIED>\r\n]>\r\n<test>\r\n<landscape sun = \"parsedentity\"></landscape>\r\nIn an attribute declaration, values of type ENTITY match the Name production and the ENTITY value\r\nmatches the name of a parsed entity declared in the DTD. \r\n</test>",
                    "output": "<test>&#10;<landscape sun=\"parsedentity\"></landscape>&#10;In an attribute declaration, values of type ENTITY match the Name production and the ENTITY value&#10;matches the name of a parsed entity declared in the DTD. &#10;</test>"
                },
                "ibm56i14.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT landscape EMPTY>\r\n <!ENTITY image1 SYSTEM \"d:\\testspec\\images\\sunset.gif\" NDATA gif>\r\n <!ENTITY image2 SYSTEM \"d:\\testspec\\images\\frontpage.gif\" NDATA gif>\r\n <!ATTLIST landscape sun ENTITIES #IMPLIED>\r\n]>\r\n<test>\r\n<landscape sun = \"#image1 @image\"></landscape>\r\nIn an attribute declaration, values of type ENTITIES do not match the Name production.\r\n</test>",
                    "output": "<test>&#10;<landscape sun=\"#image1 @image\"></landscape>&#10;In an attribute declaration, values of type ENTITIES do not match the Name production.&#10;</test>"
                },
                "ibm56i15.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT landscape EMPTY>\r\n <!ENTITY image1 SYSTEM \"d:\\testspec\\images\\sunset.gif\" NDATA gif>\r\n <!ENTITY image2 SYSTEM \"d:\\testspec\\images\\frontpag.gif\" NDATA gif>\r\n <!ATTLIST landscape sun ENTITIES #IMPLIED>\r\n]>\r\n<test>\r\n<landscape sun = \"image3 image4\"></landscape>\r\nIn an attribute declaration, values of type ENTITIES match the Name production and the ENTITIES value\r\ndoes not match one or more names of entities declared in the DTD. \r\n</test>",
                    "output": "<test>&#10;<landscape sun=\"image3 image4\"></landscape>&#10;In an attribute declaration, values of type ENTITIES match the Name production and the ENTITIES value&#10;does not match one or more names of entities declared in the DTD. &#10;</test>"
                },
                "ibm56i16.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT landscape EMPTY>\r\n <!ENTITY parsedentity1 SYSTEM \"ibm56iv01.xml\">\r\n <!ENTITY parsedentity2 SYSTEM \"ibm56iv02.xml\">\r\n <!ATTLIST landscape sun ENTITIES #IMPLIED>\r\n]>\r\n<test>\r\n<landscape sun = \"parsedentity1 parsedentity2\"></landscape>\r\nIn an attribute declaration, values of type ENTITIES match the Name production and the ENTITIES value\r\nmatches one or more names of parsed entities declared in the DTD. .\r\n</test>",
                    "output": "<test>&#10;<landscape sun=\"parsedentity1 parsedentity2\"></landscape>&#10;In an attribute declaration, values of type ENTITIES match the Name production and the ENTITIES value&#10;matches one or more names of parsed entities declared in the DTD. .&#10;</test>"
                },
                "ibm56i17.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT nametoken EMPTY>\r\n <!ATTLIST nametoken thistoken NMTOKEN #IMPLIED>\r\n]>\r\n<test>\r\n<nametoken thistoken = \"x : image\"></nametoken>\r\nIn an attribute declaration, values of type NMTOKEN does not match the Nmtoken production\r\n</test>",
                    "output": "<test>&#10;<nametoken thistoken=\"x : image\"></nametoken>&#10;In an attribute declaration, values of type NMTOKEN does not match the Nmtoken production&#10;</test>"
                },
                "ibm56i18.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Negative Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT nametokens EMPTY>\r\n <!ATTLIST nametokens thistoken NMTOKENS #IMPLIED>\r\n]>\r\n<test>\r\n<nametokens thistoken = \"@lang y: #country\"></nametokens>\r\nIn an attribute declaration, values of type NMTOKENS does not match the Nmtokens production\r\n</test>",
                    "output": "<test>&#10;<nametokens thistoken=\"@lang y: #country\"></nametokens>&#10;In an attribute declaration, values of type NMTOKENS does not match the Nmtokens production&#10;</test>"
                }
            },
            "P58": {
                "ibm58i01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 58(Negative Test-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT blob (#PCDATA)>\r\n <!NOTATION base64 SYSTEM \"mimecode\">\r\n <!NOTATION uuencode SYSTEM \"uudecode\">\r\n <!NOTATION raw SYSTEM \"raw\">\r\n <!ATTLIST blob content-encoding NOTATION (base64|uuencode) #REQUIRED>\r\n ]>\r\n <test>\r\n<blob content-encoding = \"raw\"></blob>\r\nThe attribute values of type NOTATION does not match any of the notation names included in the\r\ndeclaration.All notation names in the declaration have been declared.\r\n</test>",
                    "output": "<!DOCTYPE test [\n<!NOTATION base64 SYSTEM 'mimecode'>\n<!NOTATION raw SYSTEM 'raw'>\n<!NOTATION uuencode SYSTEM 'uudecode'>\n]>\n<test>&#10;<blob content-encoding=\"raw\"></blob>&#10;The attribute values of type NOTATION does not match any of the notation names included in the&#10;declaration.All notation names in the declaration have been declared.&#10;</test>"
                },
                "ibm58i02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 58(Negative Test-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT blob (#PCDATA)>\r\n <!NOTATION base64 SYSTEM \"mimecode\">\r\n <!NOTATION uuencode SYSTEM \"uudecode\">\r\n <!ATTLIST blob content-encoding NOTATION (base64|uuencode|raw|ascii) #REQUIRED>\r\n ]>\r\n <test>\r\n<blob content-encoding = \"raw\"></blob>\r\nThe attribute values of type NOTATION does match any of the notation names included in the\r\ndeclaration, but some of notation names in the declaration have not been declared\r\n</test>",
                    "output": "<!DOCTYPE test [\n<!NOTATION base64 SYSTEM 'mimecode'>\n<!NOTATION uuencode SYSTEM 'uudecode'>\n]>\n<test>&#10;<blob content-encoding=\"raw\"></blob>&#10;The attribute values of type NOTATION does match any of the notation names included in the&#10;declaration, but some of notation names in the declaration have not been declared&#10;</test>"
                }
            },
            "P59": {
                "ibm59i01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 59-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!ELEMENT num EMPTY>\r\n <!ATTLIST num value (one|two) #IMPLIED>\r\n ]>\r\n <test>\r\n<num value = \"ONE\"></num>\r\nThis is a Negative test\r\nThe attribute values of type Enumeration does not match any of the Nmtoken tokens in the declaration.\r\n</test>",
                    "output": "<test>&#10;<num value=\"ONE\"></num>&#10;This is a Negative test&#10;The attribute values of type Enumeration does not match any of the Nmtoken tokens in the declaration.&#10;</test>"
                }
            },
            "P60": {
                "ibm60i01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!ATTLIST one chapter CDATA #REQUIRED>\r\n <!ATTLIST two chapter CDATA #REQUIRED>\r\n ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\n<two></two>\r\nNegative test for Required Attribute. Some occurrence of an element with \r\nan attribute of #REQUIRED default declaration does not give the value of \r\nthose attribute\r\n</Java>",
                    "output": "<Java>&#10;<one chapter=\"Introduction\"></one>&#10;<two></two>&#10;Negative test for Required Attribute. Some occurrence of an element with &#10;an attribute of #REQUIRED default declaration does not give the value of &#10;those attribute&#10;</Java>"
                },
                "ibm60i02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ATTLIST one chapter CDATA #FIXED \"Introduction\">\r\n  ]>\r\n<Java>\r\n<one chapter=\"JavaBeans\"></one>\r\nNegative Test\r\nAn attribute has a default value declared with the #FIXED keyword, \r\nand an instances of that attribute is given a value which is not \r\nthe same as the default value in the declaration. \r\n</Java>\r\n",
                    "output": "<Java>&#10;<one chapter=\"JavaBeans\"></one>&#10;Negative Test&#10;An attribute has a default value declared with the #FIXED keyword, &#10;and an instances of that attribute is given a value which is not &#10;the same as the default value in the declaration. &#10;</Java>"
                },
                "ibm60i03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 60-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT a EMPTY>\r\n <!ELEMENT b EMPTY>\r\n <!ELEMENT attr EMPTY>\r\n <!ATTLIST attr value (a|b) \"c\"> \r\n  ]>\r\n<test>\r\nThe default value specified for an attribute does not meet the \r\nlexical constraints of the declared attribute type.\r\n</test>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n",
                    "output": "<test>&#10;The default value specified for an attribute does not meet the &#10;lexical constraints of the declared attribute type.&#10;</test>"
                },
                "ibm60i04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 60-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT a EMPTY>\r\n <!ELEMENT nametoken EMPTY>\r\n <!ATTLIST nametoken namevalue NMTOKEN \"@#$\"> \r\n  ]>\r\n<test>\r\nThe default value specified for an attribute does not meet the \r\nlexical constraints of the declared attribute type.\r\n</test>\r\n",
                    "output": "<test>&#10;The default value specified for an attribute does not meet the &#10;lexical constraints of the declared attribute type.&#10;</test>"
                }
            },
            "P68": {
                "ibm68i01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm68i01.dtd\" [\r\n  <!ELEMENT root (#PCDATA|a)* >\r\n]>\r\n<root>\r\n  pcdata content\r\n  <a attr1=\"xyz\"/>\r\n</root>\r\n<!--* a invalid test for P68 VC:Entity Declared *-->\r\n\r\n",
                    "output": "<root>&#10;  pcdata content&#10;  <a attr1=\"xyz\"></a>&#10;</root>"
                },
                "ibm68i02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm68i02.dtd\" [\r\n  <!ELEMENT root (#PCDATA|a)* >\r\n]>\r\n<root>\r\n  pcdata content\r\n  <a attr1=\"xyz\"/>\r\n</root>\r\n<!--* a invalid test for P68 VC:Entity Declared *-->\r\n\r\n",
                    "output": "<root>&#10;  pcdata content&#10;  <a attr1=\"xyz\"></a>&#10;</root>"
                },
                "ibm68i03.xml": {
                    "input": "<?xml version=\"1.0\" standalone='no'?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA)* >\r\n  <!ENTITY % pe1 SYSTEM \"ibm68i03.ent\">\r\n  %pe1;\r\n]>\r\n<root>\r\n  pcdata content\r\n</root>\r\n<!--* a invalid test for P68 VC:Entity Declared *-->\r\n",
                    "output": "<root>&#10;  pcdata content&#10;</root>"
                },
                "ibm68i04.xml": {
                    "input": "<?xml version=\"1.0\" standalone='no'?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA)* >\r\n  <!ENTITY % pe1 SYSTEM \"ibm68i04.ent\">\r\n  %pe1;\r\n]>\r\n<root>\r\n  pcdata content\r\n</root>\r\n<!--* a invalid test for P68 VC:Entity Declared *-->\r\n",
                    "output": "<root>&#10;  pcdata content&#10;</root>"
                }
            },
            "P69": {
                "ibm69i01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm69i01.dtd\" [\r\n  <!ELEMENT root (#PCDATA|a)* >\r\n]>\r\n<root>\r\n  pcdata content\r\n  <a attr1=\"xyz\"/>\r\n</root>\r\n<!--* a invalid test for P69 VC:Entity Declared *-->\r\n\r\n",
                    "output": "<root>&#10;  pcdata content&#10;  <a attr1=\"xyz\"></a>&#10;</root>"
                },
                "ibm69i02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm69i02.dtd\" [\r\n  <!ELEMENT root (#PCDATA|a)* >\r\n]>\r\n<root>\r\n  pcdata content\r\n  <a attr1=\"xyz\"/>\r\n</root>\r\n<!--* a invalid test for P69 VC:Entity Declared *-->\r\n\r\n",
                    "output": "<root>&#10;  pcdata content&#10;  <a attr1=\"xyz\"></a>&#10;</root>"
                },
                "ibm69i03.xml": {
                    "input": "<?xml version=\"1.0\" standalone='no'?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA)* >\r\n  <!ENTITY % pe1 SYSTEM \"ibm69i03.ent\">\r\n  %pe1;\r\n]>\r\n<root>\r\n  pcdata content\r\n</root>\r\n<!--* a invalid test for P69 VC:Entity Declared *-->\r\n",
                    "output": "<root>&#10;  pcdata content&#10;</root>"
                },
                "ibm69i04.xml": {
                    "input": "<?xml version=\"1.0\" standalone='no'?>\r\n<!DOCTYPE root  [\r\n  <!ELEMENT root (#PCDATA)* >\r\n  <!ENTITY % pe1 SYSTEM \"ibm69i04.ent\">\r\n  %pe1;\r\n]>\r\n<root>\r\n  pcdata content\r\n</root>\r\n<!--* a invalid test for P69 VC:Entity Declared *-->\r\n",
                    "output": "<root>&#10;  pcdata content&#10;</root>"
                }
            },
            "P76": {
                "ibm76i01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n<!ENTITY % pe1 '<!ATTLIST root att2 CDATA \"&ge1;\">'>\r\n<!ENTITY ge1 \"attdefaultvalue\" >\r\n%pe1;\r\n\r\n<!--* notation JPGformat not declared *-->\r\n<!ENTITY ge2  SYSTEM \"image.jpg\" NDATA JPGformat>\r\n\r\n]>\r\n<root att2=\"any\" />\r\n<!-- a invalid test case: test P76 VC: Notation Declared -->",
                    "output": "<root att2=\"any\"></root>"
                }
            }
        },
        "resources": {
            "P28": {},
            "P29": {},
            "P32": {
                "ibm32i01.dtd": "<!ATTLIST animal color CDATA #FIXED \"yellow\">",
                "ibm32i03.dtd": "<!ATTLIST animal class NMTOKEN #IMPLIED>",
                "ibm32i04.dtd": "<!ELEMENT animal (a,b,c)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b EMPTY>\r\n<!ELEMENT c EMPTY>"
            },
            "P39": {},
            "P41": {},
            "P45": {},
            "P49": {
                "ibm49i01.dtd": "<!ELEMENT a EMPTY>\r\n<!ELEMENT b (#PCDATA|c)* >\r\n<!ELEMENT c ANY>\r\n\r\n<!--* open and close parenthesis are in different PE replace Texts *-->\r\n<!ENTITY % choice1 \"(a|b\">\r\n<!ENTITY % choice2 \"|c)\">\r\n<!ELEMENT child1 %choice1;%choice2; >\r\n\r\n\r\n\r\n"
            },
            "P50": {
                "ibm50i01.dtd": "<!ELEMENT a EMPTY>\r\n<!ELEMENT b (#PCDATA|c)* >\r\n<!ELEMENT c ANY>\r\n\r\n<!--* PE replace Text has no closing parentheses *-->\r\n<!ENTITY % choice1 \"(a,b,c\">\r\n<!ELEMENT child1 (%choice1;)|c) >\r\n\r\n\r\n\r\n"
            },
            "P51": {
                "ibm51i01.dtd": "<!ELEMENT a (#PCDATA)* >\r\n<!ELEMENT b (#PCDATA) >\r\n<!ELEMENT c ( #PCDATA)*>\r\n\r\n<!ELEMENT d (#PCDATA|c)* >\r\n<!--* PEs are not properly nested *-->\r\n<!--* this one miss closing parenthesis *-->\r\n<!ENTITY % mixed1 \"(#PCDATA|\">\r\n<!ENTITY % mixed2 \"c|b|a)*\">  \r\n<!ELEMENT e %mixed1;%mixed2; >\r\n<!ELEMENT f (#PCDATA| c)* >\r\n<!ELEMENT g ( #PCDATA) >\r\n<!ELEMENT h (#PCDATA )>\r\n\r\n\r\n\r\n",
                "ibm51i03.dtd": "<?xml version=\"1.0\"?>\r\n\r\n\r\n\r\n\r\n"
            },
            "P56": {},
            "P58": {},
            "P59": {},
            "P60": {},
            "P68": {
                "ibm68i01.dtd": "<!ENTITY ge1 \"abcdef\">\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA \"&ge2;\">\r\n<!--* GE reference therebefore doesn't match declaration *-->\r\n",
                "ibm68i02.dtd": "<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA \"&ge1;\">\r\n<!--* GE reference in attr default before declaration *-->\r\n<!ENTITY ge1 \"abcdef\">",
                "ibm68i03.ent": "<!ENTITY ge1 \"abcdef\">\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA \"&ge2;\">\r\n<!--* GE reference in above doesn't match declaration *-->\r\n",
                "ibm68i04.ent": "<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA \"&ge1;\">\r\n<!ENTITY ge1 \"abcdef\">\r\n<!--* GE reference in attr default before declaration *-->\r\n"
            },
            "P69": {
                "ibm69i01.dtd": "<!ENTITY ge1 \"abcdef\">\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA \"&ge1;\">\r\n<!ENTITY % pe1 \"<!ATTLIST a attr2 CDATA #IMPLIED>\">\r\n%pe2;\r\n<!--* PE reference therebefore doesn't match declaration *-->\r\n",
                "ibm69i02.dtd": "<!ELEMENT a EMPTY>\r\n<!ENTITY ge1 \"abcdef\">\r\n<!ATTLIST a attr1 CDATA \"&ge1;\">\r\n%pe1;\r\n<!--* PE reference in attr default before declaration *-->\r\n<!ENTITY % pe1 \"<!ATTLIST a attr2 CDATA #IMPLIED>\">\r\n",
                "ibm69i03.ent": "<!ENTITY ge1 \"abcdef\">\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA  \"&ge1;\">\r\n<!ENTITY % pe2 \"<!ATTLIST a attr2 CDATA #IMPLIED>\">\r\n%pe3;\r\n<!--* PE reference in above doesn't match declaration *-->\r\n\r\n",
                "ibm69i04.ent": "<!ELEMENT a EMPTY>\r\n<!ENTITY ge1 \"abcdef\">\r\n<!ATTLIST a attr1 CDATA \"&ge1;\">\r\n%pe2;\r\n<!--* PE reference in attr default before declaration *-->\r\n<!ENTITY % pe2 \"<!ATTLIST a attr2 CDATA #IMPLIED>\">\r\n\r\n\r\n"
            },
            "P76": {}
        }
    }
}
export default testData;

const testData = {
    "ibm": {
        "tests": {
            "P01": {
                "ibm01n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE book [\r\n   <!ELEMENT book ANY>\r\n]>\r\n<!-- element is missing -->"
                },
                "ibm01n02.xml": {
                    "input": "<doc>Wrong ordering between prolog and element!</doc>\r\n<?xml version=\"1.0\"?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc ANY>\r\n]>"
                },
                "ibm01n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc ANY>\r\n   <!ELEMENT title ANY>\r\n]>\r\n<doc>Wrong combination!</doc>\r\n<?PI after document element?>\r\n<title>Wrong combination!</title>\r\n<?PI after title element?>\r\n"
                }
            },
            "P02": {
                "ibm02n01.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x00\r\n in p02: \u0000 -->\r\n<book/>\r\n"
                },
                "ibm02n02.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x01\r\n in p02: \u0001 -->\r\n<book/>\r\n"
                },
                "ibm02n03.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x02\r\n in p02: \u0002 -->\r\n<book/>\r\n"
                },
                "ibm02n04.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x03\r\n in p02: \u0003 -->\r\n<book/>\r\n"
                },
                "ibm02n05.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x04\r\n in p02: \u0004 -->\r\n<book/>\r\n"
                },
                "ibm02n06.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x05\r\n in p02: \u0005 -->\r\n<book/>\r\n"
                },
                "ibm02n07.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x06\r\n in p02: \u0006 -->\r\n<book/>\r\n"
                },
                "ibm02n08.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x07\r\n in p02: \u0007 -->\r\n<book/>\r\n"
                },
                "ibm02n09.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x08\r\n in p02: \b -->\r\n<book/>\r\n"
                },
                "ibm02n10.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x0b\r\n in p02: \u000b -->\r\n<book/>\r\n"
                },
                "ibm02n11.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x0c\r\n in p02: \f -->\r\n<book/>\r\n"
                },
                "ibm02n12.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x0e\r\n in p02: \u000e -->\r\n<book/>\r\n"
                },
                "ibm02n13.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x0f\r\n in p02: \u000f -->\r\n<book/>\r\n"
                },
                "ibm02n14.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x10\r\n in p02: \u0010 -->\r\n<book/>\r\n"
                },
                "ibm02n15.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x11\r\n in p02: \u0011 -->\r\n<book/>\r\n"
                },
                "ibm02n16.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x12\r\n in p02: \u0012 -->\r\n<book/>\r\n"
                },
                "ibm02n17.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x13\r\n in p02: \u0013 -->\r\n<book/>\r\n"
                },
                "ibm02n18.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x14\r\n in p02: \u0014 -->\r\n<book/>\r\n"
                },
                "ibm02n19.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x15\r\n in p02: \u0015 -->\r\n<book/>\r\n"
                },
                "ibm02n20.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x16\r\n in p02: \u0016 -->\r\n<book/>\r\n"
                },
                "ibm02n21.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x17\r\n in p02: \u0017 -->\r\n<book/>\r\n"
                },
                "ibm02n22.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x18\r\n in p02: \u0018 -->\r\n<book/>\r\n"
                },
                "ibm02n23.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x19\r\n in p02: \u0019 -->\r\n<book/>\r\n"
                },
                "ibm02n24.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x1a\r\n in p02: \u001a -->\r\n<book/>\r\n"
                },
                "ibm02n25.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x1b\r\n in p02: \u001b -->\r\n<book/>\r\n"
                },
                "ibm02n26.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x1c\r\n in p02: \u001c -->\r\n<book/>\r\n"
                },
                "ibm02n27.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x1d\r\n in p02: \u001d -->\r\n<book/>\r\n"
                },
                "ibm02n28.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x1e\r\n in p02: \u001e -->\r\n<book/>\r\n"
                },
                "ibm02n29.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x1f\r\n in p02: \u001f -->\r\n<book/>\r\n"
                },
                "ibm02n30.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #xd800\r\n in p02: ��� -->\r\n<book/>\r\n"
                },
                "ibm02n31.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #xdfff\r\n in p02: ��� -->\r\n<book/>\r\n"
                },
                "ibm02n32.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #xfffe\r\n in p02: ￾ -->\r\n<book/>\r\n"
                },
                "ibm02n33.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #xffff\r\n in p02: ￿ -->\r\n<book/>\r\n"
                }
            },
            "P03": {
                "ibm03n01.xml": {
                    "input": "<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n]>\r\n<!-- IllegalChar #x3000\r\n in p03: 　 -->\r\n<book>Illegal space 3000 in the end tag</book 　>\r\n"
                }
            },
            "P04": {
                "ibm04n01.xml": {
                    "input": "<!DOCTYPE IllegalNameChar! [\r\n   <!ELEMENT IllegalNameChar! EMPTY>\r\n]>\r\n<IllegalNameChar!/>\r\n\r\n"
                },
                "ibm04n02.xml": {
                    "input": "<!DOCTYPE IllegalNameChar( [\r\n   <!ELEMENT IllegalNameChar( EMPTY>\r\n]>\r\n<IllegalNameChar(/>\r\n\r\n"
                },
                "ibm04n03.xml": {
                    "input": "<!DOCTYPE IllegalNameChar) [\r\n   <!ELEMENT IllegalNameChar) EMPTY>\r\n]>\r\n<IllegalNameChar)/>\r\n\r\n"
                },
                "ibm04n04.xml": {
                    "input": "<!DOCTYPE IllegalNameChar+ [\r\n   <!ELEMENT IllegalNameChar+ EMPTY>\r\n]>\r\n<IllegalNameChar+/>\r\n\r\n"
                },
                "ibm04n05.xml": {
                    "input": "<!DOCTYPE IllegalNameChar, [\r\n   <!ELEMENT IllegalNameChar, EMPTY>\r\n]>\r\n<IllegalNameChar,/>\r\n\r\n"
                },
                "ibm04n06.xml": {
                    "input": "<!DOCTYPE IllegalNameChar/ [\r\n   <!ELEMENT IllegalNameChar/ EMPTY>\r\n]>\r\n<IllegalNameChar//>\r\n\r\n"
                },
                "ibm04n07.xml": {
                    "input": "<!DOCTYPE IllegalNameChar; [\r\n   <!ELEMENT IllegalNameChar; EMPTY>\r\n]>\r\n<IllegalNameChar;/>\r\n\r\n"
                },
                "ibm04n08.xml": {
                    "input": "<!DOCTYPE IllegalNameChar< [\r\n   <!ELEMENT IllegalNameChar< EMPTY>\r\n]>\r\n<IllegalNameChar</>\r\n\r\n"
                },
                "ibm04n09.xml": {
                    "input": "<!DOCTYPE IllegalNameChar= [\r\n   <!ELEMENT IllegalNameChar= EMPTY>\r\n]>\r\n<IllegalNameChar=/>\r\n\r\n"
                },
                "ibm04n10.xml": {
                    "input": "<!DOCTYPE IllegalNameChar? [\r\n   <!ELEMENT IllegalNameChar? EMPTY>\r\n]>\r\n<IllegalNameChar?/>\r\n\r\n"
                },
                "ibm04n11.xml": {
                    "input": "<!DOCTYPE IllegalNameChar[ [\r\n   <!ELEMENT IllegalNameChar[ EMPTY>\r\n]>\r\n<IllegalNameChar[/>\r\n\r\n"
                },
                "ibm04n12.xml": {
                    "input": "<!DOCTYPE IllegalNameChar\\ [\r\n   <!ELEMENT IllegalNameChar\\ EMPTY>\r\n]>\r\n<IllegalNameChar\\/>\r\n\r\n"
                },
                "ibm04n13.xml": {
                    "input": "<!DOCTYPE IllegalNameChar] [\r\n   <!ELEMENT IllegalNameChar] EMPTY>\r\n]>\r\n<IllegalNameChar]/>\r\n\r\n"
                },
                "ibm04n14.xml": {
                    "input": "<!DOCTYPE IllegalNameChar^ [\r\n   <!ELEMENT IllegalNameChar^ EMPTY>\r\n]>\r\n<IllegalNameChar^/>\r\n\r\n"
                },
                "ibm04n15.xml": {
                    "input": "<!DOCTYPE IllegalNameChar` [\r\n   <!ELEMENT IllegalNameChar` EMPTY>\r\n]>\r\n<IllegalNameChar`/>\r\n\r\n"
                },
                "ibm04n16.xml": {
                    "input": "<!DOCTYPE IllegalNameChar{ [\r\n   <!ELEMENT IllegalNameChar{ EMPTY>\r\n]>\r\n<IllegalNameChar{/>\r\n\r\n"
                },
                "ibm04n17.xml": {
                    "input": "<!DOCTYPE IllegalNameChar| [\r\n   <!ELEMENT IllegalNameChar| EMPTY>\r\n]>\r\n<IllegalNameChar|/>\r\n\r\n"
                },
                "ibm04n18.xml": {
                    "input": "<!DOCTYPE IllegalNameChar} [\r\n   <!ELEMENT IllegalNameChar} EMPTY>\r\n]>\r\n<IllegalNameChar}/>\r\n\r\n"
                }
            },
            "P05": {
                "ibm05n01.xml": {
                    "input": "<!DOCTYPE .A_name_starts_with. [\r\n   <!ELEMENT .A_name_starts_with. EMPTY>\r\n]>\r\n<.A_name_starts_with./>  \r\n"
                },
                "ibm05n02.xml": {
                    "input": "<!DOCTYPE -A_name_starts_With- [\r\n   <!ELEMENT -A_name_starts_With- EMPTY>\r\n]>\r\n<-A_name_starts_With-/>  \r\n"
                },
                "ibm05n03.xml": {
                    "input": "<!DOCTYPE 5A_name_starts_with_digit [\r\n   <!ELEMENT 5A_name_starts_with_digit EMPTY>\r\n]>\r\n<5A_name_starts_with_digit/>  \r\n"
                },
                "ibm05n04.xml": {
                    "input": "<!DOCTYPE illegalChar0f7÷InTheMiddle [\r\n   <!ELEMENT illegalChar0f7÷InTheMiddle EMPTY>\r\n]>\r\n<illegalChar0f7÷InTheMiddle/>\r\n\r\n"
                },
                "ibm05n05.xml": {
                    "input": "<!DOCTYPE illegalNameChar÷ [\r\n   <!ELEMENT illegalNameChar÷ EMPTY>\r\n]>\r\n<illegalNameChar÷/>\r\n\r\n"
                }
            },
            "P09": {
                "ibm09n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n \t<!ENTITY FullName \"Snow%Man\">\r\n]>\r\n\r\n<!-- testing invalid entity value -->\r\n<student>My Name is &FullName;. </student>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n "
                },
                "ibm09n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n \t<!ENTITY FullName \"Snow&Man\">\r\n]>\r\n\r\n<!-- testing invalid entity value -->\r\n<student>My Name is &FullName;. </student>"
                },
                "ibm09n03.xml": {
                    "input": "<?xml version=\"1.0\"?> \r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ENTITY FullName \"Snow\"Man\"> \r\n]>\r\n\r\n<!-- testing invalid entity value -->\r\n<student>My Name is &FullName;. </student>"
                },
                "ibm09n04.xml": {
                    "input": "<?xml version=\"1.0\"?> \r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ENTITY FullName \"SnowMan> \r\n]>\r\n\r\n<!-- testing invalid entity value -->\r\n<student>My Name is &FullName;. </student>\r\n"
                }
            },
            "P10": {
                "ibm10n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #IMPLIED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"I\">\r\n\t<!ENTITY mylast \"Man\">\r\n]>\r\n\r\n<!-- testing invalid attvalue -->\r\n<student first=\"Snow<Man\">My Name is SnowMan. </student>\r\n\r\n\r\n\r\n\r\n\r\n"
                },
                "ibm10n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #IMPLIED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"I\">\r\n\t<!ENTITY mylast \"Man\">\r\n]>\r\n\r\n<!-- testing invalid attvalue -->\r\n<student first=\"Snow&Man\">My Name is SnowMan. </student>\r\n"
                },
                "ibm10n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #IMPLIED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"I\">\r\n\t<!ENTITY mylast \"Man\">\r\n]>\r\n\r\n<!-- testing invalid attvalue -->\r\n<student first=\"Snow\"Man\">My Name is SnowMan. </student>\r\n"
                },
                "ibm10n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #IMPLIED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"I\">\r\n\t<!ENTITY mylast \"Man\">\r\n]>\r\n\r\n<!-- testing invalid attvalue with no closing bracket -->\r\n<student first=\"Snow >My Name is SnowMan. </student>\r\n"
                },
                "ibm10n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #IMPLIED > \r\n\t<!ENTITY myfirst \"SNow\">\r\n\t<!ENTITY mymiddle \"I\">\r\n\t<!ENTITY mylast \"Man\">\r\n]>\r\n\r\n<!-- testing invalid attvalue -->\r\n<student first='Snow<Man'>My Name is SnowMan. </student>\r\n"
                },
                "ibm10n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #IMPLIED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"I\">\r\n\t<!ENTITY mylast \"Man\">\r\n]>\r\n\r\n<!-- testing invalid attvalue -->\r\n<student first='Snow&Man'>My Name is SnowMan. </student>\r\n"
                },
                "ibm10n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #IMPLIED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"I\">\r\n\t<!ENTITY mylast \"Man\">\r\n]>\r\n\r\n<!-- testing invalid attvalue -->\r\n<student first=\"Snow\"Man\">My Name is SnowMan. </student>\r\n"
                },
                "ibm10n08.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #IMPLIED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"I\">\r\n\t<!ENTITY mylast \"Man\">\r\n]>\r\n\r\n<!-- testing invalid attvalue with no closing single quote -->\r\n<student first='Snow >My Name is SnowMan. </student>\r\n"
                }
            },
            "P11": {
                "ibm11n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student SYSTEM \"student\".dtd\"[\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid system literal  -->\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n "
                },
                "ibm11n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student SYSTEM 'student'.dtd'[\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid system literal  -->\r\n<student>My Name is SnowMan. </student>\r\n"
                },
                "ibm11n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student SYSTEM \"student.DTD [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid system literal with no closing bracket  -->\r\n<student>My Name is SnowMan. </student>\r\n"
                },
                "ibm11n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student SYSTEM 'student.DTD [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid system literal with no closing bracket  -->\r\n<student>My Name is SnowMan. </student>\r\n"
                }
            },
            "P12": {
                "ibm12n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n\t<!ENTITY info PUBLIC \"..\\info.dtd>\r\n]>\r\n\r\n<!-- testing invalid pubid literal with no closing bracket  -->\r\n<student>My Name is &info;. </student>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n "
                },
                "ibm12n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n\t<!ENTITY info PUBLIC '..\\info'.dtd'>\r\n]>\r\n\r\n<!-- testing invalid pubid literal -->\r\n<student>My Name is &info;. </student>\r\n"
                },
                "ibm12n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n\t<!ENTITY info PUBLIC '..\\info.dtd>\r\n]>\r\n\r\n<!-- testing invalid pubid literal with no closing bracket  -->\r\n<student>My Name is &info;. </student>"
                }
            },
            "P13": {
                "ibm13n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ENTITY info PUBLIC \"This is a {test} \" \"student.dtd\">\r\n]>\r\n\r\n<!-- testing invalid pubid char with {  -->\r\n<student>My Name is &info;. </student>\r\n\r\n\r\n\r\n\r\n "
                },
                "ibm13n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ENTITY info PUBLIC \"This is a test~. \" \"student.dtd\">\r\n]>\r\n\r\n<!-- testing invalid pubid char with ~  -->\r\n<student>My Name is &info;. </student>"
                },
                "ibm13n03.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!DOCTYPE student [\n\t<!ENTITY info PUBLIC \"This is a test á \" \"student.dtd\">\n]>\n\n<!-- testing invalid pubid char with á  -->\n<student>My Name is &info;. </student>\n\n"
                }
            },
            "P14": {
                "ibm14n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student first CDATA #REQUIRED\r\n\t\t\t  last  CDATA #IMPLIED>\r\n]>\r\n\r\n<!-- testing invalid chardata string  -->\r\n<student first=\"Snow\">My name is Snow ]]> Man</student>\r\n\r\n\r\n"
                },
                "ibm14n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student first CDATA #REQUIRED\r\n\t\t\t  last  CDATA #IMPLIED>\r\n]>\r\n\r\n<!-- testing invalid chardata string  -->\r\n<student first=\"Snow\">My name is Snow <Man </student>"
                },
                "ibm14n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student first CDATA #REQUIRED\r\n\t\t\t  last  CDATA #IMPLIED>\r\n]>\r\n\r\n<!-- testing invalid chardata string  -->\r\n<student first=\"Snow\">My name is Snow&Man </student>\r\n"
                }
            },
            "P15": {
                "ibm15n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid comment  -->\r\n<!------>\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n\r\n\r\n\r\n\r\n "
                },
                "ibm15n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid comment  -->\r\n<!-- Student's name ->\r\n<student>My Name is SnowMan. </student>"
                },
                "ibm15n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid comment  -->\r\n<!- student file-1 -->\r\n<student>My Name is SnowMan. </student>"
                },
                "ibm15n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid comment  -->\r\n<!--student phone number 408-777-8888 \r\n<student>My Name is SnowMan. </student>"
                }
            },
            "P16": {
                "ibm16n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid PI with illegal sequence  -->\r\n<?MyInstruct This is ?> a test ?>\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n"
                },
                "ibm16n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n\r\n<!-- testing invalid PI with missing PITarget  -->\r\n<??>\r\n<student>My Name is SnowMan. </student>"
                },
                "ibm16n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n\r\n<!-- testing invalid PI with wrong closing sequence  -->\r\n<?MyInstruct >\r\n<student>My Name is SnowMan. </student>"
                },
                "ibm16n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n\r\n<!-- testing invalid PI with missing sequence  -->\r\n<?MyInstruct \r\n<student>My Name is SnowMan. </student>"
                }
            },
            "P17": {
                "ibm17n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n\r\n<!-- testing invalid PITarget  -->\r\n<?XML This is a test ?>\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n"
                },
                "ibm17n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid PITarget  -->\r\n<?xML This is a test ?>\r\n<student>My Name is SnowMan. </student>"
                },
                "ibm17n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid PITarget  -->\r\n<?xml This is a test ?>\r\n<student>My Name is SnowMan. </student>"
                },
                "ibm17n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid PITarget  -->\r\n<?xmL This is a test ?>\r\n<student>My Name is SnowMan. </student>"
                }
            },
            "P18": {
                "ibm18n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid CDSect with missing CDStart   -->\r\n<student>My Name is SnowMan. This is <normal> text]]></student>\r\n\r\n\r\n"
                },
                "ibm18n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid CDSect with missing CDEnd  -->\r\n<student>My Name is SnowMan. <![CDATA[This is <normal> text </student>"
                }
            },
            "P19": {
                "ibm19n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid CDStart -->\r\n<![cdata[This is a test]]>\r\n<student>My Name is SnowMan. </student>"
                },
                "ibm19n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid CDStart -->\r\n<![[CDATA[This is a test]]>\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n"
                },
                "ibm19n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid CDStart -->\r\n<?[CDATA[This is a test]]>\r\n<student>My Name is SnowMan. </student>"
                }
            },
            "P20": {
                "ibm20n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid CData with illegal sequence -->\r\n<![CDATA[<testing>This is ]]> a test</testing>]]>\r\n<student>My Name is SnowMan. </student>"
                }
            },
            "P21": {
                "ibm21n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid CDEnd -->\r\n<![[CDATA[This is a test]>\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n"
                },
                "ibm21n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid CDEnd -->\r\n<![cdata[This is a test]]]>\r\n<student>My Name is SnowMan. </student>"
                },
                "ibm21n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing invalid CDEnd -->\r\n<![CDATA[This is a test])>\r\n<student>My Name is SnowMan. </student>"
                }
            },
            "P22": {
                "ibm22n01.xml": {
                    "input": "<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<?xml version=\"1.0\" encoding=\"ASCII\" ?>\r\n<doc/>\r\n<!-- Wrong ordering between DTD and XMLDecl -->"
                },
                "ibm22n02.xml": {
                    "input": "<!-- Wrong ordering Misc, DTD and XMLDecl -->\r\n<?xml version=\"1.0\" encoding=\"ASCII\" ?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n"
                },
                "ibm22n03.xml": {
                    "input": "<!-- Wrong ordering patter 4 -->\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<!-- Wrong ordering Misc, DTD, Misc, and XMLDecl -->\r\n<?xml version=\"1.0\" encoding=\"ASCII\" ?>\r\n<doc/>\r\n"
                }
            },
            "P23": {
                "ibm23n01.xml": {
                    "input": "<?xml encoding=\"ASCII\" ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Missing required field VersionInfo in XMLDecl -->"
                },
                "ibm23n02.xml": {
                    "input": "<?xml encoding='ASCII' version='1.0'?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong ordering between VersionInfo and EncodingDecl in XMLDecl -->"
                },
                "ibm23n03.xml": {
                    "input": "<?xml encoding='ASCII' standalone='yes' version='1.0'?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong ordering EncodingDecl, SDDecl, and VersionInfo in XMLDecl -->"
                },
                "ibm23n04.xml": {
                    "input": "<?XML version='1.0'?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong keyword in XMLDecl -->"
                },
                "ibm23n05.xml": {
                    "input": "<?xml version='1.0' encoding='ASCII' standalone='yes' >\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong closing sequence in XMLDecl -->"
                },
                "ibm23n06.xml": {
                    "input": "<!xml version='1.0' encoding='ASCII' standalone='yes' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong opening sequence in XMLDecl -->"
                }
            },
            "P24": {
                "ibm24n01.xml": {
                    "input": "<?xml version= ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- VersioNum is missing in VersionInfo -->"
                },
                "ibm24n02.xml": {
                    "input": "<?xmlversion='1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- S is missing in VersionInfo -->"
                },
                "ibm24n03.xml": {
                    "input": "<?xml version'1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]> \r\n<doc/>\r\n<!-- Eq is missing in VersionInfo -->"
                },
                "ibm24n04.xml": {
                    "input": "<?xml '1.0'=version ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong ordering VersionNum Eq 'version' -->"
                },
                "ibm24n05.xml": {
                    "input": "<?xml version'1.0'= ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong ordering version VersionNum Eq -->"
                },
                "ibm24n06.xml": {
                    "input": "<?xml Version='1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong key word 'Version' -->"
                },
                "ibm24n07.xml": {
                    "input": "<?xml versioN='1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong key word 'versioN' -->"
                },
                "ibm24n08.xml": {
                    "input": "<?xml version='1.0\" ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Mismatched qotes in VersionInfo -->"
                },
                "ibm24n09.xml": {
                    "input": "<?xml version='1.0 ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Mismatched qotes in VersionInfo -->"
                }
            },
            "P25": {
                "ibm25n01.xml": {
                    "input": "<?xml version=='1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong key word \"==\" in Eq -->"
                },
                "ibm25n02.xml": {
                    "input": "<?xml version eq '1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- Wrong key word \"eq\" in Eq -->"
                }
            },
            "P26": {
                "ibm26n01.xml": {
                    "input": "<?xml version='_#1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- illegal character '#' in VersionNum -->"
                }
            },
            "P27": {
                "ibm27n01.xml": {
                    "input": "<?xml version=\"1.0\" ?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal ANY>\r\n]>\r\n<animal>Wrong type of Misc following this element!</animal>\r\n<!ELEMENT cat EMPTY>"
                }
            },
            "P28": {
                "ibm28n01.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE SYSTEM \"ibm28n01.dtd\">\r\n<!-- Name is missing in doctypedecl --> \r\n<animal/>\r\n"
                },
                "ibm28n02.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE [\r\n<!ELEMENT animal EMPTY>\r\n] animal>\r\n<!-- Wrong ordering [ ] Name in doctypedecl --> \r\n<animal/>\r\n"
                },
                "ibm28n03.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE SYSTEM \"ibm28n01.dtd\" animal [\r\n   <!ATTLIST animal color CDATA #REQUIRED>\r\n]>\r\n<!-- Wrong ordering ExternalID Name [ ] in doctypedecl --> \r\n<animal color=\"yellow\"/>\r\n"
                },
                "ibm28n04.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE aniaml [\r\n   <!ELEMENT animal ANY>\r\n   <!ENTITY generalE \"leopard\">\r\n   &generalE;\r\n   <!ENTITY % parameterE \"<!ELEMENT leopard EMPTY>\">\r\n   %parameterE;\r\n] animal>\r\n<!-- Wrong componet general entity reference occurs inside the DTD -->\r\n<!-- General entity sould be used in the document content --> \r\n<animal>&generalE</animal>\r\n"
                },
                "ibm28n05.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCtYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- Wrong keyword DOCTYPE in doctypedecl --> \r\n<animal/>\r\n"
                },
                "ibm28n06.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n>\r\n<!-- Bracket mismatch in [ ] in doctypedecl --> \r\n<animal/>\r\n"
                },
                "ibm28n07.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE animal {\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- Wrong bracket in [ ] in doctypedecl --> \r\n<animal/>\r\n"
                },
                "ibm28n08.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<?DOCTYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- Wrong opening sequence in doctypedecl --> \r\n<animal/>\r\n"
                },
          },
            "P29": {
                "ibm29n01.xml": {
                    "input": "<!DOCTYPE animal [\r\n   <?xml version=\"1.0\" encoding=\"ASCII\" ?>\r\n   <!-- Illegal markupdecl in DTD --> \r\n   <!ELEMENT animal (cat|tiger|leopard)+>\r\n   <!ELEMENT cat EMPTY>\r\n   <!ELEMENT tiger (#PCDATA)>\r\n   <!ELEMENT leopard ANY>\r\n   <!ELEMENT small EMPTY>\r\n   <!ELEMENT big EMPTY>\r\n   <!ATTLIST tiger color CDATA #REQUIRED>\r\n]>\r\n<animal>\r\n   <cat/>\r\n   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>\r\n   <cat/>\r\n   <leopard>\r\n      <small/>\r\n      <big/>\r\n   </leopard>\r\n</animal>\r\n"
                },
                "ibm29n02.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal ANY>\r\n   <!ENTITY % parameterE \"leopard EMPTY>\">\r\n   <!ELEMENT %parameterE;\r\n]>\r\n<!-- Parameter reference appears inside elementdecl in DTD -->\r\n<animal>Any content</animal>\r\n"
                },
                "ibm29n03.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal ANY>\r\n   <!ENTITY % parameterE \"color\">\r\n   <!ATTLIST animal %parameterE; CDATA #IMPLIED>\r\n]>\r\n<!-- Parameter reference appears inside AttlistDecl in DTD -->\r\n<animal>Any content</animal>\r\n"
                },
                "ibm29n04.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal ANY>\r\n   <!ENTITY % parameterE \"A leopard\">\r\n   <!ENTITY content \"%parameterE;\">\r\n]>\r\n<!-- Parameter reference appears inside an entity declaration in DTD -->\r\n<animal>&content;</animal>\r\n"
                },
                "ibm29n05.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal ANY>\r\n   <!ENTITY % parameterE \"A music file ?>\">\r\n   <?music %parameterE;\r\n]>\r\n<!-- Parameter reference appears inside a PI in DTD -->\r\n<animal>Any content</animal>\r\n"
                },
                "ibm29n06.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal ANY>\r\n   <!ENTITY % parameterE \"A music file -->\">\r\n<!-- Parameter reference appears inside a comment in DTD -->\r\n   <!-- This is %parameterE;\r\n]>\r\n<animal>Any content</animal>\r\n"
                },
                "ibm29n07.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal ANY>\r\n   <!ENTITY % parameterE \"cat SYSTEM\">\r\n   <!NOTATION %parameterE; \"cat.txt\">\r\n]>\r\n<!-- Parameter reference appears inside a NotationDecl in DTD -->\r\n<animal>Any content</animal>\r\n"
                }
            },
            "P30": {
                "ibm30n01.xml": {
                    "input": "<!DOCTYPE animal SYSTEM \"ibm30n01.dtd\">\r\n<animal/>\r\n<!-- Wrong ordering extSubsetDecl TextDecl in the external DTD -->"
                }
            },
            "P31": {
                "ibm31n01.xml": {
                    "input": "<!DOCTYPE animal SYSTEM \"ibm31n01.dtd\">\r\n<animal/>\r\n<!-- Illegal extSubsetDecl in the external DTD -->"
                }
            },
            "P32": {
                "ibm32n01.xml": {
                    "input": "<?xml version=\"1.0\"standalone=\"yes\" ?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- Missing a S in SDDecl -->\r\n<animal/>\r\n"
                },
                "ibm32n02.xml": {
                    "input": "<?xml version=\"1.0\" standalone\"yes\" ?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- Missing Eq in SDDecl -->\r\n<animal/>\r\n"
                },
                "ibm32n03.xml": {
                    "input": "<?xml version=\"1.0\" Standalone=\"yes\" ?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- Wrong keyword in SDDecl -->\r\n<animal/>\r\n"
                },
                "ibm32n04.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"Yes\" ?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- Wrong keyword in SDDecl -->\r\n<animal/>\r\n"
                },
                "ibm32n05.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"YES\" ?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- Wrong keyword in SDDecl -->\r\n<animal/>\r\n"
                },
                "ibm32n06.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"No\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32n06.dtd\">\r\n<!-- Wrong keyword in SDDecl -->\r\n<animal/>\r\n"
                },
                "ibm32n07.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"NO\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32n06.dtd\">\r\n<!-- Wrong keyword in SDDecl -->\r\n<animal/>\r\n"
                },
                "ibm32n08.xml": {
                    "input": "<?xml version=\"1.0\" standalone\"Yes\"= ?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- Wrong ordering in SDDecl -->\r\n<animal/>\r\n"
                },
                "ibm32n09.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"yes\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32n09.dtd\" [\r\n   <!ELEMENT animal (#PCDATA)>\r\n]>\r\n<!-- This is test violates WFC: Entity Declared in P68\r\n The standalone document declaration has the value \"yes\", there is an \r\n external markup declaration of an entity (other than amp, lt, gt, apos, quot), and references to this entity appear in the document. \r\n-->\r\n<animal>&animal_content;</animal>\r\n"
                }
            },
            "P39": {
                "ibm39n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n]>\r\n<root>missing end tag\r\n\r\n"
                },
                "ibm39n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n]>\r\nmissing start tag</root>\r\n"
                },
                "ibm39n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n]>\r\n<root>\r\n<!--* Missing end tag and no content -->\r\n"
                },
                "ibm39n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n]>\r\n</root>\r\n<!--* Missing start tag and no content -->\r\n\r\n\r\n"
                },
                "ibm39n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n]>\r\n</root>switched start and end tags<root>\r\n"
                },
                "ibm39n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n]>\r\n<root></root>content after end tag\r\n"
                }
            },
            "P40": {
                "ibm40n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<attr1=\"any\">missing name in start tag</root>\r\n\r\n\r\n\r\n"
                },
                "ibm40n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<rootattr1=\"any\">missing white space in start tag</root>\r\n"
                },
                "ibm40n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<attr1=\"any\" root>Wrong ordering in start tag</root>\r\n"
                },
                "ibm40n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<!root attr1=\"any\">wrong begining sequence in start tag</root>\r\n"
                },
                "ibm40n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root attr1=\"any1\" attr1=\"any2\">duplicate attr names in start tag</root>\r\n\r\n\r\n"
                }
            },
            "P41": {
                "ibm41n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root =\"any\">missing name in Attribute</root>\r\n"
                },
                "ibm41n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root attr1\"any\">missing Eq in Attribute</root>\r\n"
                },
                "ibm41n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root attr1= >missing AttValue in Attribute</root>\r\n"
                },
                "ibm41n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root \"any\">missing name and Eq in Attribute</root>\r\n"
                },
                "ibm41n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root attr1>missing Eq and AttValue in Attribute</root>\r\n"
                },
                "ibm41n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root = >missing Name and AttValue in Attribute</root>\r\n"
                },
                "ibm41n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root attr1\"any\"=>wrong ordering in Attribute</root>\r\n"
                },
                "ibm41n08.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root \"any\"=attr1>wrong ordering in Attribute</root>\r\n"
                },
                "ibm41n09.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root =attr1\"any\">wrong ordering in Attribute</root>\r\n"
                },
                "ibm41n10.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n<!ENTITY aExternal SYSTEM \"ibm41n10.ent\">\r\n]>\r\n<root attr1=\"&aExternal;\">direct reference to external entinity in Attribute</root>\r\n"
                },
                "ibm41n11.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n<!ENTITY aExternal SYSTEM \"ibm41n11.ent\">\r\n<!ENTITY aIndirect \"&aExternal;\">\r\n]>\r\n<root attr1=\"&aIndirect;\">indirect reference to external entinity in Attribute</root>\r\n"
                },
                "ibm41n12.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root attr1=\"&aImage;\">direct reference to external unparsed entinity in Attribute</root>\r\n\r\n"
                },
                "ibm41n13.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n<!ENTITY withlt \"have <lessthan> inside\">\r\n]>\r\n<root attr1=\"&withlt;\">Direct reference to an entity with &lt; as part of its replacement text in Attribute</root>\r\n"
                },
                "ibm41n14.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n<!ENTITY withlt \"have <lessthan> inside\">\r\n<!ENTITY aIndirect \"&withlt;\">\r\n]>\r\n<root attr1=\"&aIndirect;\">indirect reference to an entity with &lt; as part of its replacement text in Attribute</root>\r\n"
                }
            },
            "P42": {
                "ibm42n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n]>\r\n<root attr1=\"any\">missing Name in ETag</>\r\n"
                },
                "ibm42n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n]>\r\n<root attr1=\"any\">Wrong begining sequence in ETag <\\root>\r\n"
                },
                "ibm42n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n]>\r\n<root attr1=\"any\">Wrong begining sequence in ETag <root>\r\n"
                },
                "ibm42n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n]>\r\n<root attr1=\"any\">Extra white space before Name in ETag </ root>\r\n"
                },
                "ibm42n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root ANY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n]>\r\n<root> Attribute in ETag </root attr1=\"any\">\r\n"
                }
            },
            "P43": {
                "ibm43n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY % paaa \"a string\">\r\n]>\r\n<root>\r\n<!NOTATION nota1 SYSTEM \"bogus.not\">\r\n</root>\r\n<!--* NotationDecl in content -->"
                },
                "ibm43n02.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY % paaa \"a string\">\r\n]>\r\n<root>\r\n<!ELEMENT ele1 ANY>\r\n</root>\r\n<!--* ElementDecl in content -->\r\n"
                },
                "ibm43n04.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY % paaa \"a string\">\r\n]>\r\n<root>\r\n<!ENTITY GE1 \"This is an entity declaration\">\r\n</root>\r\n<!--* EntityDecl in content -->\r\n"
                },
                "ibm43n05.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY % paaa \"a string\">\r\n]>\r\n<root>\r\n<!ATTLIST root attr1 ID #IMPLIED>\r\n</root>\r\n<!--* AttlistDecl in content -->\r\n"
                }
            },
            "P44": {
                "ibm44n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n< />\r\n<!--* Missing Name and Attribute EmptyElemTag *-->\r\n"
                },
                "ibm44n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<attr1=\"any\" root/>\r\n<!--* Swithech positions of Name and Attribute EmptyElemTag *-->\r\n"
                },
                "ibm44n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root attr1=\"any\"\\>\r\n<!--* Wrong closing sequence in EmptyElemTag *-->\r\n\r\n\r\n\r\n\r\n"
                },
                "ibm44n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root attr1 CDATA #IMPLIED>\r\n<!ATTLIST root attr2 CDATA #IMPLIED>\r\n]>\r\n<root attr1=\"any1\" attr1=\"any2\"/>\r\n<!--* Duplicate Attribute Name in EmptyElemTag *-->\r\n"
                }
            },
            "P45": {
                "ibm45n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Mising Name in elementdecl *-->\r\n<!ELEMENT (#PCDATA)>\r\n]>\r\n<root>Any content</root>\r\n\r\n\r\n"
                },
                "ibm45n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Mising white space in elementdecl *-->\r\n<!ELEMENT aEle(#PCDATA)>\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm45n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Mising contentspec in elementdecl *-->\r\n<!ELEMENT root >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm45n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Mising contentspec and white space in elementdecl *-->\r\n<!ELEMENT root>\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm45n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Mising Name S contentspec in elementdecl *-->\r\n<!ELEMENT >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm45n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Wrong ordering in elementdecl *-->\r\n<!ELEMENT (#PCDATA) aElement >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm45n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Wrong begining sequence in elementdecl *-->\r\n<ELEMENT aElement (#PCDATA)>\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm45n08.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Wrong Keyword: Element in elementdecl *-->\r\n<!Element aElement (#PCDATA)>\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm45n09.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Wrong keyword: element in elementdecl *-->\r\n<!element aElement (#PCDATA)>\r\n]>\r\n<root>Any content</root>\r\n"
                }
            },
            "P46": {
                "ibm46n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Wrong keyword: empty in contentspec *-->\r\n<!ELEMENT aElement empty>\r\n]>\r\n<root>Any content</root>\r\n\r\n"
                },
                "ibm46n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Wrong keyword: Empty in contentspec *-->\r\n<!ELEMENT aElement Empty >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm46n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Wrong keyword: Any in contentspec *-->\r\n<!ELEMENT aElement Any>\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm46n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Wrong keyword: any in contentspec *-->\r\n<!ELEMENT aElement any >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm46n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Bogus content type: #CDATA in contentspec *-->\r\n<!ELEMENT aElement #CDATA>\r\n]>\r\n<root>Any content</root>\r\n"
                }
            },
            "P47": {
                "ibm47n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Missing choice|seq in children *-->\r\n<!ELEMENT aElement + >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm47n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Missing choice|seq in children *-->\r\n<!ELEMENT aElement * >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm47n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* Missing choice|seq in children *-->\r\n<!ELEMENT aElement ? >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm47n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Wrong ordering in children *-->\r\n<!ELEMENT aElement *(a,a) >\r\n]>\r\n<root>Any content</root>\r\n\r\n\r\n"
                },
                "ibm47n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* Wrong ordering in children *-->\r\n<!ELEMENT aElement +(a|a) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm47n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Wrong keyword: ^  in children *-->\r\n<!ELEMENT aElement (a,a)^ >\r\n]>\r\n<root>Any content</root>\r\n"
                }
            },
            "P48": {
                "ibm48n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing seq|choice|Name in cp *-->\r\n<!ELEMENT aElement ((a,a)|+) >\r\n]>\r\n<root>Any content</root>\r\n\r\n\r\n"
                },
                "ibm48n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing seq|choice|Name in cp *-->\r\n<!ELEMENT aElement (*) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm48n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing seq|choice|Name in cp *-->\r\n<!ELEMENT aElement (?|(a,a)|a) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm48n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* wrong ordering in cp *-->\r\n<!ELEMENT aElement (+(a,a)|a) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm48n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* wrong ordering in cp *-->\r\n<!ELEMENT aElement (*(a|b),a) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm48n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* wrong ordering in cp *-->\r\n<!ELEMENT aElement (a, ?a) >\r\n]>\r\n<root>Any content</root>\r\n\r\n"
                },
                "ibm48n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* wrong keyword: ^ in cp *-->\r\n<!ELEMENT aElement ( a^ | a ) >\r\n]>\r\n<root>Any content</root>\r\n"
                }
            },
            "P49": {
                "ibm49n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* missing cp in choice *-->\r\n<!ELEMENT aElement (|)* >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm49n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* missing cp in choice *-->\r\n<!ELEMENT aElement (a |b|)* >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm49n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* wrong separator: !  in choice *-->\r\n<!ELEMENT aElement (a!b)+ >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm49n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* missing separator in choice *-->\r\n<!ELEMENT aElement (a b) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm49n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* extra separator in choice *-->\r\n<!ELEMENT aElement (a ||b)* >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm49n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* missing closing bracket in choice *-->\r\n<!ELEMENT aElement (a |b * >\r\n]>\r\n<root>Any content</root>\r\n\r\n"
                }
            },
            "P50": {
                "ibm50n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* missing cp in seq *-->\r\n<!ELEMENT aElement (,) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm50n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* missing cp in seq *-->\r\n<!ELEMENT aElement (a,a,)+ >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm50n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* wrong separators in seq *-->\r\n<!ELEMENT aElement (a,a|b) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm50n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* wrong separator in seq *-->\r\n<!ELEMENT aElement (a . b)* >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm50n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* extra separator in seq *-->\r\n<!ELEMENT aElement ((a|b),,a)? >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm50n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* missing separator in seq *-->\r\n<!ELEMENT aElement ((a|b) (b|a)) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm50n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* wrong closing bracket in seq *-->\r\n<!ELEMENT aElement (a, b]* >\r\n]>\r\n<root>Any content</root>\r\n"
                }
            },
            "P51": {
                "ibm51n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* wrong keyword : #pcdata in Mixed  *-->\r\n<!ELEMENT aElement (#pcdata)* >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm51n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* #PCDATA must be the first in Mixed  *-->\r\n<!ELEMENT aElement ( a | b|#PCDATA)* >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm51n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* Missing '|' in Mixed  *-->\r\n<!ELEMENT aElement ( #PCDATA a )* >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm51n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* wrong keyword: #CDATA in Mixed  *-->\r\n<!ELEMENT aElement (#CDATA) >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm51n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* Missing '* after ')' in Mixed  *-->\r\n<!ELEMENT aElement ( #PCDATA | a ) >\r\n]>\r\n<root>Any content</root>"
                },
                "ibm51n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* Wrong closing bracket in Mixed  *-->\r\n<!ELEMENT aElement ( #PCDATA | a ]* >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm51n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!ELEMENT b ANY>\r\n<!--* Missing closing bracket in Mixed  *-->\r\n<!ELEMENT aElement ( #PCDATA *>\r\n]>\r\n<root>Any content</root>\r\n"
                }
            },
            "P52": {
                "ibm52n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing Name in AttlistDecl *-->\r\n<!ATTLIST attr1 CDATA #IMPLIED>\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm52n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing white space after 'ATTLIST' *-->\r\n<!ATTLISTa attr1 ID #REQUIRED >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm52n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Wrong ordering in AttlistDecl *-->\r\n<!ATTLIST attr1 CDATA \"defaultAttValue\" a attr2 CDATA #IMPLIED>\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm52n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Wrong keyword: Attlist in AttlistDecl *-->\r\n<!Attlist a attr1 CDATA #REQUIRED >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm52n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing closing bracket in AttlistDecl *-->\r\n<!ATTLIST a \r\n<!--* random *-->\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm52n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Wrong begining sequence in AttlistDecl *-->\r\n<ATTLIST a attr1 CDATA \"default\">\r\n]>\r\n<root>Any content</root>\r\n"
                }
            },
            "P53": {
                "ibm53n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing DefaultDecl in AttDef *-->\r\n<!ATTLIST a attr1 CDATA >\r\n]>\r\n<root>Any content</root>\r\n\r\n\r\n"
                },
                "ibm53n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing white space between AttType and DefaultDecl in AttDef *-->\r\n<!ATTLIST a attr1 (abc|def)\"def\">\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm53n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing AttType in AttDef *-->\r\n<!ATTLIST a attr1 #IMPLIED>\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm53n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing white space between Name and AttType in AttDef *-->\r\n<!ATTLIST a attr1(abc|def) \"abc\" >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm53n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing Name in AttDef *-->\r\n<!ATTLIST a (abc|def) \"def\" >\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm53n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Missing white space before Name in AttDef *-->\r\n<!ATTLIST a attr1 CDATA \"default\"attr2 ID #required>\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm53n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* Wrong ordering in AttDef *-->\r\n<!ATTLIST a (abc|def) attr1 \"abc\">\r\n]>\r\n<root>Any content</root>\r\n"
                },
                "ibm53n08.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n<!ELEMENT root (#PCDATA)>\r\n<!ELEMENT a ANY>\r\n<!--* wrong ordering in AttDef *-->\r\n<!ATTLIST a \"default\" CDATA attr1 >\r\n]>\r\n<root>Any content</root>\r\n"
                }
            },
            "P54": {
                "ibm54n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 54-->\r\n<!DOCTYPE AttrType\r\n[\r\n<!ELEMENT AttrType ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a att BOGUSATTR #IMPLIED> \r\n]>\r\n<AttrType>\r\nGiving a Bogus attribute. \r\n</AttrType>"
                },
                "ibm54n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 54-->\r\n<!DOCTYPE AttrType\r\n[\r\n<!ELEMENT AttrType ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a att PCDATA #IMPLIED> \r\n]>\r\n<AttrType>\r\nGiving a wrong AttType for the attribute. \r\n<a att=\"23\" ></a>\r\n</AttrType>"
                }
            },
            "P55": {
                "ibm55n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test syntax invalid for Production 55-->\r\n<!DOCTYPE AttrType\r\n[\r\n<!ELEMENT AttrType (#PCDATA)>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a att cdata #IMPLIED>  \r\n]>\r\n<AttrType>\r\nGiving a lowercase for CDATA attribute.\r\n</AttrType>"
                },
                "ibm55n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test invalid syntax for Production 55-->\r\n<!DOCTYPE AttrType\r\n[\r\n<!ELEMENT AttrType (#PCDATA)>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a att #CDATA #IMPLIED> \r\n]>\r\n<AttrType>\r\nGiving a wrong character. \r\n</AttrType>"
                },
                "ibm55n03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test invalid syntax for Production 55-->\r\n<!DOCTYPE AttrType\r\n[\r\n<!ELEMENT AttrType (#PCDATA)>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a att CData #IMPLIED> \r\n]>\r\n<AttrType>\r\n Giving a wrong key word of the StringType.\r\n</AttrType>"
                }
            },
            "P56": {
                "ibm56n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 56-->\r\n<!DOCTYPE root\r\n[\r\n<!ELEMENT root ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr id #REQUIRED>\r\n]>\r\n<root>\r\nInvalid TokenizedType id(lowercase)\r\n</root>"
                },
                "ibm56n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 56-->\r\n<!DOCTYPE root\r\n[\r\n<!ELEMENT root ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr Idref #REQUIRED>\r\n]>\r\n<root>\r\nInvalid TokenizedType Idref(case sensitive)\r\n</root>"
                },
                "ibm56n03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 56-->\r\n<!DOCTYPE root\r\n[\r\n<!ELEMENT root ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr IdRefs #REQUIRED>\r\n]>\r\n<root>\r\nInvalid TokenizedType IdRefs(case sensitive)\r\n</root>"
                },
                "ibm56n04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 56-->\r\n<!DOCTYPE root\r\n[\r\n<!ELEMENT root ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr EntitY #REQUIRED>\r\n]>\r\n<root>\r\nInvalid TokenizedType EntitY(case sensitive)\r\n</root>"
                },
                "ibm56n05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 56-->\r\n<!DOCTYPE root\r\n[\r\n<!ELEMENT root ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr nmTOKEN #REQUIRED>\r\n]>\r\n<root>\r\nInvalid TokenizedType nmTOKEN(case sensitive)\r\n</root>"
                },
                "ibm56n06.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 56-->\r\n<!DOCTYPE root\r\n[\r\n<!ELEMENT root ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr NMtokens #REQUIRED>\r\n]>\r\n<root>\r\nInvalid TokenizedType NMtokens(case sensitive)\r\n</root>"
                },
                "ibm56n07.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 56-->\r\n<!DOCTYPE root\r\n[\r\n<!ELEMENT root ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr #ID #REQUIRED>\r\n]>\r\n<root>\r\nInvalid TokenizedType #ID(Wrong Character)\r\n</root>"
                }
            },
            "P57": {
                "ibm57n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 57-->\r\n<!DOCTYPE root\r\n [\r\n <!ELEMENT root EMPTY>\r\n <!ATTLIST root att NMTOKEN (a|b) #IMPLIED>\r\n ]>\r\n <root>\r\nThis test case tests the illegal enumerated types\r\n</root>"
                }
            },
            "P58": {
                "ibm58n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!NOTATION this SYSTEM \"alpha\">\r\n <!ATTLIST one attr notation (this) #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test with notation (name) \r\nIt is case sensitive.\r\n</test>"
                },
                "ibm58n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!NOTATION this SYSTEM \"alpha\">\r\n <!ATTLIST one attr NOTATION this) #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test with  (name) \r\nMissing the open parenthesis\r\n</test>"
                },
                "ibm58n03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!NOTATION this SYSTEM \"alpha\">\r\n <!ATTLIST one attr NOTATION () #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test with  NOTATION () \r\nMissing the required field\r\n</test>"
                },
                "ibm58n04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!NOTATION this SYSTEM \"alpha\">\r\n <!ATTLIST one attr NOTATION (this #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test with  NOTATION (Name \r\nMissing the closing brackets\r\n</test>"
                },
                "ibm58n05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!NOTATION this SYSTEM \"alpha\">\r\n <!ATTLIST one attr (this) NOTATION #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test with (Name) NOTATION  \r\nWrong Ordering\r\n</test>"
                },
                "ibm58n06.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- Syntax test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!NOTATION this SYSTEM \"alpha\">\r\n <!NOTATION that SYSTEM \"beta\">\r\n <!ATTLIST three attr NOTATION (this,that) #IMPLIED>\r\n ]>\r\n<test>\r\nNegative Test.\r\nThis test tests the presence of a correct seperator. There is a wrong seperator(,)\r\n</test>"
                },
                "ibm58n07.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- Syntax test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!NOTATION this SYSTEM \"alpha\">\r\n <!ATTLIST three attr NOTATION(this) #IMPLIED>\r\n ]>\r\n<test>\r\nNegative Test.\r\nMissing space after NOTATION\r\n</test>"
                },
                "ibm58n08.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- Syntax test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!NOTATION this SYSTEM \"alpha\">\r\n <!ATTLIST three attr NOTATION (\"this\") #IMPLIED>\r\n ]>\r\n<test>\r\nNegative Test.\r\nPresence of quotes around the value\r\n</test>"
                }
            },
            "P59": {
                "ibm59n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 59-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT enum (#PCDATA)>\r\n <!ATTLIST one attr () #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test\r\nMissing the required field\r\n</test>"
                },
                "ibm59n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 59-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT enum (#PCDATA)>\r\n <!ATTLIST one attr (enum #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test\r\nMissing the closing brackets\r\n</test>"
                },
                "ibm59n03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 59-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!ELEMENT enum (#PCDATA)>\r\n <!ATTLIST one attr (enum,two) #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test\r\nWrong Separator(, instead of |)\r\n</test>"
                },
                "ibm59n04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 59-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT enum (#PCDATA)>\r\n <!ATTLIST one attr (\"enum\") #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test\r\nIllegal presence of quotes around the value\r\n</test>"
                },
                "ibm59n05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 59-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT enum (#PCDATA)>\r\n <!ATTLIST one attr enum) #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test\r\nMissing the begining bracket  \r\n</test>"
                },
                "ibm59n06.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 59-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT enum (#PCDATA)>\r\n <!ATTLIST one attr enum) #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Negative test\r\nMissing the Opening brackets\r\n</test>"
                }
            },
            "P60": {
                "ibm60n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ATTLIST one chapter CDATA #required>\r\n ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\nNegative Test. Case sensitive.\r\n</Java>"
                },
                "ibm60n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ATTLIST one chapter CDATA #Implied>\r\n ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\nNegative test. Case Sensitive\r\n</Java>"
                },
                "ibm60n03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ATTLIST one chapter CDATA !IMPLIED>\r\n ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\nNegative Test. Wrong Character.\r\n</Java>"
                },
                "ibm60n04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ATTLIST one chapter CDATA #FIXED >\r\n ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\nNegative test. Missing required field(#FIXED should have a value)\r\n</Java>"
                },
                "ibm60n05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ATTLIST one chapter CDATA #FIXED\"Introduction\">\r\n ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\nNegative test. Missing required field(#FIXED should have a space before value)\r\n</Java>"
                },
                "ibm60n06.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ATTLIST one chapter CDATA \"Introduction\" #FIXED>\r\n ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\nNegative test. Wrong Ordering\r\n</Java>"
                },
                "ibm60n07.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- WFC test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ENTITY avalue \"<Introduction\">\r\n <!ATTLIST one chapter CDATA #REQUIRED>\r\n ]>\r\n<Java>\r\n<one chapter=\"&avalue;\"></one>\r\nNegative test. \r\nThe replacement text of any entity referred to directly or indirectly \r\nin an attribute value contains a less than character\r\n</Java>"
                },
                "ibm60n08.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ATTLIST one chapter CDATA #REQUIRED #IMPLIED>\r\n ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\nNegative Test. More than one Default type declarations.\r\n</Java>\r\n"
                }
            },
            "P61": {
                "ibm61n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 61-->\r\n<!DOCTYPE animal SYSTEM \"ibm61n01.dtd\">\r\n<animal>\r\n <tiger/>\r\n</animal>\r\n"
                }
            },
            "P62": {
                "ibm62n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62n01.dtd\">\r\n<animal>\r\n <tiger/>\r\nNegative test. Test includeSect with include(Case sensitive)\r\n</animal>\r\n"
                },
                "ibm62n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62n02.dtd\">\r\n<animal>\r\n <tiger/>\r\nNegative test.  An extra '[' is used.\r\n</animal>\r\n"
                },
                "ibm62n03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62n03.dtd\">\r\n<animal>\r\n <tiger/>\r\nNegative test.  Wrong character is used is used.\r\n</animal>"
                },
                "ibm62n04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62n04.dtd\">\r\n<animal>\r\n <tiger/>\r\nNegative test.  Missing the required field INCLUDE.\r\n</animal>"
                },
                "ibm62n05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62n05.dtd\">\r\n<animal>\r\n <tiger/>\r\nNegative test.  Missing the required field '[' after INCLUDE.\r\n</animal>"
                },
                "ibm62n06.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62n06.dtd\">\r\n<animal>\r\n <tiger/>\r\nNegative test.  Wrong Ordering. External subset declaration prior to the keyword INCLUDE\r\n</animal>"
                },
                "ibm62n07.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62n07.dtd\">\r\n<animal>\r\n <tiger/>\r\nNegative test. Missing closing sequence.\r\n</animal>"
                },
                "ibm62n08.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62n08.dtd\">\r\n<animal>\r\n <tiger/>\r\nNegative test. Missing external subset declaration.\r\n</animal>"
                }
            },
            "P63": {
                "ibm63n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63n01.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"TIGER1\">\r\nNegative test. Case sensitive(ignore is used instead of IGNORE).\r\n</animal>"
                },
                "ibm63n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63n02.dtd\"\r\n[\r\n<!ATTLIST attr a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"TIGER1\">\r\nNegative test. Extra '[' is used before IGNORE.\r\n</animal>"
                },
                "ibm63n03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63n03.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"TIGER1\">\r\nNegative test.  Wrong character.\r\n</animal>"
                },
                "ibm63n04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63n04.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"TIGER1\">\r\nNegative test.  Missing required field(The keyword IGNORE is missing).\r\n</animal>"
                },
                "ibm63n05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63n05.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"TIGER1\">\r\nNegative test.  Missing required field( '[' is missing after IGNORE ).\r\n</animal>"
                },
                "ibm63n06.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63n06.dtd\"\r\n[\r\n<!ATTLIST attr a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"TIGER1\">\r\nNegative test.  Wrong Ordering. Ignore sect contents preceding IGNORE.\r\n</animal>"
                },
                "ibm63n07.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63n07.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"TIGER1\">\r\nNegative test.  Missing closing sequence.\r\n</animal>"
                }
            },
            "P64": {
                "ibm64n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 64-->\r\n<!DOCTYPE animal SYSTEM \"ibm64n01.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nNegative Test. Pattern2. Wrong character.\r\n</animal>"
                },
                "ibm64n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 64-->\r\n<!DOCTYPE animal SYSTEM \"ibm64n02.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nNegative Test. Pattern3. Missing closing sequence.\r\n</animal>"
                },
                "ibm64n03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 64-->\r\n<!DOCTYPE animal SYSTEM \"ibm64n03.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nNegative Test. Pattern4. Missing opening sequence.\r\n</animal>"
                }
            },
            "P65": {
                "ibm65n01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 65-->\r\n<!DOCTYPE animal SYSTEM \"ibm65n01.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nNegative Test. Pattern1.Illegal sequence of ']]'\r\n</animal>"
                },
                "ibm65n02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 65-->\r\n<!DOCTYPE animal SYSTEM \"ibm65n02.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nNegative Test. Pattern2. \r\n</animal>"
                }
            },
            "P66": {
                "ibm66n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"wrong charater reference: &#002f;\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm66n02.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"wrong character reference: &#x003a\"/>\r\n"
                },
                "ibm66n03.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"wrong charater reference: &49;\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm66n04.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"wrong charater reference:&#5~0;\"/>\r\n"
                },
                "ibm66n05.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"wrong charater reference: &#x002g;\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm66n06.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"wrong charater reference:&#x006G;\"/>\r\n"
                },
                "ibm66n07.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"wrong charater reference: &#x0=2f;\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm66n08.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"wrong charater reference:&#56.0;\"/>\r\n"
                },
                "ibm66n09.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"wrong charater reference: &#x00/2f;\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm66n10.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"wrong charater reference: &#51);\"/>\r\n"
                },
                "ibm66n11.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"wrong charater reference: &#x00 2f;\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm66n12.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"wrong replacement charater reference: &#x0000;\" />\r\n"
                },
                "ibm66n13.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"wrong replacement charater: &#x001f;\" />\r\n"
                },
                "ibm66n14.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"wrong replacement charater : &#xfffe;\" />\r\n"
                },
                "ibm66n15.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root EMPTY>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"wrong replacement charater: &#xffff;\" />\r\n"
                }
            },
            "P68": {
                "ibm68n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root>missing entity name &;</root>\r\n"
                },
                "ibm68n02.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root att=\"&aaa\">missing semi-colon</root>\r\n"
                },
                "ibm68n03.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root>extra space after ampsand & aaa;</root>\r\n\r\n\r\n"
                },
                "ibm68n04.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root att=\"&aAa;\">reference doesn't match delaration</root>\r\n"
                },
                "ibm68n05.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root>undefined entitiy &aaa; </root>\r\n"
                },
                "ibm68n06.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"yes\"?>\r\n<!DOCTYPE root SYSTEM \"ibm68n06.dtd\"\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n]>\r\n<root att=\"&aaa;\">entity declared externally but standalone is yes</root>\r\n"
                },
                "ibm68n07.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Entity referenced before declared *-->\r\n<!ATTLIST root att1 CDATA \"&aaa;\">\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm68n08.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"aString\">\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root>unparsed entity reference in the wrong place &aImage;</root>\r\n"
                },
                "ibm68n09.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* recursive entity reference *-->\r\n<!ENTITY aaa \"&bbb;\">\r\n<!ENTITY bbb \"&aaa;\">\r\n]>\r\n<root>&aaa;</root>\r\n\r\n"
                },
                "ibm68n10.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* indirect recursive entity reference *-->\r\n<!ENTITY aaa \"&bbb;\">\r\n<!ENTITY bbb \"&ccc;\">\r\n<!ENTITY ccc \"&ddd;\">\r\n<!ENTITY ddd \"&eee;\">\r\n<!ENTITY eee \"&aaa;\">\r\n]>\r\n<root>&aaa;</root>\r\n\r\n\r\n"
                }
            },
            "P69": {
                "ibm69n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ENTITY % paaa \"<!ATTLIST root att CDATA #IMPLIED>\">\r\n<!--* incorrect PE reference *-->\r\n%;\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm69n02.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ENTITY % paaa \"<!ATTLIST root att CDATA #IMPLIED>\">\r\n<!--* incorrect PE reference without semicolon *-->\r\n%paaa\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm69n03.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ENTITY % paaa \"<!ATTLIST root att CDATA #IMPLIED>\">\r\n<!--* incorrect PE reference with a extra white space charater *-->\r\n%paaa ;\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root/>\r\n\r\n\r\n\r\n"
                },
                "ibm69n04.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ENTITY % paaa \"<!ATTLIST root att CDATA #IMPLIED>\">\r\n<!--* incorrect PE reference with a extra white space char *-->\r\n% paaa;\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm69n05.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"yes\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* PE referenced before declared, against WFC: entity declared -->\r\n%paaa;\r\n<!ENTITY % paaa \"<!ATTLIST root att CDATA #IMPLIED>\">\r\n<!ENTITY aaa \"aString\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm69n06.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* recursive PE reference -->\r\n<!ENTITY % paaa \"&bbb;\">\r\n<!ENTITY bbb \"%paaa;\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm69n07.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!--* indirect recursive PE reference -->\r\n<!ENTITY % paaa \"&bbb;\">\r\n<!ENTITY bbb \"&ccc;\">\r\n<!ENTITY ccc \"&ddd;\">\r\n<!ENTITY ddd \"&eee;\">\r\n<!ENTITY eee \"%paaa;\">\r\n]>\r\n<root/>\r\n\r\n"
                }
            },
            "P71": {
                "ibm70n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ENTITY aaa \"aString\">\r\n<!--* mess up Entity Declaration *-->\r\n<root/>\r\n<!ENTITY % paaa \"aString\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm71n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing space  *-->\r\n<!ENTITYaaa \"aString\">\r\n\r\n]>\r\n<root>&aaa;</root>\r\n\r\n"
                },
                "ibm71n02.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing space  *-->\r\n<!ENTITY aaa\"aString\">\r\n\r\n]>\r\n<root>&aaa;</root>\r\n"
                },
                "ibm71n03.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing EntityDef  *-->\r\n<!ENTITY aaa>\r\n\r\n]>\r\n<root>&aaa;</root>\r\n"
                },
                "ibm71n04.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing name  *-->\r\n<!ENTITY \"aString\">\r\n\r\n]>\r\n<root>&aaa;</root>\r\n"
                },
                "ibm71n05.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* wrong ordering  *-->\r\n<!ENTITY \"aString\" aaa>\r\n]>\r\n<root>&aaa;</root>\r\n"
                },
                "ibm71n06.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* ENTITY in lower case  *-->\r\n<!entity aaa \"aString\">\r\n]>\r\n<root>&aaa;</root>\r\n"
                },
                "ibm71n07.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing closing bracket  *-->\r\n<!ENTITY aaa \"aString\"\r\n\r\n]>\r\n<root>&aaa;</root>\r\n"
                },
                "ibm71n08.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* exclamation mark missing  *-->\r\n<ENTITY aaa \"aString\">\r\n\r\n]>\r\n<root>&aaa;</root>\r\n"
                }
            },
            "P72": {
                "ibm72n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing space  *-->\r\n<!ENTITY% paaa \"<!-- comments -->\">\r\n%paaa;\r\n]>\r\n<root/>\r\n\r\n\r\n\r\n\r\n\r\n"
                },
                "ibm72n02.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing name  *-->\r\n<!ENTITY % \"<!-- comments -->\">\r\n%paaa;\r\n]>\r\n<root/>\r\n"
                },
                "ibm72n03.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing space  *-->\r\n<!ENTITY % paaa\"<!-- comments -->\">\r\n%paaa;\r\n]>\r\n<root/>\r\n"
                },
                "ibm72n04.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing PEDef  *-->\r\n<!ENTITY % paaa>\r\n%paaa;\r\n]>\r\n<root/>\r\n"
                },
                "ibm72n05.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* wrong order  *-->\r\n<!ENTITY % \"<!-- comments -->\" paaa>\r\n%paaa;\r\n]>\r\n<root/>\r\n"
                },
                "ibm72n06.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* wrong order  *-->\r\n<!ENTITY \"<!-- comments -->\" % paaa >\r\n%paaa;\r\n]>\r\n<root/>\r\n"
                },
                "ibm72n07.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* wrong keyword  *-->\r\n<!entity % paaa \"<!-- comments -->\">\r\n%paaa;\r\n]>\r\n<root/>\r\n"
                },
                "ibm72n08.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing closing bracket  *-->\r\n<!ENTITY % paaa \"<!-- comments -->\"\r\n%paaa;\r\n]>\r\n<root/>\r\n"
                },
                "ibm72n09.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* wrong closing sequence: extra exclamation mark *-->\r\n<!ENTITY% paaa \"<!-- comments -->\" !>\r\n%paaa;\r\n]>\r\n<root/>\r\n"
                }
            },
            "P73": {
                "ibm73n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* wrong order: NDataDecl ExternalID  *-->\r\n<!ENTITY aImage NDATA JPGformat SYSTEM \"image.jpg\" >\r\n]>\r\n<root/>\r\n"
                },
                "ibm73n03.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* missing ExternalID  *-->\r\n<!ENTITY aImage NDATA JPGformat >\r\n]>\r\n<root/>\r\n"
                }
            },
            "P74": {
                "ibm74n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* wrong PEDef: NDataDecl ExternalID  *-->\r\n<!ENTITY % pImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                }
            },
            "P75": {
                "ibm75n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* wrong keyword: system  *-->\r\n<!ENTITY pImage system \"image.jpg\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!--* wrong keyword: public  *-->\r\n<!DOCTYPE root \r\n    public \"-//W3C//DTD//EN\" \"empty.dtd\"\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!--* wrong keyword: Public  *-->\r\n<!DOCTYPE root \r\n    Public \"-//W3C//DTD//EN\" \"empty.dtd\"\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!--* wrong order *-->\r\n<!DOCTYPE root \r\n    \"-//W3C//DTD//EN\" \"empty.dtd\" PUBLIC\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n05.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing space *-->\r\n<!ENTITY pImage SYSTEM\"image.jpg\">\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n06.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* missing SystemLiterral *-->\r\n<!ENTITY pImage SYSTEM >\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!--* missing space  *-->\r\n<!DOCTYPE root \r\n    PUBLIC \"-//W3C//DTD//EN\"\"empty.dtd\"\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n08.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!--* missing keyword: PUBLIC  *-->\r\n<!DOCTYPE root \r\n    \"-//W3C//DTD//EN\" \"empty.dtd\"\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n09.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!--* missing space  *-->\r\n<!DOCTYPE root \r\n    PUBLIC\"-//W3C//DTD//EN\" \"empty.dtd\"\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n10.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!--* missing PubidLiteral  *-->\r\n<!DOCTYPE root \r\n    PUBLIC \".\\empty.dtd\"\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n11.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!--* missing System Literal *-->\r\n<!DOCTYPE root \r\n    public \"-//W3C//DTD//EN\"\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n12.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* wrong order *-->\r\n<!ENTITY pImage \"image.jpg\" SYSTEM>\r\n]>\r\n<root/>\r\n"
                },
                "ibm75n13.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!--* wrong order *-->\r\n<!DOCTYPE root \r\n    \"-//W3C//DTD//EN\" PUBLIC \"empty.dtd\"\r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                }
            },
            "P76": {
                "ibm76n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* wrong keyword in NdataDecl: ndata *-->\r\n<!ENTITY aImage SYSTEM \"image.jpg\" ndata JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm76n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* wrong keyword in NdataDecl: NData *-->\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NData JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm76n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* missing space in NdataDecl *-->\r\n<!ENTITY aImage SYSTEM \"image.jpg\"NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm76n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* missing keyword in NdataDecl : NDATA *-->\r\n<!ENTITY aImage SYSTEM \"image.jpg\" JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm76n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* Missing Name field in NdataDecl *-->\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA>\r\n]>\r\n<root/>\r\n"
                },
                "ibm76n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* missing space in NdataDecl *-->\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATAJPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm76n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!--* wrong order in NdataDecl *-->\r\n<!ENTITY aImage SYSTEM \"image.jpg\" JPGformat NDATA>\r\n]>\r\n<root/>\r\n"
                }
            },
            "P77": {
                "ibm77n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* error in external entity  *-->\r\n<!ENTITY aExternal SYSTEM \"ibm77n01.ent\">\r\n]>\r\n<root>&aExternal;</root>\r\n"
                },
                "ibm77n02.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* error in external entity  *-->\r\n<!ENTITY aExternal SYSTEM \"ibm77n02.ent\">\r\n]>\r\n<root>&aExternal;</root>\r\n"
                },
                "ibm77n03.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* error in external entity  *-->\r\n<!ENTITY % pExternal SYSTEM \"ibm77n03.ent\">\r\n%pExternal;\r\n]>\r\n<root/>\r\n"
                },
                "ibm77n04.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* error in external entity  *-->\r\n<!ENTITY % pExternal SYSTEM \"ibm77n04.ent\">\r\n%pExternal;\r\n]>\r\n<root/>\r\n"
                }
            },
            "P78": {
                "ibm78n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* error in external entity  *-->\r\n<!ENTITY aExternal SYSTEM \"ibm78n01.ent\">\r\n]>\r\n<root>&aExternal;</root>\r\n\r\n\r\n\r\n"
                },
                "ibm78n02.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* error in external entity  *-->\r\n<!ENTITY aExternal SYSTEM \"ibm78n02.ent\">\r\n]>\r\n<root>&aExternal;</root>\r\n"
                }
            },
            "P79": {
                "ibm79n01.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* error in external entity  *-->\r\n<!ENTITY % pExternal SYSTEM \"ibm79n01.ent\">\r\n%pExternal;\r\n]>\r\n<root/>\r\n"
                },
                "ibm79n02.xml": {
                    "input": "<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* error in external entity  *-->\r\n<!ENTITY % pExternal SYSTEM \"ibm79n02.ent\">\r\n%pExternal;\r\n]>\r\n<root/>\r\n"
                }
            },
            "P80": {
                "ibm80n01.xml": {
                    "input": "<?xml version=\"1.0\"encoding=\"UTF-8\"?>\r\n<!--* missing white space in above EncodingDecl *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm80n02.xml": {
                    "input": "<?xml version=\"1.0\" encoding \"UTF-8\"?>\r\n<!--* missing Eq in above EncodingDecl *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm80n03.xml": {
                    "input": "<?xml version=\"1.0\" encoding= ?>\r\n<!--* missing EncName in above EncodingDecl *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm80n04.xml": {
                    "input": "<?xml version=\"1.0\" \"UTF-8\"encoding=?>\r\n<!--* wrong ordering in above EncodingDecl *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm80n05.xml": {
                    "input": "<?xml version=\"1.0\" \"UTF-8\"=encoding?>\r\n<!--* wrong ordering in above EncodingDecl *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm80n06.xml": {
                    "input": "<?xml version=\"1.0\" Encoding=\"UTF-8\"?>\r\n<!--* Wrong keyword Encoding in above EncodingDecl *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                }
            },
            "P81": {
                "ibm81n01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"_UTF-8\"?>\r\n<!--* Illegal inital Charater in above EncName *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n\r\n"
                },
                "ibm81n02.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"-UTF-8\"?>\r\n<!--* Illegal inital Charater in above EncName *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm81n03.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\".UTF-8\"?>\r\n<!--* Illegal inital Charater in above EncName *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm81n04.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"8-UTF\"?>\r\n<!--* Illegal initial Charater in above EncName *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm81n05.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF~8\"?>\r\n<!--* Illegal Charater in above EncName *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm81n06.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF#8\"?>\r\n<!--* Illegal Charater in above EncName *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm81n07.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF:8\"?>\r\n<!--* IllegalCharater in above EncName *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm81n08.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF/8\"?>\r\n<!--* Illegal Charater in above EncName *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                },
                "ibm81n09.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF;8\"?>\r\n<!--* Illegal Charater in above EncName *-->\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n]>\r\n<root/>\r\n"
                }
            },
            "P82": {
                "ibm82n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Missing whitespace in NotationDecl *-->\r\n<!NOTATIONJPGformat SYSTEM \"JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm82n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Missing Name in NotationDecl *-->\r\n<!NOTATION PUBLIC \"-//JPG//DTD//JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm82n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Missing ExternalID or PublicID in NotationDecl *-->\r\n<!NOTATION JPGformat >\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm82n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Wrong ordering in NotationDecl *-->\r\n<!NOTATION SYSTEM \"JPGFormat\" JPGformat >\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm82n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Wrong keyword: notation in NotationDecl *-->\r\n<!notation JPGformat SYSTEM \"JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm82n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Missing closing bracket in NotationDecl *-->\r\n<!NOTATION JPGformat PUBLIC \"-//JPG//DTD//JPGFormat\"\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm82n07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Wrong beginning sequence in NotationDecl *-->\r\n<NOTATION JPGformat PUBLIC \"-//JPG//DTD//JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n"
                },
                "ibm82n08.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Wrong Closing sequence in NotationDecl *-->\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\"!>\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                }
            },
            "P83": {
                "ibm83n01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Wrong keyword in PublicID *-->\r\n<!NOTATION JPGformat public \"-//JPG//DTD//JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n\r\n"
                },
                "ibm83n02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Wrong keyword : Public in PublicID *-->\r\n<!NOTATION JPGformat Public \"-//JPG//DTD//JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm83n03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Missing keyword in PublicID *-->\r\n<!NOTATION JPGformat \"-//JPG//DTD//JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm83n04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Missing White space in PublicID *-->\r\n<!NOTATION JPGformat PUBLIC\"-//JPG//DTD//JPGFormat\">\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm83n05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Missing PubidLiteral in PublicID *-->\r\n<!NOTATION JPGformat PUBLIC >\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                },
                "ibm83n06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!--* Wrong ordering in PublicID *-->\r\n<!NOTATION JPGformat \"-//JPG//DTD//JPGFormat\" PUBLIC>\r\n<!ENTITY aImage SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root/>\r\n"
                }
            },
            "P85": {
                "ibm85n01.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?× an illegal char #x0d7\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n02.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?÷ an illegal char #x0f7\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n03.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ĳ an illegal char #x132\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n04.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ĳ an illegal char #x133\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n05.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ŀ an illegal char #x13f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n06.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ŀ an illegal char #x140\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n07.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ŉ an illegal char #x149\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n08.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ſ an illegal char #x17f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n09.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ǆ an illegal char #x1c4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n10.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ǌ an illegal char #x1cc\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n100.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ஶ an illegal char #x0bb6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n101.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?஺ an illegal char #x0bba\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n102.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?఍ an illegal char #x0c0d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n103.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?఑ an illegal char #x0c11\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n104.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?఩ an illegal char #x0c29\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n105.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ఴ an illegal char #x0c34\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n106.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?౟ an illegal char #x0c5f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n107.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ౢ an illegal char #x0c62\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n108.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?಍ an illegal char #x0c8d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n109.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?಑ an illegal char #x0c91\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n11.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ǳ an illegal char #x1f1\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n110.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?಩ an illegal char #x0ca9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n111.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?಴ an illegal char #x0cb4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n112.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?಺ an illegal char #x0cba\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n113.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?೟ an illegal char #x0cdf\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n114.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ೢ an illegal char #x0ce2\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n115.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?഍ an illegal char #x0d0d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n116.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?഑ an illegal char #x0d11\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n117.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ഩ an illegal char #x0d29\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n118.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ഺ an illegal char #x0d3a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n119.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ൢ an illegal char #x0d62\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n12.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ǳ an illegal char #x1f3\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n120.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ฯ an illegal char #x0e2f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n121.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ั an illegal char #x0e31\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n122.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ิ an illegal char #x0e34\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n123.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ๆ an illegal char #x0e46\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n124.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?຃ an illegal char #x0e83\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n125.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?຅ an illegal char #x0e85\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n126.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ຉ an illegal char #x0e89\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n127.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?຋ an illegal char #x0e8b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n128.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ຎ an illegal char #x0e8e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n129.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ຘ an illegal char #x0e98\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n13.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ƕ an illegal char #x1f6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n130.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ຠ an illegal char #x0ea0\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n131.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?຤ an illegal char #x0ea4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n132.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?຦ an illegal char #x0ea6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n133.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ຨ an illegal char #x0ea8\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n134.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ຬ an illegal char #x0eac\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n135.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ຯ an illegal char #x0eaf\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n136.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ັ an illegal char #x0eb1\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n137.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ິ an illegal char #x0eb4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n138.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?຾ an illegal char #x0ebe\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n139.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?໅ an illegal char #x0ec5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n14.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ǹ an illegal char #x1f9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n140.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?཈ an illegal char #x0f48\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n141.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ཪ an illegal char #x0f6a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n142.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?჆ an illegal char #x10c6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n143.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ჷ an illegal char #x10f7\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n144.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᄁ an illegal char #x1101\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n145.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᄄ an illegal char #x1104\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n146.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᄈ an illegal char #x1108\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n147.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᄊ an illegal char #x110a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n148.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᄍ an illegal char #x110d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n149.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᄻ an illegal char #x113b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n15.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ǹ an illegal char #x1f9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n150.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᄿ an illegal char #x113f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n151.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅁ an illegal char #x1141\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n152.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅍ an illegal char #x114d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n153.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅏ an illegal char #x114f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n154.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅑ an illegal char #x1151\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n155.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅖ an illegal char #x1156\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n156.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅚ an illegal char #x115a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n157.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅢ an illegal char #x1162\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n158.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅤ an illegal char #x1164\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n159.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅦ an illegal char #x1166\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n16.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ȱ an illegal char #x230\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n160.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅫ an illegal char #x116b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n161.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅯ an illegal char #x116f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n162.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᅴ an illegal char #x1174\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n163.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᆟ an illegal char #x119f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n164.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᆬ an illegal char #x11ac\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n165.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᆶ an illegal char #x11b6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n166.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᆹ an illegal char #x11b9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n167.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᆻ an illegal char #x11bb\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n168.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᇃ an illegal char #x11c3\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n169.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᇱ an illegal char #x11f1\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n17.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ʯ an illegal char #x2af\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n170.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ᇺ an illegal char #x11fa\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n171.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ẜ an illegal char #x1e9c\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n172.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ỻ an illegal char #x1efa\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n173.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?἖ an illegal char #x1f16\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n174.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?἞ an illegal char #x1f1e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n175.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?὆ an illegal char #x1f46\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n176.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?὏ an illegal char #x1f4f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n177.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?὘ an illegal char #x1f58\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n178.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?὚ an illegal char #x1f5a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n179.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?὜ an illegal char #x1f5c\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n18.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ˏ an illegal char #x2cf\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n180.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?὞ an illegal char #x1f5e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n181.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?὾ an illegal char #x1f7e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n182.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?᾵ an illegal char #x1fb5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n183.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?᾽ an illegal char #x1fbd\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n184.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?᾿ an illegal char #x1fbf\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n185.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?῅ an illegal char #x1fc5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n186.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?῍ an illegal char #x1fcd\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n187.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?῕ an illegal char #x1fd5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n188.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?῜ an illegal char #x1fdc\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n189.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?῭ an illegal char #x1fed\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n19.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?· an illegal char #x387\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n190.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?῵ an illegal char #x1ff5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n191.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?´ an illegal char #x1ffd\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n192.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?℧ an illegal char #x2127\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n193.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ℯ an illegal char #x212f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n194.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ↄ an illegal char #x2183\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n195.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ゕ an illegal char #x3095\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n196.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?・ an illegal char #x30fb\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n197.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ㄭ an illegal char #x312d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n198.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?힤 an illegal char #xd7a4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n20.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?΋ an illegal char #x38b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n21.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?΢ an illegal char #x3a2\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n22.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ϗ an illegal char #x3cf\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n23.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ϗ an illegal char #x3d7\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n24.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ϝ an illegal char #x3dd\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n25.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ϡ an illegal char #x3e1\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n26.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ϴ an illegal char #x3f4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n27.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ѝ an illegal char #x40d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n28.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ѐ an illegal char #x450\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n29.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ѝ an illegal char #x45d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n30.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?҂ an illegal char #x482\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n31.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ӆ an illegal char #x4c5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n32.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ӆ an illegal char #x4c6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n33.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ӊ an illegal char #x4c9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n34.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ӭ an illegal char #x4ec\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n35.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ӭ an illegal char #x4ed\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n36.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ӷ an illegal char #x4f6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n37.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?Ӻ an illegal char #x4fa\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n38.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?՗ an illegal char #x557\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n39.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?՘ an illegal char #x558\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n40.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?և an illegal char #x587\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n41.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?׫ an illegal char #x5eb\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n42.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?׳ an illegal char #x5f3\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n43.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ؠ an illegal char #x620\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n44.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ػ an illegal char #x63b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n45.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ً an illegal char #x64b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n46.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ڸ an illegal char #x6b8\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n47.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ڿ an illegal char #x6bf\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n48.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ۏ an illegal char #x6cf\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n49.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?۔ an illegal char #x6d4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n50.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ۖ an illegal char #x6d6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n51.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ۧ an illegal char #x6e7\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n52.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ऺ an illegal char #x093a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n53.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ा an illegal char #x093e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n54.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ॢ an illegal char #x0962\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n55.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?঍ an illegal char #x098d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n56.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?঑ an illegal char #x0991\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n57.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?঒ an illegal char #x0992\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n58.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?঩ an illegal char #x09a9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n59.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?঱ an illegal char #x09b1\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n60.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?঵ an illegal char #x09b5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n61.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?঺ an illegal char #x09ba\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n62.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?৞ an illegal char #x09de\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n63.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ৢ an illegal char #x09e2\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n64.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?৲ an illegal char #x09f2\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n65.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?਋ an illegal char #x0a0b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n66.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?਑ an illegal char #x0a11\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n67.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?਩ an illegal char #x0a29\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n68.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?਱ an illegal char #x0a31\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n69.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?਴ an illegal char #x0a34\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n70.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?਷ an illegal char #x0a37\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n71.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?਺ an illegal char #x0a3a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n72.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?੝ an illegal char #x0a5d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n73.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ੰ an illegal char #x0a70\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n74.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ੵ an illegal char #x0a75\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n75.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?઄ an illegal char #x0a84\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n76.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?઼ an illegal char #x0abc\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n77.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?઒ an illegal char #x0a92\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n78.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?઩ an illegal char #x0aa9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n79.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?઱ an illegal char #x0ab1\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n80.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?઴ an illegal char #x0ab4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n81.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?઺ an illegal char #x0aba\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n82.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?଄ an illegal char #x0b04\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n83.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?଍ an illegal char #x0b0d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n84.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?଑ an illegal char #x0b11\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n85.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?଩ an illegal char #x0b29\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n86.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?଱ an illegal char #x0b31\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n87.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?଴ an illegal char #x0b34\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n88.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?଺ an illegal char #x0b3a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n89.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ା an illegal char #x0b3e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n90.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?୞ an illegal char #x0b5e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n91.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?ୢ an illegal char #x0b62\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n92.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?஋ an illegal char #x0b8b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n93.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?஑ an illegal char #x0b91\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n94.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?஘ an illegal char #x0b98\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n95.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?஛ an illegal char #x0b9b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n96.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?஝ an illegal char #x0b9d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n97.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?஠ an illegal char #x0ba0\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n98.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?஧ an illegal char #x0ba7\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm85n99.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?஫ an illegal char #x0bab\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                }
            },
            "P86": {
                "ibm86n01.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?䳿 an illegal char #x4cff\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm86n02.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?龦 an illegal char #x9fa6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm86n03.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?〈 an illegal char #x3008\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm86n04.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?〪 an illegal char #x302a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                }
            },
            "P87": {
                "ibm87n01.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_˿ an illegal char #x2ff\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n02.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_͆ an illegal char #x346\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n03.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_͢ an illegal char #x362\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n04.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_҇ an illegal char #x487\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n05.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_֢ an illegal char #x5a2\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n06.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ֺ an illegal char #x5ba\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n07.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_־ an illegal char #x5be\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n08.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_׀ an illegal char #x5c0\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n09.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_׃ an illegal char #x5c3\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n10.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ٓ an illegal char #x653\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n11.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ڸ an illegal char #x6b8\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n12.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ڹ an illegal char #x6b9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n13.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_۩ an illegal char #x6e9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n14.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ۮ an illegal char #x6ee\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n15.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ऄ an illegal char #x0904\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n16.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ऻ an illegal char #x093b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n17.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ॎ an illegal char #x094e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n18.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ॕ an illegal char #x0955\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n19.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_। an illegal char #x0964\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n20.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_঄ an illegal char #x0984\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n21.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_৅ an illegal char #x09c5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n22.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_৉ an illegal char #x09c9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n23.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ৎ an illegal char #x09ce\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n24.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_৘ an illegal char #x09d8\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n25.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_৤ an illegal char #x09e4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n26.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ਃ an illegal char #x0a03\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n27.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_਽ an illegal char #x0a3d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n28.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_੆ an illegal char #x0a46\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n29.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_੉ an illegal char #x0a49\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n30.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_੎ an illegal char #x0a4e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n31.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_઀ an illegal char #x0a80\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n32.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_઄ an illegal char #x0a84\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n33.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_઻ an illegal char #x0abb\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n34.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_૆ an illegal char #x0ac6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n35.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_૊ an illegal char #x0aca\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n36.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_૎ an illegal char #x0ace\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n37.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_଄ an illegal char #x0b04\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n38.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_଻ an illegal char #x0b3b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n39.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ୄ an illegal char #x0b44\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n40.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_୊ an illegal char #x0b4a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n41.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_୎ an illegal char #x0b4e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n42.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_୘ an illegal char #x0b58\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n43.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_஄ an illegal char #x0b84\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n44.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_௃ an illegal char #x0bc3\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n45.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_௉ an illegal char #x0bc9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n46.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_௖ an illegal char #x0bd6\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n47.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_఍ an illegal char #x0c0d\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n48.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_౅ an illegal char #x0c45\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n49.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_౉ an illegal char #x0c49\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n50.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_౔ an illegal char #x0c54\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n51.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ಁ an illegal char #x0c81\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n52.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_಄ an illegal char #x0c84\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n53.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_೅ an illegal char #x0cc5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n54.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_೉ an illegal char #x0cc9\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n55.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_೔ an illegal char #x0cd4\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n56.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_೗ an illegal char #x0cd7\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n57.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ഄ an illegal char #x0d04\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n58.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_൅ an illegal char #x0d45\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n59.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_൉ an illegal char #x0d49\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n60.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ൎ an illegal char #x0d4e\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n61.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_൘ an illegal char #x0d58\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n62.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_฿ an illegal char #x0e3f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n63.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_฻ an illegal char #x0e3b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n64.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_๏ an illegal char #x0e4f\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n66.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_຺ an illegal char #x0eba\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n67.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_຾ an illegal char #x0ebe\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n68.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_໎ an illegal char #x0ece\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n69.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_༚ an illegal char #x0f1a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n70.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_༶ an illegal char #x0f36\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n71.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_༸ an illegal char #x0f38\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n72.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_༻ an illegal char #x0f3b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n73.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_༺ an illegal char #x0f3a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n74.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_཰ an illegal char #x0f70\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n75.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_྅ an illegal char #x0f85\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n76.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ྌ an illegal char #x0f8c\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n77.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ྖ an illegal char #x0f96\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n78.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_྘ an illegal char #x0f98\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n79.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ྰ an illegal char #x0fb0\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n80.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ྸ an illegal char #x0fb8\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n81.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ྺ an illegal char #x0fba\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n82.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_⃝ an illegal char #x20dd\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n83.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_⃢ an illegal char #x20e2\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n84.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_〰 an illegal char #x3030\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm87n85.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_゛ an illegal char #x309b\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                }
            },
            "P88": {
                "ibm88n01.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_) an illegal char #x29 in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n02.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_; an illegal char #x3b in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n03.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_٪ an illegal char #x66a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n04.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ۺ an illegal char #x6fa\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n05.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_॰ an illegal char #x0970\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n06.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_৲ an illegal char #x09f2\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n08.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_૰ an illegal char #x0af0\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n09.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_୰ an illegal char #x0b70\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n10.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_౥ an illegal char #x0c65\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n11.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_೥ an illegal char #x0ce5\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n12.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_೰ an illegal char #x0cf0\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n13.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_൰ an illegal char #x0d70\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n14.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_๚ an illegal char #x0e5a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n15.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_໚ an illegal char #x0eda\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm88n16.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_༪ an illegal char #x0f2a\r\n in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                }
            },
            "P89": {
                "ibm89n01.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_¶ an illegal extender #x0b6 in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm89n02.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_¸ an illegal extender #x0b8 in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm89n03.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_˒ an illegal extender #x2d2 in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm89n04.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_Ͼ an illegal extender #x3fe in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm89n05.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ٟ an illegal extender #x65f in PITarget ?>\r\n]>\r\n<animal/>\r\n"
                },
                "ibm89n06.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_໇ an illegal extender #x0ec7 in PITarget ?>\r\n]>\r\n<animal/>\r\n<IllegalExtender໇/>\r\n"
                },
                "ibm89n07.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_〆 an illegal extender #x3006 in PITarget ?>\r\n]>\r\n<animal/>\r\n<IllegalExtender〆/>\r\n"
                },
                "ibm89n08.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_〰 an illegal extender #x3030 in PITarget ?>\r\n]>\r\n<animal/>\r\n<IllegalExtender〰/>\r\n"
                },
                "ibm89n09.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_〶 an illegal extender #x3036 in PITarget ?>\r\n]>\r\n<animal/>\r\n<IllegalExtender〶/>\r\n"
                },
                "ibm89n10.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_゜ an illegal extender #x309c in PITarget ?>\r\n]>\r\n<animal/>\r\n<IllegalExtender゜/>\r\n"
                },
                "ibm89n11.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ゟ an illegal extender #x309f in PITarget ?>\r\n]>\r\n<animal/>\r\n<IllegalExtenderゟ/>\r\n"
                },
                "ibm89n12.xml": {
                    "input": "<!DOCTYPE animal [\r\n<!ELEMENT animal ANY>\r\n<?_ヿ an illegal extender #x30ff in PITarget ?>\r\n]>\r\n<animal/>\r\n<IllegalExtenderヿ/>\r\n"
                }
            },
            "misc": {
                "432gewf.xml": {
                    "input": "<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ENTITY gewithElemnetDecl \"<!ELEMENT bogus ANY>\"> \r\n        <!ATTLIST student att1 CDATA #REQUIRED>\r\n]>\r\n<!--* This test is to test the GE well-formedness \r\n      constraints in Section 4.3.2:\r\n      An internal general parsed encith is well-formed if \r\n      its replacement text matches the production labeled\r\n      \"content\" *--> \r\n<?MyInstruct This is a test ?>\r\n<student att1=\"ibm\">My Name is SnowMan. </student>"
                },
                "ltinentval.xml": {
                    "input": "<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ENTITY gewithlt \"abcd&#x26;&#x23;x3c;\"> \r\n        <!ATTLIST student att1 CDATA #REQUIRED>\r\n]>\r\n<--* this is to test \"<\" can not be included in an entity \r\n     that is referenced in AttValue, even indirectly *-->\r\n     \r\n\r\n<?MyInstruct This is a test ?>\r\n<student att1=\"&gewithlt;\">My Name is SnowMan. </student>\r\n"
                },
                "simpleltinentval.xml": {
                    "input": "<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ENTITY gewithlt \"abcd&#x3c;\"> \r\n        <!ATTLIST student att1 CDATA #REQUIRED>\r\n]>\r\n<--* this is to test \"<\" can not be included in the \r\n     replacement text of an entity that is referenced \r\n     in AttValue. Anyway, this file should be rejected\r\n     because the internal GE \"gewithlt\" is not even \r\n     well-formed by definition. *-->\r\n     \r\n\r\n<?MyInstruct This is a test ?>\r\n<student att1=\"&gewithlt;\">My Name is SnowMan. </student>\r\n"
                }
            },
            "p28a": {
                "ibm28an01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm28an01.dtd\" [\r\n   <!ELEMENT animal (cat|tiger|leopard)+>\r\n   <!NOTATION animal_class SYSTEM \"ibm29v01.txt\">\r\n   <!ELEMENT cat ANY>\r\n   <!ENTITY forcat \"This is a small cat\">\r\n   <!ELEMENT tiger (#PCDATA)>\r\n   <!ELEMENT small EMPTY>\r\n   <!ELEMENT big EMPTY>\r\n   <!ATTLIST tiger color CDATA #REQUIRED>\r\n   <?sound \"This is a PI\" ?>\r\n   <!-- This is a comment -->\r\n]>\r\n<animal>\r\n   <cat>&forcat;</cat>\r\n   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>\r\n   <cat/>\r\n   <leopard>\r\n      <small/>\r\n      <big/>\r\n   </leopard>\r\n</animal>\r\n"
                }
            }
        },
        "resources": {
            "P01": {},
            "P02": {},
            "P03": {},
            "P04": {},
            "P05": {},
            "P09": {},
            "P10": {},
            "P11": {},
            "P12": {},
            "P13": {
                "student.dtd": "<?xml encoding=\"utf-8\"?>\r\n<!-- student.dtd -->\r\n<!ELEMENT student (#PCDATA)> \r\n"
            },
            "P14": {},
            "P15": {},
            "P16": {},
            "P17": {},
            "P18": {},
            "P19": {},
            "P20": {},
            "P21": {},
            "P22": {},
            "P23": {},
            "P24": {},
            "P25": {},
            "P26": {},
            "P27": {},
            "P28": {
                "ibm28n01.dtd": "<!ELEMENT animal EMPTY>"
            },
            "P29": {},
            "P30": {
                "ibm30n01.dtd": "<!ELEMENT animal EMPTY>\r\n<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\r\n<!-- Wrong order extSubsetDecl TextDecl in the external DTD -->"
            },
            "P31": {
                "ibm31n01.dtd": "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\r\n<!ELEMENT animal EMPTY>\r\n<!ENTITY generalE \"A general entity\">\r\n&generalE;\r\n<!-- Illegal extSubsetDecl in the external DTD -->"
            },
            "P32": {
                "ibm32n06.dtd": "<!ELEMENT animal EMPTY>",
                "ibm32n09.dtd": "<!ENTITY animal_content \"This is a yellow tiger\">\r\n"
            },
            "P39": {},
            "P40": {},
            "P41": {
                "ibm41n.ent": "<?xml verison=\"1.0\"?>\r\nany",
                "ibm41n10.ent": "<?xml verison=\"1.0\"?>\r\nany",
                "ibm41n11.ent": "<?xml verison=\"1.0\"?>\r\nany"
            },
            "P42": {},
            "P43": {},
            "P44": {},
            "P45": {},
            "P46": {},
            "P47": {},
            "P48": {},
            "P49": {},
            "P50": {},
            "P51": {},
            "P52": {},
            "P53": {},
            "P54": {},
            "P55": {},
            "P56": {},
            "P57": {},
            "P58": {},
            "P59": {},
            "P60": {},
            "P61": {
                "ibm61n01.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 61-->\r\n<![NOTINCLUDE[\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n"
            },
            "P62": {
                "ibm62n01.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![ include [\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n<!--Negative test with pattern1 of P62-->\r\n<!--include(Case sensitive)-->",
                "ibm62n02.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![[INCLUDE[\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n<!--Negative test with pattern2 of P62-->\r\n<!--An extra '[' is added-->",
                "ibm62n03.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<?[INCLUDE[\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n<!--Negative test with pattern3 of P62-->\r\n<!--An Wrong character is used to proir to [INCLUDE-->",
                "ibm62n04.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![[\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n<!--Negative test with pattern4 of P62-->\r\n<!--Missing the required field INCLUDE-->",
                "ibm62n05.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![INCLUDE\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n<!--Negative test with pattern5 of P62-->\r\n<!--Missing the required field '[' after INCLUDE-->",
                "ibm62n06.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n[INCLUDE\r\n]]>\r\n<!--Negative test with pattern6 of P62-->\r\n<!--Wrong Ordering. External subset declaration prior to the keyword INCLUDE-->\r\n",
                "ibm62n07.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![ INCLUDE [\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n\r\n<!--Negative test with pattern7 of P62-->\r\n<!--Missing closing sequence.-->",
                "ibm62n08.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger ANY>\r\n<!-- DTD for Production 62-->\r\n<![INCLUDE[\r\n]>\r\n\r\n<!--Negtive test with pattern8 of P62-->\r\n<!--Missing one \"]\" in closing sequence.-->"
            },
            "P63": {
                "ibm63n01.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![ignore[\r\n]]>\r\n<!--Negative test with pattern1 of P63-->\r\n<!--Case sensitive. ignore is used instead of IGNORE -->",
                "ibm63n02.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![[IGNORE[\r\n<!ELEMENT animal EMPTY>\r\n<!ELEMENT tiger EMPTY>\r\n]]>\r\n<!--Negative test with pattern2 of P63-->\r\n<!--Extra '[' is used before IGNORE. -->",
                "ibm63n03.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<?[IGNORE[\r\n]]>\r\n<!--Negative test with pattern3 of P63-->\r\n<!--Wrong Character '?' instead of '!' -->",
                "ibm63n04.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![[\r\n]]>\r\n<!--Negative test with pattern4 of P63-->\r\n<!--Missing required field. THe keyword IGNORE is missing -->",
                "ibm63n05.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![IGNORE\r\n]]>\r\n<!--Negative test with pattern5 of P63-->\r\n<!--Missing required field( '[' is missing after IGNORE ). -->",
                "ibm63n06.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![\r\n<!ELEMENT animal EMPTY>\r\n<!ELEMENT tiger EMPTY>\r\n[IGNORE\r\n]]>\r\n<!--Negative test with pattern6 of P63-->\r\n<!--Wrong Ordering. Ignore sect contents preceding IGNORE. -->",
                "ibm63n07.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![IGNORE[\r\n<!ELEMENT animal EMPTY>\r\n<!ELEMENT tiger EMPTY>\r\n\r\n<!--Negative test with pattern5 of P63-->\r\n<!--Missing closing sequence -->"
            },
            "P64": {
                "ibm64n01.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!--dtd for production 64-->\r\n<![IGNORE[\r\nstart\r\n<?[\r\n<!ELEMENT animal EMPTY>\r\n]]>\r\nend\r\n]]>\r\n<!--Negative test. Pattern2(Wrong character '?' instead of '[')-->",
                "ibm64n02.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!--dtd for production 64-->\r\n<![IGNORE[\r\nstart\r\n<![\r\n<!ELEMENT animal EMPTY>\r\n\r\nend\r\n]]>\r\n<!--Negative test. Missing closing sequence-->",
                "ibm64n03.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!--dtd for production 64-->\r\n<![IGNORE[\r\nstart\r\n\r\n<!ELEMENT animal EMPTY>\r\n]]>\r\nend\r\n]]>\r\n<!--Negative test. Missing opening sequence-->"
            },
            "P65": {
                "ibm65n01.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!--dtd for production 65-->\r\n<![IGNORE[\r\nEverything is ignored within an ignored section, except the\r\nsub-section delimiters .  These must be balanced\r\n]]> this is illegal\r\n<![\r\n<!ELEMENT animal EMPTY>\r\n]]>\r\nhello\r\n]]>\r\n<!--Negative test. Pattern1. Illegal sequence of ']]>'-->",
                "ibm65n02.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!--dtd for production 65-->\r\n<![IGNORE[\r\nEverything is ignored within an ignored section, except the\r\nsub-section delimiters .  These must be balanced\r\n<![\r\nthis is again illegal because it is partial markup\r\n<![\r\n<!ELEMENT animal EMPTY>\r\n]]>\r\nhello\r\n]]>\r\n<!--Negative test. Pattern1. Illegal sequence of '<!['-->"
            },
            "P66": {},
            "P68": {
                "ibm68n06.dtd": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<!ENTITY aaa \"aString\">\r\n"
            },
            "P69": {},
            "P71": {},
            "P72": {},
            "P73": {},
            "P74": {},
            "P75": {
                "empty.dtd": "<?xml encoding=\"UTF-8\"?> "
            },
            "P76": {},
            "P77": {
                "ibm77n01.ent": "<?xml encoding=\"UTF8\" version=\"1.0\" ?>\r\n<!--* Wrong ordering in above TextDecl *-->\r\nANY CONTENT\r\n",
                "ibm77n02.ent": "<?XML encoding=\"UTF8\"?>\r\n<!--* Wrong Keyword in above TextDecl *-->\r\nANY CONTENT\r\n",
                "ibm77n03.ent": "<?xml encoding=\"UTF-8\">\r\n<!--* Wrong closing sequence in above TextDecl *-->\r\n",
                "ibm77n04.ent": "<?xml encoding=\"UTF-8\"\r\n<!--* missing closing sequence in above TextDecl *-->\r\n\r\n"
            },
            "P78": {
                "ibm78n01.ent": "\r\n<!--* Wrong ordering in above TextDecl *-->\r\nANY CONTENT\r\n<?xml  version=\"1.0\" encoding=\"UTF8\"?>",
                "ibm78n02.ent": "\r\n<?xml  version=\"1.0\" encoding=\"UTF8\"?>\r\n<!--* Extra space before TextDecl *-->\r\nANY CONTENT\r\n"
            },
            "P79": {
                "ibm79n01.ent": "\r\n<!--* TextDecl in wrong position *-->\r\n<?xml encoding=\"UTF8\"?>",
                "ibm79n02.ent": "\r\n<?xml version=\"1.0\" encoding=\"UTF8\"?>\r\n<!--* Extra white space before TextDecl *-->\r\n\r\n"
            },
            "P80": {},
            "P81": {},
            "P82": {},
            "P83": {},
            "P85": {},
            "P86": {},
            "P87": {},
            "P88": {},
            "P89": {},
            "misc": {},
            "p28a": {
                "ibm28an01.dtd": "   <!ENTITY % make_leopard_element \"<!ELEMENT leopard \">\r\n   %make_leopard_element;ANY>\r\n   <!-- This is against WFC:PE Between Declatations in \r\n    production [28a]. In this file, Only one of the first character\r\n    and the last character of a markup declaration is contained \r\n    in the same parameter-entity text replacement.-->\r\n"
            }
        }
    }
}
export default testData;

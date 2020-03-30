const testData = {
    "ibm": {
        "tests": {
            "P01": {
                "ibm01v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\" ?>\r\n<!-- Above is XMLDecl -->\r\n<!DOCTYPE animal [\r\n<!ELEMENT animal (cat|tiger|leopard)+>\r\n<!ELEMENT cat EMPTY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ELEMENT leopard ANY>\r\n<!ELEMENT small EMPTY>\r\n<!ELEMENT big EMPTY>\r\n<!ATTLIST tiger color CDATA #REQUIRED>\r\n]>\r\n<!-- Above is DTD -->\r\n<?music \"Here is a PI\" ?> \r\n<animal>\r\n   <cat/>\r\n   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>\r\n   <cat/>\r\n   <leopard>\r\n      <small/>\r\n      <big/>\r\n   </leopard>\r\n</animal>\r\n<!-- Above is element animal -->\r\n\r\n",
                    "output": "<?music \"Here is a PI\" ?><animal>&#10;   <cat></cat>&#10;   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>&#10;   <cat></cat>&#10;   <leopard>&#10;      <small></small>&#10;      <big></big>&#10;   </leopard>&#10;</animal>"
                }
            },
            "P02": {
                "ibm02v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\r\n<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n<!-- This test case covers     legal character ranges plus\r\n        discrete legal characters for production 02. -->\r\n<?NAME_09-\t_0A-\r\n_0D-\r\n_20- _D7FF-퟿_6c0f-氏_E000-_FFFD-�_effe-_010000-𐀀_10FFFF-􏿿_08ffff-򏿿 This is a PI target ?>\r\n]>\r\n<book/>\r\n",
                    "output": "<?NAME_09- _0A-\n\n_0D-\n_20- _D7FF-퟿_6c0f-氏_E000-_FFFD-�_effe-_010000-𐀀_10FFFF-􏿿_08ffff-򏿿 This is a PI target ?><book></book>\n"
                }
            },
            "P03": {
                "ibm03v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\r\r\n<!DOCTYPE book [\r\r\n<!ELEMENT book ANY>\r\r\n<!-- This test case covers 0 legal character ranges plus\r\r\n     4 discrete legal characters for production 03. -->\r\r\n<?NAME_20- _09-\t_0D-\r_0A-\r\r\n This is a PI target ?>\r\r\n]>\r\r\n<book/>\r\r\n",
                    "output": "<?NAME_20- _09-\t_0D-\n_0A-\n\n This is a PI target ?><book></book>"
                }
            },
            "P09": {
                "ibm09v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n \t<!ENTITY FullName \"\">\r\n]>\r\n\r\n<student>My Name is &FullName;. </student>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n ",
                    "output": "<student>My Name is . </student>"
                },
                "ibm09v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n \t<!ENTITY FullName \"SnowMan\">\r\n]>\r\n\r\n<student>My Name is &FullName;. </student>",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm09v03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student  SYSTEM \"ibm09v03.dtd\">\r\n<student>I am a new student with &Name;</student>\r\n",
                    "output": "<student>I am a new student with first , last</student>"
                },
                "ibm09v04.xml": {
                    "input": "<?xml version=\"1.0\"?> \r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n<!-- testing entity value with Reference -->\r\n\t<!ENTITY RealName \"SnowMan\"> \r\n \t<!ENTITY FullName \"&RealName;\">\r\n]>\r\n\r\n<student>My Name is &FullName;. </student>",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm09v05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student SYSTEM \"student.dtd\"[\r\n\t<!ELEMENT student (#PCDATA)> \r\n\t<!ENTITY Age \"21\">\r\n\t<!ENTITY Status \"freshman\">\r\n \t<!ENTITY % FullName \"first , last , middle\">\r\n]>\r\n\r\n<!-- testing entity value with combination reference -->\r\n<student>This is a test of &combine;</student>\r\n\r\n\r\n\r\n",
                    "output": "<student>This is a test of My Name is first , last , middle and my age is 21 Again first , last , middle first , last , middle and my status is &#10;&#9;&#9;freshman freshman and first , last , middle 21 first , last , middle freshman That is all.</student>"
                }
            },
            "P10": {
                "ibm10v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #REQUIRED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"Y\">\r\n\t<!ENTITY mylast \"\">\r\n]>\r\n<!-- testing AttValue with empty char inside double quote -->\r\n<student first=\"\" last=\"\">My Name is Snow &mylast; Man. </student>\r\n\r\n\r\n\r\n\r\n\r\n\r\n",
                    "output": "<student first=\"\" last=\"\">My Name is Snow  Man. </student>"
                },
                "ibm10v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #REQUIRED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"Y\">\r\n\t<!ENTITY mylast ''>\r\n]>\r\n<!-- testing AttValue with empty char inside single quote -->\r\n<student first='' last=''>My Name is Snow &mylast; Man. </student>\r\n\r\n",
                    "output": "<student first=\"\" last=\"\">My Name is Snow  Man. </student>"
                },
                "ibm10v03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #REQUIRED > \r\n\t<!ENTITY myfirst 'Snow'>\r\n\t<!ENTITY mymiddle 'I'>\r\n\t<!ENTITY mylast \"Man'\">\r\n]>\r\n<!-- testing AttValue string with a single quote inside -->\r\n<student first=\"Snow'\" last=\"Man\">My Name is &myfirst; &mylast;. </student>",
                    "output": "<student first=\"Snow'\" last=\"Man\">My Name is Snow Man'. </student>"
                },
                "ibm10v04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #REQUIRED > \r\n\t<!ENTITY myfirst 'Snow'>\r\n\t<!ENTITY mymiddle 'I'>\r\n\t<!ENTITY mylast 'Man\"'>\r\n]>\r\n<!-- testing AttValue string with a double quote inside -->\r\n<student first='Snow\"' last='Man'>My Name is &myfirst; &mylast;. </student>\r\n\r\n",
                    "output": "<student first=\"Snow&quot;\" last=\"Man\">My Name is Snow Man&quot;. </student>"
                },
                "ibm10v05.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #REQUIRED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"Y\">\r\n\t<!ENTITY mylast \"&myfirst; Man\">\r\n]>\r\n<!-- testing AttValue with a reference in double quote -->\r\n<student first=\"&myfirst;\" last=\"mylast;\">My Name is &mylast;. </student>\r\n\r\n",
                    "output": "<student first=\"Snow\" last=\"mylast;\">My Name is Snow Man. </student>"
                },
                "ibm10v06.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #REQUIRED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"Y\">\r\n\t<!ENTITY mylast '&myfirst; Man'>\r\n]>\r\n<!-- testing AttValue with a reference in single quote -->\r\n<student first='&myfirst;' last='&mylast;'>My Name is &mylast;. </student>\r\n\r\n",
                    "output": "<student first=\"Snow\" last=\"Snow Man\">My Name is Snow Man. </student>"
                },
                "ibm10v07.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #REQUIRED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"Y\">\r\n\t<!ENTITY mylast \"Man &myfirst; and &myfirst; mymiddle;.\">\r\n]>\r\n<!-- testing AttValue with references combination in double quotes -->\r\n<student first=\"Full Name &myfirst; &#x31; and &mylast; &mylast; &#x63;\" last=\"&mylast;\" >My first Name is &myfirst; and my last name is &mylast;. </student>\r\n",
                    "output": "<student first=\"Full Name Snow 1 and Man Snow and Snow mymiddle;. Man Snow and Snow mymiddle;. c\" last=\"Man Snow and Snow mymiddle;.\">My first Name is Snow and my last name is Man Snow and Snow mymiddle;.. </student>"
                },
                "ibm10v08.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student\r\n\t\tfirst CDATA #REQUIRED\r\n\t\tmiddle CDATA #IMPLIED\r\n\t\tlast CDATA #REQUIRED > \r\n\t<!ENTITY myfirst \"Snow\">\r\n\t<!ENTITY mymiddle \"I\">\r\n\t<!ENTITY mylast 'Man &myfirst; and &myfirst; mymiddle;.'>\r\n]>\r\n<!-- testing AttValue with references combination in single quote -->\r\n<student first='Full Name &myfirst; and &#x22;&mylast;&#x22; &mylast;' last='&mylast;'>My first Name is &myfirst; and my last name is &mylast;. </student>\r\n\r\n",
                    "output": "<student first=\"Full Name Snow and &quot;Man Snow and Snow mymiddle;.&quot; Man Snow and Snow mymiddle;.\" last=\"Man Snow and Snow mymiddle;.\">My first Name is Snow and my last name is Man Snow and Snow mymiddle;.. </student>"
                }
            },
            "P11": {
                "ibm11v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n   <!ELEMENT student (#PCDATA)>\r\n   <!ENTITY unref SYSTEM \"\">\r\n]>\r\n\r\n<!-- testing systemliteral with nothing between the double quotes -->\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n ",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm11v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n   <!ELEMENT student (#PCDATA)>\r\n   <!ENTITY unref SYSTEM ''>\r\n]>\r\n\r\n<!-- testing systemliteral with nothing between the single quotes -->\r\n<student>My Name is SnowMan. </student>\r\n",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm11v03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student SYSTEM 'student.dtd'[\r\n]>\r\n<!-- testing systemliteral with a string with \"'\" -->\r\n<student>My Name is SnowMan. </student>\r\n",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm11v04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student SYSTEM \"student.dtd\" [\r\n]>\r\n\r\n<!-- testing systemliteral with a string with '\"' -->\r\n<student>My Name is SnowMan. </student>\r\n\r\n",
                    "output": "<student>My Name is SnowMan. </student>"
                }
            },
            "P12": {
                "ibm12v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student PUBLIC \"\" \"student.dtd\"[\r\n]>\r\n\r\n<!-- testing Pubid Literal with nothing between the double quote -->\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n ",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm12v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student PUBLIC '' 'student.dtd'[\r\n]>\r\n\r\n<!-- testing Pubid Literal with nothing between the single quotes -->\r\n<student>My Name is SnowMan. </student>\r\n",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm12v03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student PUBLIC \"The big ' in it\" \"student.dtd\"[\r\n]>\r\n\r\n<!-- testing Pubid Literal with a string with \"'\" inside -->\r\n<student>My Name is SnowMan. </student>\r\n",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm12v04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student PUBLIC 'The latest version' 'student.dtd'[\r\n]>\r\n\r\n<!-- testing Pubid Literal with a string without  \"'\" inside -->\r\n<student>My Name is SnowMan. </student>\r\n",
                    "output": "<student>My Name is SnowMan. </student>"
                }
            },
            "P13": {
                "ibm13v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student PUBLIC \"#x20 #xD #xA abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ -'()+,./:=?;!*#@$_% \" \"student.dtd\"[\r\n]>\r\n\r\n<!-- testing Pubid char with all legal pubidchar in a string -->\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n ",
                    "output": "<student>My Name is SnowMan. </student>"
                }
            },
            "P14": {
                "ibm14v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student first CDATA #REQUIRED\r\n\t\t\t  last  CDATA #IMPLIED>\r\n]>\r\n\r\n<!-- testing chardata with empty string -->\r\n<student first=\"Snow\"></student>\r\n\r\n\r\n",
                    "output": "<student first=\"Snow\"></student>"
                },
                "ibm14v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student first CDATA #REQUIRED\r\n\t\t\t  last  CDATA #IMPLIED>\r\n]>\r\n\r\n<!-- testing chardata with white space -->\r\n<student first=\"Eric\"> &#x0A; &#x09; &#x0D;&#x20;</student>\r\n\r\n\r\n",
                    "output": "<student first=\"Eric\"> &#10; &#9; &#13; </student>"
                },
                "ibm14v03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)>\r\n\t<!ATTLIST student first CDATA #REQUIRED\r\n\t\t\t  last  CDATA #IMPLIED>\r\n]>\r\n\r\n<!-- testing chardata with a string of sample legal char except '<' and '&' nor does it contain sequence \"]]>\" -->\r\n<student first=\"Snow\" last=\"Man\">This is a test</student>",
                    "output": "<student first=\"Snow\" last=\"Man\">This is a test</student>"
                }
            },
            "P15": {
                "ibm15v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n<!--* Tests empty comment *-->\r\n<!---->\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm15v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- Student's name -->\r\n<student>My Name is SnowMan. </student>",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm15v03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- student file-1 -->\r\n<student>My Name is SnowMan. </student>",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm15v04.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!--student phone number 408-398 (387)-4758 -->\r\n<student>My Name is SnowMan. </student>\r\n",
                    "output": "<student>My Name is SnowMan. </student>"
                }
            },
            "P16": {
                "ibm16v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<?MyInstruct?>\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n",
                    "output": "<?MyInstruct ?><student>My Name is SnowMan. </student>"
                },
                "ibm16v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<?MyInstruct ?>\r\n<student>My Name is SnowMan. </student>",
                    "output": "<?MyInstruct ?><student>My Name is SnowMan. </student>"
                },
                "ibm16v03.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<?MyInstruct AVOID ? BEFORE > IN PI ?>\r\n<student>My Name is SnowMan. </student>",
                    "output": "<?MyInstruct AVOID ? BEFORE > IN PI ?><student>My Name is SnowMan. </student>"
                }
            },
            "P17": {
                "ibm17v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<?MyInstruct This is a test ?>\r\n<student>My Name is SnowMan. </student>\r\n\r\n\r\n",
                    "output": "<?MyInstruct This is a test ?><student>My Name is SnowMan. </student>"
                }
            },
            "P18": {
                "ibm18v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing CDSect with CDStart CData CDEnd -->\r\n\r\n<student>My Name is SnowMan. <![CDATA[This is <normal> text]]> </student>\r\n\r\n",
                    "output": "<student>My Name is SnowMan. This is &lt;normal&gt; text </student>"
                }
            },
            "P19": {
                "ibm19v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing CDStart -->\r\n<student>My Name is SnowMan. <![CDATA[This is a test]]> </student>\r\n\r\n\r\n",
                    "output": "<student>My Name is SnowMan. This is a test </student>"
                }
            },
            "P20": {
                "ibm20v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing CData with empty string -->\r\n\r\n<student>My Name is SnowMan. <![CDATA[]]></student>\r\n\r\n\r\n",
                    "output": "<student>My Name is SnowMan. </student>"
                },
                "ibm20v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing CData with legal chars -->\r\n\r\n<student>My Name is SnowMan. <![CDATA[<testing>This is a test</testing>]]></student>",
                    "output": "<student>My Name is SnowMan. &lt;testing&gt;This is a test&lt;/testing&gt;</student>"
                }
            },
            "P21": {
                "ibm21v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE student [\r\n\t<!ELEMENT student (#PCDATA)> \r\n]>\r\n\r\n<!-- testing CDEnd --> \r\n\r\n<student>My Name is SnowMan. <![CDATA[This is a test]]> </student>\r\n\r\n\r\n",
                    "output": "<student>My Name is SnowMan. This is a test </student>"
                }
            },
            "P22": {
                "ibm22v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm22v02.xml": {
                    "input": "<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm22v03.xml": {
                    "input": "<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<!-- This is a Misc -->\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm22v04.xml": {
                    "input": "<!-- This is a Misc -->\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm22v05.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n<!-- This is a Misc -->\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm22v06.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<!-- This is a Misc -->\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm22v07.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n<!-- This is a Misc -->\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<!-- This is a Misc -->\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                }
            },
            "P23": {
                "ibm23v01.xml": {
                    "input": "<?xml version='1.0'?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm23v02.xml": {
                    "input": "<?xml version='1.0' encoding='UTF-8' ?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm23v03.xml": {
                    "input": "<?xml version='1.0' standalone='yes' ?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm23v04.xml": {
                    "input": "<?xml version='1.0' ?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm23v05.xml": {
                    "input": "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm23v06.xml": {
                    "input": "<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                }
            },
            "P24": {
                "ibm24v01.xml": {
                    "input": "<?xml version='1.0'?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm24v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                }
            },
            "P25": {
                "ibm25v01.xml": {
                    "input": "<?xml version='1.0'?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm25v02.xml": {
                    "input": "<?xml version ='1.0'?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm25v03.xml": {
                    "input": "<?xml version= '1.0'?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                },
                "ibm25v04.xml": {
                    "input": "<?xml version = '1.0'?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                }
            },
            "P26": {
                "ibm26v01.xml": {
                    "input": "<?xml version='1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n",
                    "output": "<doc></doc>"
                }
            },
            "P27": {
                "ibm27v01.xml": {
                    "input": "<?xml version='1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<!-- This is a comment in Misc -->",
                    "output": "<doc></doc>"
                },
                "ibm27v02.xml": {
                    "input": "<?xml version='1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc EMPTY>\r\n]>\r\n<doc/>\r\n<?sound \"This is a PI in Misc ?>",
                    "output": "<doc></doc><?sound \"This is a PI in Misc ?>"
                },
                "ibm27v03.xml": {
                    "input": "<?xml version='1.0' ?>\r\n<!DOCTYPE doc [\r\n   <!ELEMENT doc ANY>\r\n]>\r\n<doc>S is in the following Misc</doc>\r\n",
                    "output": "<doc>S is in the following Misc</doc>"
                }
            },
            "P28": {
                "ibm28v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding='UTF-8'?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal EMPTY>\r\n]>\r\n<!-- This a valid test file for production [28] --> \r\n<animal/>\r\n",
                    "output": "<animal></animal>"
                },
                "ibm28v02.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm28v02.dtd\" [\r\n   <!NOTATION animal_class SYSTEM \"ibm28v02.txt\">\r\n   <!ENTITY forcat \"This is a small cat\">\r\n   <!ELEMENT tiger (#PCDATA)>\r\n   <!ENTITY % make_small \"<!ELEMENT small EMPTY>\">\r\n   <!ENTITY % make_leopard_element \"<!ELEMENT leopard ANY>\">\r\n   <!ENTITY % make_attlist \"<!ATTLIST tiger color CDATA #REQUIRED>\">\r\n   %make_leopard_element; \r\n   <!ELEMENT cat ANY>\r\n   %make_small;\r\n   <!ENTITY % make_big \"<!ELEMENT big EMPTY>\">\r\n   %make_big;\r\n   %make_attlist;\r\n   <?sound \"This is a PI\" ?>\r\n   <!-- This is a valid test file for p28 -->\r\n]>\r\n<animal>\r\n   <cat>&forcat;</cat>\r\n   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>\r\n   <cat/>\r\n   <leopard>\r\n      <small/>\r\n      <big/>\r\n   </leopard>\r\n</animal>\r\n",
                    "output": "<?sound \"This is a PI\" ?><!DOCTYPE animal [\n<!NOTATION animal_class SYSTEM 'ibm28v02.txt'>\n]>\n<animal>&#10;   <cat>This is a small cat</cat>&#10;   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>&#10;   <cat></cat>&#10;   <leopard>&#10;      <small></small>&#10;      <big></big>&#10;   </leopard>&#10;</animal>"
                }
            },
            "P29": {
                "ibm29v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal (cat|tiger|leopard)+>\r\n   <!NOTATION animal_class SYSTEM \"ibm29v01.txt\">\r\n   <!ELEMENT cat ANY>\r\n   <!ENTITY forcat \"This is a small cat\">\r\n   <!ELEMENT tiger (#PCDATA)>\r\n   <!ELEMENT leopard ANY>\r\n   <!ELEMENT small EMPTY>\r\n   <!ELEMENT big EMPTY>\r\n   <!ATTLIST tiger color CDATA #REQUIRED>\r\n   <?sound \"This is a PI\" ?>\r\n   <!-- This is a comment -->\r\n    \r\n]>\r\n<animal>\r\n   <cat>&forcat;</cat>\r\n   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>\r\n   <cat/>\r\n   <leopard>\r\n      <small/>\r\n      <big/>\r\n   </leopard>\r\n</animal>\r\n",
                    "output": "<?sound \"This is a PI\" ?><!DOCTYPE animal [\n<!NOTATION animal_class SYSTEM 'ibm29v01.txt'>\n]>\n<animal>&#10;   <cat>This is a small cat</cat>&#10;   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>&#10;   <cat></cat>&#10;   <leopard>&#10;      <small></small>&#10;      <big></big>&#10;   </leopard>&#10;</animal>"
                },
                "ibm29v02.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n<!DOCTYPE animal [\r\n   <!ELEMENT animal (cat|tiger|leopard)+>\r\n   <!NOTATION animal_class SYSTEM \"ibm29v01.txt\">\r\n   <!ELEMENT cat ANY>\r\n   <!ENTITY forcat \"This is a small cat\">\r\n   <!ELEMENT tiger (#PCDATA)>\r\n   <!ENTITY % make_leopard_element \"<!ELEMENT leopard ANY>\">\r\n   %make_leopard_element; \r\n   <!ELEMENT small EMPTY>\r\n   <!ELEMENT big EMPTY>\r\n   <!ATTLIST tiger color CDATA #REQUIRED>\r\n   <?sound \"This is a PI\" ?>\r\n   <!-- This is a comment -->\r\n    \r\n]>\r\n<animal>\r\n   <cat>&forcat;</cat>\r\n   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>\r\n   <cat/>\r\n   <leopard>\r\n      <small/>\r\n      <big/>\r\n   </leopard>\r\n</animal>\r\n",
                    "output": "<?sound \"This is a PI\" ?><!DOCTYPE animal [\n<!NOTATION animal_class SYSTEM 'ibm29v01.txt'>\n]>\n<animal>&#10;   <cat>This is a small cat</cat>&#10;   <tiger color=\"white\">This is a white tiger in Mirage!!</tiger>&#10;   <cat></cat>&#10;   <leopard>&#10;      <small></small>&#10;      <big></big>&#10;   </leopard>&#10;</animal>"
                }
            },
            "P30": {
                "ibm30v01.xml": {
                    "input": "<!DOCTYPE animal SYSTEM \"ibm30v01.dtd\">\r\n<animal/>\r\n<!-- tests extSubset with extSubsetDecl only in the dtd file -->\r\n",
                    "output": "<animal></animal>"
                },
                "ibm30v02.xml": {
                    "input": "<!DOCTYPE animal SYSTEM \"ibm30v02.dtd\">\r\n<animal/>\r\n<!-- tests extSubset with TextDecl and extSubsetDecl in the dtd file -->\r\n",
                    "output": "<animal></animal>"
                }
            },
            "P31": {
                "ibm31v01.xml": {
                    "input": "<!DOCTYPE animal SYSTEM \"ibm31v01.dtd\">\r\n<animal>\r\n   <tiger/>\r\n</animal>\r\n<!-- tests extSubsetDecl with combinations of markupdecls, conditionalSects, PEReferences and white spaces -->\r\n",
                    "output": "<animal>&#10;   <tiger></tiger>&#10;</animal>"
                }
            },
            "P32": {
                "ibm32v01.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"no\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32v01.dtd\">\r\n<animal/>\r\n<!-- Tests VC: Standalone Document Declaration with absent attribute that has default value and standalone is no -->\r\n",
                    "output": "<animal color=\"yellow\"></animal>"
                },
                "ibm32v02.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"no\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32v02.dtd\">\r\n<animal>&animal_content;</animal>\r\n<!-- Tests VC: Standalone Document Declaration with external enitity reference and standalone is no -->\r\n",
                    "output": "<animal>This is a yellow tiger</animal>"
                },
                "ibm32v03.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"no\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32v03.dtd\">\r\n<animal/>\r\n<!-- Tests VC: Standalone Document Declaration with attribute values that need to be normalized and standalone is no -->\r\n",
                    "output": "<animal class=\")\"></animal>"
                },
                "ibm32v04.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"no\" ?>\r\n<!DOCTYPE animal SYSTEM \"ibm32v04.dtd\">\r\n<animal>This is a \r\n      <a/>  \r\n\r\nyellow tiger</animal>\r\n<!-- Tests VC: Standalone Document Declaration with whitespace in mixed content -->\r\n",
                    "output": "<animal xml:space=\"preserve\">This is a &#10;      <a></a>  &#10;&#10;yellow tiger</animal>"
                }
            },
            "P33": {
                "ibm33v01.xml": {
                    "input": "<!DOCTYPE book [\r\n   <!ELEMENT book ANY>\r\n   <!ATTLIST book xml:lang CDATA #REQUIRED>\r\n]>\r\n<book xml:lang=\"en-US\">It is written in English</book>\r\n<!-- Tests LanguageID with Langcode - Subcode -->",
                    "output": "<book xml:lang=\"en-US\">It is written in English</book>"
                }
            },
            "P34": {
                "ibm34v01.xml": {
                    "input": "<!DOCTYPE book [\r\n   <!ELEMENT book ANY>\r\n   <!ATTLIST book xml:lang CDATA #REQUIRED>\r\n]>\r\n<book xml:lang=\"en-US\">It is written in English</book>\r\n",
                    "output": "<book xml:lang=\"en-US\">It is written in English</book>"
                }
            },
            "P35": {
                "ibm35v01.xml": {
                    "input": "<!DOCTYPE book [\r\n   <!ELEMENT book ANY>\r\n   <!ATTLIST book xml:lang CDATA #REQUIRED>\r\n]>\r\n<book xml:lang=\"en\">It is written in English</book>\r\n",
                    "output": "<book xml:lang=\"en\">It is written in English</book>"
                }
            },
            "P36": {
                "ibm36v01.xml": {
                    "input": "<!DOCTYPE book [\r\n   <!ELEMENT book ANY>\r\n   <!ATTLIST book xml:lang CDATA #REQUIRED>\r\n]>\r\n<book xml:lang=\"i-BS-ABCD\">It is written in English</book>\r\n",
                    "output": "<book xml:lang=\"i-BS-ABCD\">It is written in English</book>"
                }
            },
            "P37": {
                "ibm37v01.xml": {
                    "input": "<!DOCTYPE book [\r\n   <!ELEMENT book ANY>\r\n   <!ATTLIST book xml:lang CDATA #REQUIRED>\r\n]>\r\n<book xml:lang=\"x-uk-eng\">It is written in English</book>\r\n",
                    "output": "<book xml:lang=\"x-uk-eng\">It is written in English</book>"
                }
            },
            "P38": {
                "ibm38v01.xml": {
                    "input": "<!DOCTYPE book [\r\n   <!ELEMENT book ANY>\r\n   <!ATTLIST book xml:lang CDATA #REQUIRED>\r\n]>\r\n<book xml:lang=\"en-USa\">It is written in English</book>\r\n",
                    "output": "<book xml:lang=\"en-USa\">It is written in English</book>"
                }
            },
            "P39": {
                "ibm39v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (a,b)>\r\n  <!ELEMENT a EMPTY>\r\n  <!ELEMENT b (#PCDATA|c)* >\r\n  <!ELEMENT c ANY>\r\n  <!ELEMENT d ((e,e)|f)+ >\r\n  <!ELEMENT e ANY>\r\n  <!ELEMENT f EMPTY>\r\n]>\r\n<root><a/><b>\r\n   <c></c> \r\n   content of b element\r\n   <c>\r\n      <d><e>no more children</e><e><f/></e><f/></d>\r\n   </c>\r\n</b></root>\r\n<!--* test P39's syntax and Element Valid VC *-->\r\n",
                    "output": "<root><a></a><b>&#10;   <c></c> &#10;   content of b element&#10;   <c>&#10;      <d><e>no more children</e><e><f></f></e><f></f></d>&#10;   </c>&#10;</b></root>"
                }
            },
            "P40": {
                "ibm40v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA|b)* >\r\n  <!ELEMENT b (#PCDATA) >\r\n  <!ATTLIST b attr1 CDATA #IMPLIED>\r\n  <!ATTLIST b attr2 CDATA #IMPLIED>\r\n  <!ATTLIST b attr3 CDATA #IMPLIED>\r\n]>\r\n<root>\r\n  <b>without white space</b>\r\n  <b > with a white space</b>\r\n  <b attr1=\"value1\">one attribute</b>\r\n  <b attr1=\"value1\" attr2=\"value2\" attr3 = \"value3\">one attribute</b>\r\n</root>\r\n<!--* testing P40 *-->\r\n",
                    "output": "<root>&#10;  <b>without white space</b>&#10;  <b> with a white space</b>&#10;  <b attr1=\"value1\">one attribute</b>&#10;  <b attr1=\"value1\" attr2=\"value2\" attr3=\"value3\">one attribute</b>&#10;</root>"
                }
            },
            "P41": {
                "ibm41v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA|b)* >\r\n  <!ELEMENT b (#PCDATA) >\r\n  <!ATTLIST b attr1 CDATA #REQUIRED>\r\n  <!ATTLIST b attr2 (abc|def) \"abc\">\r\n  <!ATTLIST b attr3 CDATA #FIXED \"fixed\">\r\n]>\r\n<root>\r\n  <b attr1=\"value1\" attr2=\"def\" attr3=\"fixed\">Name eq AttValue</b>\r\n</root>\r\n<!--* testing P41 *-->\r\n",
                    "output": "<root>&#10;  <b attr1=\"value1\" attr2=\"def\" attr3=\"fixed\">Name eq AttValue</b>&#10;</root>"
                }
            },
            "P42": {
                "ibm42v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (a,b)>\r\n  <!ELEMENT a EMPTY>\r\n  <!ELEMENT b (#PCDATA|c)* >\r\n  <!ELEMENT c ANY>\r\n]>\r\n<root><a/><b>\r\n   <c></c > : End tag with a space inside\r\n   content of b element\r\n</b></root>\r\n<!--* test P42 *-->\r\n\r\n",
                    "output": "<root><a></a><b>&#10;   <c></c> : End tag with a space inside&#10;   content of b element&#10;</b></root>"
                }
            },
            "P43": {
                "ibm43v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (a,b)>\r\n  <!ELEMENT a EMPTY>\r\n  <!ELEMENT b (#PCDATA|c)* >\r\n  <!ELEMENT c ANY>\r\n  <!ENTITY inContent \"<b>General entity reference in element content</b>\">\r\n]>\r\n<!--* content: element|CharData|Reference|CDSect|PI|CDSect|PI|Comment *-->\r\n<root><a/><b>\r\n<!-- there is an empty element in the above line -->\r\n   <c></c> \r\n   CharData: content of b element\r\n   %paaa; : PE reference should not be recognized in element content \r\n   <c>\r\n<?PIcontent anyProcessingInstruction?>\r\n<!-- Comment content -->\r\n    &inContent;\r\n    Charater reference: &#x41;\r\n    CDSect in content: <![CDATA[ <html>markups<head>HEAD</head><body>nothing</body></html> ]]>\r\n   </c>\r\n</b>\r\n</root>\r\n<!--* test P43 *-->\r\n",
                    "output": "<root><a></a><b>&#10;&#10;   <c></c> &#10;   CharData: content of b element&#10;   %paaa; : PE reference should not be recognized in element content &#10;   <c>&#10;<?PIcontent anyProcessingInstruction?>&#10;&#10;    <b>General entity reference in element content</b>&#10;    Charater reference: A&#10;    CDSect in content:  &lt;html&gt;markups&lt;head&gt;HEAD&lt;/head&gt;&lt;body&gt;nothing&lt;/body&gt;&lt;/html&gt; &#10;   </c>&#10;</b>&#10;</root>"
                }
            },
            "P44": {
                "ibm44v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA|b)* >\r\n  <!ELEMENT b EMPTY >\r\n  <!ATTLIST b attr1 CDATA #IMPLIED>\r\n  <!ATTLIST b attr2 CDATA #IMPLIED>\r\n  <!ATTLIST b attr3 CDATA #IMPLIED>\r\n]>\r\n<root>\r\n  <b/>without white space\r\n  <b /> with a white space\r\n  <b attr1=\"value1\" />\r\n  <b attr1=\"value1\" attr2=\"value2\" attr3 = \"value3\"/>\r\n</root>\r\n<!--* testing P44 *-->\r\n\r\n\r\n\r\n",
                    "output": "<root>&#10;  <b></b>without white space&#10;  <b></b> with a white space&#10;  <b attr1=\"value1\"></b>&#10;  <b attr1=\"value1\" attr2=\"value2\" attr3=\"value3\"></b>&#10;</root>"
                }
            },
            "P45": {
                "ibm45v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA|b)* >\r\n  <!--* P45 no space before the end bracket *-->\r\n  <!ELEMENT b EMPTY>\r\n  <!ELEMENT unique ANY>\r\n  <!ELEMENT unique- ANY>\r\n  <!ELEMENT unique_ ANY>\r\n  <!ELEMENT unique. ANY>\r\n  <!ATTLIST b attr1 CDATA #IMPLIED>\r\n  <!ATTLIST b attr2 CDATA #IMPLIED>\r\n  <!ATTLIST b attr3 CDATA #IMPLIED>\r\n]>\r\n<root>\r\n  <b/>without white space\r\n  <b /> with a white space\r\n  <b attr1=\"value1\" />\r\n  <b attr1=\"value1\" attr2=\"value2\" attr3 = \"value3\"/>\r\n</root>\r\n<!--* !!! testing both P45 and p46 *-->\r\n\r\n",
                    "output": "<root>&#10;  <b></b>without white space&#10;  <b></b> with a white space&#10;  <b attr1=\"value1\"></b>&#10;  <b attr1=\"value1\" attr2=\"value2\" attr3=\"value3\"></b>&#10;</root>"
                }
            },
            "P47": {
                "ibm47v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (a,b)>\r\n  <!ELEMENT a EMPTY>\r\n  <!ELEMENT b (#PCDATA|c)* >\r\n  <!ELEMENT c ANY>\r\n  <!ELEMENT d ANY>\r\n  <!ELEMENT e ANY>\r\n  <!ELEMENT f ANY>\r\n  <!--* test all possible children,cp,choice,seq patterns in P47,P48,P49,P50 *-->\r\n  <!ELEMENT child0 (a)>\r\n  <!ELEMENT child1 (a|b|c)>\r\n  <!ELEMENT child2 (a ,b,b?,a*,c,c,a,a,b+,c ) >\r\n  <!ELEMENT child3 (a+|b)? >\r\n  <!ELEMENT child4 (a, (b|c)+, (a|d)?, (e|f)* )?>\r\n  <!ELEMENT child5 ( (a,b) | c? | ((d|e),b,c) )* >\r\n  <!ELEMENT child5_1 ( (a,b)* | (c,b)? | (d,a)+ | ((e|f),b,c) )* >\r\n  <!ELEMENT child6 (a,b,c)*>\r\n  <!ELEMENT child7 ((a,b)|c*|((d|e),b,c) )+ >\r\n  <!ELEMENT child8 ( a, (b|c), (a|b), b)+>  \r\n]>\r\n<root><a/><b>\r\n   <c></c >\r\n   content of b element\r\n</b></root>\r\n<!--* a valid test: tests P47,P48,P49,P50*-->\r\n\r\n",
                    "output": "<root><a></a><b>&#10;   <c></c>&#10;   content of b element&#10;</b></root>"
                }
            },
            "P49": {
                "ibm49v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm49v01.dtd\"[\r\n  <!ELEMENT root (a,b)>\r\n]>\r\n<root><a/><b>\r\n   <c></c>\r\n   content of b element\r\n</b></root>\r\n<!--* a valid test: tests VC:Proper Group/PE Nesting in P49 *-->\r\n\r\n\r\n\r\n",
                    "output": "<root><a></a><b>&#10;   <c></c>&#10;   content of b element&#10;</b></root>"
                }
            },
            "P50": {
                "ibm50v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm50v01.dtd\" [\r\n  <!ELEMENT root (a,b)>\r\n]>\r\n<root><a/><b>\r\n   <c><child1><a/><b></b><c></c></child1></c >\r\n   <c><child2><a/><b></b><c></c></child2></c >\r\n   content of b element\r\n</b></root>\r\n<!--* a valid test: tests VC:Proper Group/PE Nesting in P50 *-->\r\n",
                    "output": "<root><a></a><b>&#10;   <c><child1><a></a><b></b><c></c></child1></c>&#10;   <c><child2><a></a><b></b><c></c></child2></c>&#10;   content of b element&#10;</b></root>"
                }
            },
            "P51": {
                "ibm51v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root ANY>\r\n  <!--* test all possible Mixed content type decl *-->\r\n  <!ELEMENT a (#PCDATA)* >\r\n  <!ELEMENT b (#PCDATA) >\r\n  <!ELEMENT c ( #PCDATA)*>\r\n  <!ELEMENT d (#PCDATA|c)*>\r\n  <!ELEMENT e (#PCDATA|c| b|a)* >\r\n  <!ELEMENT f (#PCDATA| c)* >\r\n  <!ELEMENT g ( #PCDATA) >\r\n  <!ELEMENT h (#PCDATA )>\r\n  <!ELEMENT i ( #PCDATA ) >\r\n]>\r\n<root>\r\n  <a> Element type a </a>\r\n  <b> Element type b </b>\r\n  <c> Element type c </c>\r\n  <d> Element type d <c></c> </d>\r\n  <e> Element type e <a></a> <b></b> <c></c> </e>\r\n</root>\r\n<!--* a valid test: tests P51 *-->",
                    "output": "<root>&#10;  <a> Element type a </a>&#10;  <b> Element type b </b>&#10;  <c> Element type c </c>&#10;  <d> Element type d <c></c> </d>&#10;  <e> Element type e <a></a> <b></b> <c></c> </e>&#10;</root>"
                },
                "ibm51v02.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm51v02.dtd\" [\r\n  <!ELEMENT root ANY>\r\n]>\r\n<root>\r\n  <a> Element type a </a>\r\n  <b> Element type b </b>\r\n  <c> Element type c </c>\r\n  <d> Element type d <c></c> </d>\r\n  <e> Element type e <a></a> <b></b> <c></c> </e>\r\n</root>\r\n<!--* a valid test: tests P51 VC: Proper Group/PE Nesting *-->",
                    "output": "<root>&#10;  <a> Element type a </a>&#10;  <b> Element type b </b>&#10;  <c> Element type c </c>&#10;  <d> Element type d <c></c> </d>&#10;  <e> Element type e <a></a> <b></b> <c></c> </e>&#10;</root>"
                }
            },
            "P52": {
                "ibm52v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root ANY>\r\n  <!ELEMENT a (#PCDATA)* >\r\n  <!ELEMENT b (#PCDATA) >\r\n  <!--* All AttlistDecl Patterns in P52 and P53 *-->\r\n  <!ATTLIST a>\r\n  <!ATTLIST a >\r\n  <!ATTLIST b battr1 CDATA #REQUIRED >\r\n  <!ATTLIST b battr2 CDATA #IMPLIED \r\n              battr3 CDATA #FIXED \"fixedvalue\" battr4 (abc|def) \"abc\" >\r\n]>\r\n<root>\r\n  <a> Element type a </a>\r\n  <b battr1 = \"anyvalue\" battr3=\"fixedvalue\" battr4 =\"def\"> test P52 and P53 </b>\r\n</root>\r\n<!--* a valid test: tests P52 and P53 *-->\r\n",
                    "output": "<root>&#10;  <a> Element type a </a>&#10;  <b battr1=\"anyvalue\" battr3=\"fixedvalue\" battr4=\"def\"> test P52 and P53 </b>&#10;</root>"
                }
            },
            "P54": {
                "ibm54v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root ANY>\r\n  <!ELEMENT a (#PCDATA) >\r\n  <!ELEMENT b (#PCDATA) >\r\n  <!ELEMENT c (#PCDATA) >\r\n  <!ELEMENT d (#PCDATA) >\r\n  <!ELEMENT e (#PCDATA) >\r\n  <!ELEMENT f (#PCDATA) >\r\n  <!ELEMENT g (#PCDATA) >\r\n  <!ELEMENT h (#PCDATA) >\r\n  <!ELEMENT i (#PCDATA) >\r\n  <!ELEMENT j (#PCDATA) >\r\n  <!ELEMENT k (#PCDATA) >\r\n  <!--* Tests all Attbuite types in P55,P56,P57,P58,P59 *-->\r\n  <!ATTLIST a aattr1 ID #REQUIRED>\r\n  <!ATTLIST b battr1 CDATA #REQUIRED \r\n              battr2 (good|bad) #REQUIRED \r\n              battr3 ID #REQUIRED>\r\n  <!ATTLIST c c_reference IDREF #REQUIRED>\r\n  <!ATTLIST d d_reference IDREFS #REQUIRED>\r\n  <!ENTITY xmltech SYSTEM \"xmltech.gif\" NDATA gif>\r\n  <!NOTATION gif SYSTEM \"gif\">\r\n  <!ATTLIST e eattr1 ENTITY #REQUIRED>\r\n  <!ENTITY IBMlogo SYSTEM \"IBMlogo.gif\" NDATA gif>\r\n  <!ATTLIST f fattr1 ENTITIES #REQUIRED>\r\n  <!ATTLIST g gattr1 NMTOKEN #REQUIRED>\r\n  <!ATTLIST h hattr1 NMTOKENS #REQUIRED>\r\n  <!NOTATION UTF-8 SYSTEM \"UTF-8\">\r\n  <!ATTLIST i iattr1 NOTATION (UTF-8) #REQUIRED>\r\n  <!--* Tests all DefaultDecl in P60 -->\r\n  <!ATTLIST j jattr1 CDATA #REQUIRED \r\n              jattr2 CDATA \"good\" \r\n              jattr3 CDATA #FIXED \"fixed\"\r\n\t      jattr4 CDATA #IMPLIED >\r\n\r\n]>\r\n<root>\r\n  <a aattr1 = \"a1\"> Element type a </a>\r\n  <b battr1 = \"anyvalue\" battr2=\"good\" battr3 =\"b1\"> Element type b </b>\r\n  <c c_reference = \"b1\"> Element type c </c>\r\n  <d d_reference = \"a1 b1\"> Element type d </d>\r\n  <e eattr1 = \"xmltech\"> Element type e </e>\r\n  <f fattr1 = \"xmltech IBMlogo\"> Element type f </f>\r\n  <g gattr1 = \"xml4j3_0_0_EA3\"> Element type g </g>\r\n  <h hattr1 = \"xml4j3_0_0_EA3 Xerces-J_1_0_1\"> Element type h </h>\r\n  <i iattr1 = \"UTF-8\"> Element type i </i>\r\n  <j jattr1 = \"anyvalue\" jattr2=\"good\" jattr3 =\"fixed\"> Element type j </j>\r\n</root>\r\n<!--* a valid test: tests P54 *-->\r\n",
                    "output": "<!DOCTYPE root [\n<!NOTATION UTF-8 SYSTEM 'UTF-8'>\n<!NOTATION gif SYSTEM 'gif'>\n]>\n<root>&#10;  <a aattr1=\"a1\"> Element type a </a>&#10;  <b battr1=\"anyvalue\" battr2=\"good\" battr3=\"b1\"> Element type b </b>&#10;  <c c_reference=\"b1\"> Element type c </c>&#10;  <d d_reference=\"a1 b1\"> Element type d </d>&#10;  <e eattr1=\"xmltech\"> Element type e </e>&#10;  <f fattr1=\"xmltech IBMlogo\"> Element type f </f>&#10;  <g gattr1=\"xml4j3_0_0_EA3\"> Element type g </g>&#10;  <h hattr1=\"xml4j3_0_0_EA3 Xerces-J_1_0_1\"> Element type h </h>&#10;  <i iattr1=\"UTF-8\"> Element type i </i>&#10;  <j jattr1=\"anyvalue\" jattr2=\"good\" jattr3=\"fixed\"> Element type j </j>&#10;</root>"
                },
                "ibm54v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 54-->\r\n<!DOCTYPE root\r\n [\r\n <!ELEMENT root (x|y|z)*>\r\n <!ELEMENT x (#PCDATA)>\r\n <!ELEMENT y ANY>\r\n <!ELEMENT z EMPTY>\r\n <!ATTLIST x attr CDATA #IMPLIED>\r\n <!ATTLIST y attr NMTOKENS #IMPLIED>\r\n <!ATTLIST z attr (x|y) #IMPLIED>\r\n ]>\r\n<root>\r\n<x attr= 'Madhu'></x>\r\n<y attr= '1.a.name.token.but.not.a.name'></y>\r\n</root>\r\n",
                    "output": "<root>&#10;<x attr=\"Madhu\"></x>&#10;<y attr=\"1.a.name.token.but.not.a.name\"></y>&#10;</root>"
                },
                "ibm54v03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test for Production 54-->\r\n<!DOCTYPE AttrType\r\n[\r\n<!ELEMENT AttrType ANY>\r\n<!ELEMENT a (#PCDATA)>\r\n<!ATTLIST a att CDATA #IMPLIED>\r\n]>\r\n<AttrType>\r\n<a att= 'hello world'>\r\n</a>\r\n</AttrType>\r\n",
                    "output": "<AttrType>&#10;<a att=\"hello world\">&#10;</a>&#10;</AttrType>"
                }
            },
            "P55": {
                "ibm55v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- test valid syntax for Production 55-->\r\n<!DOCTYPE StType\r\n[\r\n<!ELEMENT StType ANY>\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a att CDATA #IMPLIED> \r\n]>\r\n<StType>\r\n<a att='Hello'/>\r\nTesting with a valid stringType attribute \r\n</StType>\r\n",
                    "output": "<StType>&#10;<a att=\"Hello\"></a>&#10;Testing with a valid stringType attribute &#10;</StType>"
                }
            },
            "P56": {
                "ibm56v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- valid test for Production 56-->\r\n<!DOCTYPE root\r\n [\r\n <!ELEMENT root (a|b|c|d|e|f|g)*>\r\n <!ELEMENT a EMPTY>\r\n <!ELEMENT b EMPTY>\r\n <!ELEMENT c EMPTY>\r\n <!ELEMENT d EMPTY>\r\n <!ELEMENT e EMPTY>\r\n <!ELEMENT f EMPTY>\r\n <!ELEMENT g EMPTY>\r\n <!ATTLIST a attr ID #IMPLIED>\r\n <!ATTLIST b attr IDREF #IMPLIED>\r\n <!ATTLIST c attr IDREFS #IMPLIED>\r\n <!ATTLIST d attr ENTITY #IMPLIED>\r\n <!ATTLIST e attr ENTITIES #IMPLIED>\r\n <!ATTLIST f attr NMTOKEN #IMPLIED>\r\n <!ATTLIST g attr NMTOKENS #IMPLIED>\r\n ]>\r\n<root/>\r\n",
                    "output": "<root></root>"
                },
                "ibm56v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Positive Test)-->\r\n<!DOCTYPE tokenizer\r\n [\r\n <!ELEMENT tokenizer ANY>\r\n <!ATTLIST tokenizer UniqueName ID #REQUIRED>\r\n ]>\r\n<tokenizer UniqueName = \"AC1999\">\r\nThis is a positive test for validity constraints\r\nGiving a unique name to the attribute ID an ID Attribute default as #required\r\n</tokenizer>\r\n",
                    "output": "<tokenizer UniqueName=\"AC1999\">&#10;This is a positive test for validity constraints&#10;Giving a unique name to the attribute ID an ID Attribute default as #required&#10;</tokenizer>"
                },
                "ibm56v03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Positive Test)-->\r\n<!DOCTYPE tokenizer\r\n [\r\n <!ELEMENT tokenizer ANY>\r\n <!ATTLIST tokenizer UniqueName ID #IMPLIED>\r\n ]>\r\n<tokenizer UniqueName = \"AC1999\">\r\nThis is a positive test for validity constraints\r\nGiving ID attribute default as #IMPLIED\r\n</tokenizer>",
                    "output": "<tokenizer UniqueName=\"AC1999\">&#10;This is a positive test for validity constraints&#10;Giving ID attribute default as #IMPLIED&#10;</tokenizer>"
                },
                "ibm56v04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(positive Test)-->\r\n<!DOCTYPE tokenizer\r\n [\r\n <!ELEMENT tokenizer ANY>\r\n <!ELEMENT b EMPTY>\r\n <!ATTLIST b attr ID #REQUIRED>\r\n <!ATTLIST tokenizer UniqueName ID #REQUIRED>\r\n  ]>\r\n<tokenizer UniqueName = \"Ac999\">\r\n<b attr = \"BC999\"></b>\r\nThis is a positive test for validity constraints\r\nthe value of the attribute with a type ID does not appear more than once in the XML document\r\n</tokenizer>\r\n",
                    "output": "<tokenizer UniqueName=\"Ac999\">&#10;<b attr=\"BC999\"></b>&#10;This is a positive test for validity constraints&#10;the value of the attribute with a type ID does not appear more than once in the XML document&#10;</tokenizer>"
                },
                "ibm56v05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(positive Test)-->\r\n<!DOCTYPE tokenizer\r\n [\r\n <!ELEMENT tokenizer ANY>\r\n <!ELEMENT a EMPTY>\r\n <!ELEMENT b EMPTY>\r\n <!ATTLIST a first ID #REQUIRED>\r\n <!ATTLIST b second ID #REQUIRED>\r\n ]>\r\n<tokenizer>\r\n<a first = \"AC1999\"></a>\r\n<b second = \"CD345\"></b>\r\nThis is a positive validity test for ID.\r\nany element type has no more than one attribute of type ID specified\r\n</tokenizer>",
                    "output": "<tokenizer>&#10;<a first=\"AC1999\"></a>&#10;<b second=\"CD345\"></b>&#10;This is a positive validity test for ID.&#10;any element type has no more than one attribute of type ID specified&#10;</tokenizer>"
                },
                "ibm56v06.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Positive Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT id EMPTY>\r\n <!ELEMENT idref EMPTY>\r\n <!ATTLIST id UniqueName ID #REQUIRED>\r\n <!ATTLIST idref reference IDREF #IMPLIED>\r\n ]>\r\n<test>\r\n<id UniqueName = \"AC456\"></id>\r\n<idref reference = \"AC456\"></idref>\r\nPositive test for validity constraint of IDREF.\r\nIn an attribute decl, values of type IDREF match tha name production\r\nand the IDREF value matches the value assigned to an ID attribute somewhere\r\nin the XML document.\r\n</test>",
                    "output": "<test>&#10;<id UniqueName=\"AC456\"></id>&#10;<idref reference=\"AC456\"></idref>&#10;Positive test for validity constraint of IDREF.&#10;In an attribute decl, values of type IDREF match tha name production&#10;and the IDREF value matches the value assigned to an ID attribute somewhere&#10;in the XML document.&#10;</test>"
                },
                "ibm56v07.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Positive Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT id1 EMPTY>\r\n <!ELEMENT id2 EMPTY>\r\n <!ELEMENT idref EMPTY>\r\n <!ATTLIST id1 UniqueName ID #REQUIRED>\r\n <!ATTLIST id2 UName ID #IMPLIED>\r\n <!ATTLIST idref reference IDREFS #IMPLIED>\r\n ]>\r\n<test>\r\n<id1 UniqueName = \"AC456\"></id1>\r\n<id2 UName = \"Q123\"></id2>\r\n<idref reference = \"AC456 Q123\"></idref>\r\nPositive test for validity constraint of IDREFS.\r\nIn an attribute decl, values of type IDREFS match tha name production\r\nand the IDREFS value matches the values assigned to an ID attributes somewhere\r\nin the XML document.\r\n</test>",
                    "output": "<test>&#10;<id1 UniqueName=\"AC456\"></id1>&#10;<id2 UName=\"Q123\"></id2>&#10;<idref reference=\"AC456 Q123\"></idref>&#10;Positive test for validity constraint of IDREFS.&#10;In an attribute decl, values of type IDREFS match tha name production&#10;and the IDREFS value matches the values assigned to an ID attributes somewhere&#10;in the XML document.&#10;</test>"
                },
                "ibm56v08.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Positive Test)it is a DTD-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT landscape EMPTY>\r\n <!NOTATION gif PUBLIC \"gif\">\r\n <!ENTITY image SYSTEM \"testspec/images/sunset.gif\" NDATA gif>\r\n <!ATTLIST landscape sun ENTITY #IMPLIED>\r\n]>\r\n<test>\r\n<landscape sun = \"image\"></landscape>\r\nvalues of type ENTITY match the Name production and the ENTITY value\r\nmatches the name of an unparsed entity declared in the DTD.\r\n</test>\r\n",
                    "output": "<!DOCTYPE test [\n<!NOTATION gif PUBLIC 'gif'>\n]>\n<test>&#10;<landscape sun=\"image\"></landscape>&#10;values of type ENTITY match the Name production and the ENTITY value&#10;matches the name of an unparsed entity declared in the DTD.&#10;</test>"
                },
                "ibm56v09.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Positive Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT nametoken EMPTY>\r\n <!ATTLIST nametoken thistoken NMTOKEN #IMPLIED>\r\n]>\r\n<test>\r\n<nametoken thistoken = \"x:image\"></nametoken>\r\nIn an attribute declaration, values of type NMTOKEN match the Nmtoken production\r\n</test>",
                    "output": "<test>&#10;<nametoken thistoken=\"x:image\"></nametoken>&#10;In an attribute declaration, values of type NMTOKEN match the Nmtoken production&#10;</test>"
                },
                "ibm56v10.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity constraint check for Production 56(Positive Test)-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT nametokens EMPTY>\r\n <!ATTLIST nametokens thistoken NMTOKENS #IMPLIED>\r\n]>\r\n<test>\r\n<nametokens thistoken = \"x:lang y:country\"></nametokens>\r\nIn an attribute declaration, values of type NMTOKENS match the Nmtokens production\r\n</test>",
                    "output": "<test>&#10;<nametokens thistoken=\"x:lang y:country\"></nametokens>&#10;In an attribute declaration, values of type NMTOKENS match the Nmtokens production&#10;</test>"
                }
            },
            "P57": {
                "ibm57v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- valid test for Production 57-->\r\n<!DOCTYPE root\r\n [\r\n <!ELEMENT root (#PCDATA|a|b)*>\r\n <!ELEMENT a ANY>\r\n <!ELEMENT b ANY>\r\n <!NOTATION a SYSTEM \"a\">\r\n <!NOTATION b SYSTEM \"b\"> \r\n <!ATTLIST a att (a|b) #IMPLIED>\r\n <!ATTLIST b att NOTATION (a|b) #IMPLIED>\r\n ]>\r\n <root>\r\nThis test case tests the kinds of enumerated types\r\n<a/><b/>\r\n</root>\r\n",
                    "output": "<!DOCTYPE root [\n<!NOTATION a SYSTEM 'a'>\n<!NOTATION b SYSTEM 'b'>\n]>\n<root>&#10;This test case tests the kinds of enumerated types&#10;<a></a><b></b>&#10;</root>"
                }
            },
            "P58": {
                "ibm58v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- valid test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one ANY>\r\n <!ELEMENT two ANY>\r\n <!ELEMENT three ANY>\r\n <!ELEMENT four ANY>\r\n <!ELEMENT five ANY>\r\n <!NOTATION this SYSTEM \"alpha\">\r\n <!NOTATION that SYSTEM \"beta\">\r\n <!ATTLIST one attr NOTATION (this) #IMPLIED>\r\n <!ATTLIST two attr NOTATION ( this) #IMPLIED>\r\n <!ATTLIST three attr NOTATION (this|that) #IMPLIED>\r\n <!ATTLIST four attr NOTATION (that |this) #IMPLIED>\r\n <!ATTLIST five attr NOTATION ( that ) #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a positive test with different patterns for NOTATION\r\n</test>\r\n",
                    "output": "<!DOCTYPE test [\n<!NOTATION that SYSTEM 'beta'>\n<!NOTATION this SYSTEM 'alpha'>\n]>\n<test>&#10;This is a positive test with different patterns for NOTATION&#10;</test>"
                },
                "ibm58v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 58-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT blob (#PCDATA)>\r\n <!NOTATION base64 SYSTEM \"mimecode\">\r\n <!NOTATION uuencode SYSTEM \"uudecode\">\r\n <!NOTATION raw SYSTEM \"bin/cat\">\r\n <!ATTLIST blob content-encoding NOTATION (base64|uuencode|raw) #REQUIRED>\r\n ]>\r\n <test>\r\n<blob content-encoding=\"base64\"></blob>\r\nThe attribute values of type NOTATION matches one of the notation names included in the declaration;\r\nall notation names in the declaration have been declared\r\n</test>",
                    "output": "<!DOCTYPE test [\n<!NOTATION base64 SYSTEM 'mimecode'>\n<!NOTATION raw SYSTEM 'bin/cat'>\n<!NOTATION uuencode SYSTEM 'uudecode'>\n]>\n<test>&#10;<blob content-encoding=\"base64\"></blob>&#10;The attribute values of type NOTATION matches one of the notation names included in the declaration;&#10;all notation names in the declaration have been declared&#10;</test>"
                }
            },
            "P59": {
                "ibm59v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 59-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!ELEMENT enum (#PCDATA)>\r\n <!ATTLIST one attr (one) #IMPLIED>\r\n <!ATTLIST two attr ( enum) #IMPLIED>\r\n <!ATTLIST two attr (one|two) #IMPLIED>\r\n <!ATTLIST two attr (one| two) #IMPLIED>\r\n <!ATTLIST two attr (enum ) #IMPLIED>\r\n <!ATTLIST two attr ( one | two | enum) #IMPLIED>\r\n ]>\r\n <test>\r\nThis is a Positive test\r\n</test>\r\n",
                    "output": "<test>&#10;This is a Positive test&#10;</test>"
                },
                "ibm59v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 59-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!ELEMENT num EMPTY>\r\n <!ATTLIST num value (one|two) #IMPLIED>\r\n ]>\r\n <test>\r\n<num value = \"one\"></num>\r\nThis is a Positive test\r\nThe attribute values of type Enumeration match one of the Nmtoken tokens in the declaration.\r\n</test>",
                    "output": "<test>&#10;<num value=\"one\"></num>&#10;This is a Positive test&#10;The attribute values of type Enumeration match one of the Nmtoken tokens in the declaration.&#10;</test>"
                }
            },
            "P60": {
                "ibm60v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java (#PCDATA|one|two|three|four)*>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!ELEMENT three EMPTY>\r\n <!ELEMENT four EMPTY>\r\n <!ATTLIST one chapter CDATA #IMPLIED>\r\n <!ATTLIST two chapter CDATA #REQUIRED>\r\n <!ATTLIST three chapter CDATA #FIXED \"JavaBeans\">\r\n <!ATTLIST four chapter CDATA 'defualt'>\r\n ]>\r\n<Java><one chapter=\"Introduction\"/>\r\n <three chapter=\"JavaBeans\"/>\r\n Positive test\r\n DefaultDecl attributes values IMPLIED, REQUIRED, FIXED and default\r\n</Java>",
                    "output": "<Java><one chapter=\"Introduction\"></one>&#10; <three chapter=\"JavaBeans\"></three>&#10; Positive test&#10; DefaultDecl attributes values IMPLIED, REQUIRED, FIXED and default&#10;</Java>"
                },
                "ibm60v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ELEMENT two EMPTY>\r\n <!ATTLIST one chapter CDATA #REQUIRED>\r\n <!ATTLIST two chapter CDATA #REQUIRED>\r\n ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\n<two chapter=\"JavaApplets\"></two>\r\nPositive test. Required attribute. Every occurrence of an element with a \r\n#REQUIRED attribute default declaration gives the value of that attribute\r\n</Java>",
                    "output": "<Java>&#10;<one chapter=\"Introduction\"></one>&#10;<two chapter=\"JavaApplets\"></two>&#10;Positive test. Required attribute. Every occurrence of an element with a &#10;#REQUIRED attribute default declaration gives the value of that attribute&#10;</Java>"
                },
                "ibm60v03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 60-->\r\n<!DOCTYPE Java \r\n [\r\n <!ELEMENT Java ANY>\r\n <!ELEMENT one EMPTY>\r\n <!ATTLIST one chapter CDATA #FIXED \"Introduction\">\r\n  ]>\r\n<Java>\r\n<one chapter=\"Introduction\"></one>\r\nAn attribute has a default value declared with the #FIXED keyword, \r\nand an instances of that attribute is given a value which is exactly \r\nthe same as the default value in the declaration. \r\n</Java>\r\n",
                    "output": "<Java>&#10;<one chapter=\"Introduction\"></one>&#10;An attribute has a default value declared with the #FIXED keyword, &#10;and an instances of that attribute is given a value which is exactly &#10;the same as the default value in the declaration. &#10;</Java>"
                },
                "ibm60v04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- validity test for Production 60-->\r\n<!DOCTYPE test\r\n [\r\n <!ELEMENT test ANY>\r\n <!ELEMENT a EMPTY>\r\n <!ELEMENT b EMPTY>\r\n <!ELEMENT attr EMPTY>\r\n <!ELEMENT nametoken EMPTY>\r\n <!ATTLIST attr value (a|b) \"a\"> \r\n <!ATTLIST nametoken namevalue NMTOKEN \"hello\">\r\n  ]>\r\n<test>\r\nThe default value specified for an attribute meets the \r\nlexical constraints of the declared attribute type.\r\n</test>\r\n\r\n",
                    "output": "<test>&#10;The default value specified for an attribute meets the &#10;lexical constraints of the declared attribute type.&#10;</test>"
                }
            },
            "P61": {
                "ibm61v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 61-->\r\n<!DOCTYPE animal SYSTEM \"ibm61v01.dtd\">\r\n<animal>\r\n <tiger/>\r\n</animal>\r\n ",
                    "output": "<animal>&#10; <tiger></tiger>&#10;</animal>"
                },
                "ibm61v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 61-->\r\n<!DOCTYPE animal SYSTEM \"ibm61v02.dtd\"\r\n[\r\n<!ELEMENT animal EMPTY>\r\n]>\r\n<animal/>\r\n\r\n \r\n",
                    "output": "<animal></animal>"
                }
            },
            "P62": {
                "ibm62v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62v01.dtd\">\r\n<animal>\r\n <tiger/>\r\nPositive test. Test includeSect with pattern1 of p62.\r\nNormal Pattern\r\n</animal>",
                    "output": "<animal>&#10; <tiger></tiger>&#10;Positive test. Test includeSect with pattern1 of p62.&#10;Normal Pattern&#10;</animal>"
                },
                "ibm62v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62v02.dtd\">\r\n<animal>\r\n <tiger/>\r\nPositive test. Test includeSect with pattern2 of p62.\r\nspace included before INCLUDE\r\n</animal>\r\n",
                    "output": "<animal>&#10; <tiger></tiger>&#10;Positive test. Test includeSect with pattern2 of p62.&#10;space included before INCLUDE&#10;</animal>"
                },
                "ibm62v03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62v03.dtd\">\r\n<animal>\r\n <tiger/>\r\nPositive test. Test includeSect with pattern3 of p62.\r\nspace included after INCLUDE\r\n</animal>\r\n",
                    "output": "<animal>&#10; <tiger></tiger>&#10;Positive test. Test includeSect with pattern3 of p62.&#10;space included after INCLUDE&#10;</animal>"
                },
                "ibm62v04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62v04.dtd\">\r\n<animal>\r\n <tiger/>\r\nPositive test. Test includeSect with pattern4 of p62.\r\nspace included before and after INCLUDE\r\n</animal>\r\n",
                    "output": "<animal>&#10; <tiger></tiger>&#10;Positive test. Test includeSect with pattern4 of p62.&#10;space included before and after INCLUDE&#10;</animal>"
                },
                "ibm62v05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 62-->\r\n<!DOCTYPE animal SYSTEM \"ibm62v05.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger EMPTY>\r\n]>\r\n\r\n<animal>\r\n <tiger/>\r\nPositive test. Missing external subset declaration.\r\n</animal>",
                    "output": "<animal>&#10; <tiger></tiger>&#10;Positive test. Missing external subset declaration.&#10;</animal>"
                }
            },
            "P63": {
                "ibm63v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63v01.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"tiger\">\r\nPositive test. Test for IGNORE with pattern 1.\r\n</animal>",
                    "output": "<animal a=\"tiger\">&#10;Positive test. Test for IGNORE with pattern 1.&#10;</animal>"
                },
                "ibm63v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63v02.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"tiger\">\r\nPositive test. Test for IGNORE with pattern 2.\r\n</animal>",
                    "output": "<animal a=\"tiger\">&#10;Positive test. Test for IGNORE with pattern 2.&#10;</animal>"
                },
                "ibm63v03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63v03.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"tiger\">\r\nPositive test. Test for IGNORE with pattern 3.\r\n</animal>",
                    "output": "<animal a=\"tiger\">&#10;Positive test. Test for IGNORE with pattern 3.&#10;</animal>"
                },
                "ibm63v04.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63v04.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"tiger\">\r\nPositive test. Test for IGNORE with pattern 4.\r\n</animal>",
                    "output": "<animal a=\"tiger\">&#10;Positive test. Test for IGNORE with pattern 4.&#10;</animal>"
                },
                "ibm63v05.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 63-->\r\n<!DOCTYPE animal SYSTEM \"ibm63v05.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n<!ELEMENT tiger (#PCDATA)>\r\n<!ATTLIST animal a (tiger) #REQUIRED> \r\n]>\r\n<animal a = \"tiger\">\r\nPositive test. Test for IGNORE with pattern 5.\r\n</animal>",
                    "output": "<animal a=\"tiger\">&#10;Positive test. Test for IGNORE with pattern 5.&#10;</animal>"
                }
            },
            "P64": {
                "ibm64v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 64-->\r\n<!DOCTYPE animal SYSTEM \"ibm64v01.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nPositive Test. Pattern1\r\n</animal>",
                    "output": "<animal>&#10;Positive Test. Pattern1&#10;</animal>"
                },
                "ibm64v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 64-->\r\n<!DOCTYPE animal SYSTEM \"ibm64v02.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nPositive Test. Pattern2\r\n</animal>",
                    "output": "<animal>&#10;Positive Test. Pattern2&#10;</animal>"
                },
                "ibm64v03.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 64-->\r\n<!DOCTYPE animal SYSTEM \"ibm64v03.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nPositive Test. Pattern3\r\n</animal>",
                    "output": "<animal>&#10;Positive Test. Pattern3&#10;</animal>"
                }
            },
            "P65": {
                "ibm65v01.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 65-->\r\n<!DOCTYPE animal SYSTEM \"ibm65v01.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nPositive Test. Pattern1. Empty string.\r\n</animal>",
                    "output": "<animal>&#10;Positive Test. Pattern1. Empty string.&#10;</animal>"
                },
                "ibm65v02.xml": {
                    "input": "<?xml  version=\"1.0\"?>\r\n<!-- syntax test for Production 65-->\r\n<!DOCTYPE animal SYSTEM \"ibm65v02.dtd\"\r\n[\r\n<!ELEMENT animal ANY>\r\n]>\r\n<animal>\r\nPositive Test. Pattern2.\r\n</animal>",
                    "output": "<animal>&#10;Positive Test. Pattern2.&#10;</animal>"
                }
            },
            "P66": {
                "ibm66v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA)>\r\n]>\r\n<root>\r\nTest all valid Charater references for P66:\r\n&#9;&#09;&#0000000009;\r\n&#xA;&#xa;&#x0A;&#x00000000A;\r\n&#x0d;\r\n&#xAB; &#xab; &#xCD; &#xcD; &#xEf; &#xef;\r\n&#67; &#x43; &#x5f;\r\n&#x20; &#xD7A3; &#xAC00;\r\n&#xF900; &#xFFFD;\r\n&#x10000; &#x10FFFF;\r\n</root>\r\n<!--* a valid test for P66 *-->\r\n",
                    "output": "<root>&#10;Test all valid Charater references for P66:&#10;&#9;&#9;&#9;&#10;&#10;&#10;&#10;&#10;&#10;&#13;&#10;« « Í Í ï ï&#10;C C _&#10;  힣 가&#10;豈 �&#10;𐀀 􏿿&#10;</root>"
                }
            },
            "P67": {
                "ibm67v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA)>\r\n  <!ATTLIST root attr CDATA #REQUIRED>\r\n  <!ENTITY ge1 \"xyz\">\r\n]>\r\n<root attr=\"&ge1;&#65;\">\r\n&ge1; &#66;\r\n</root>\r\n<!--* a valid test for P67 *-->\r\n",
                    "output": "<root attr=\"xyzA\">&#10;xyz B&#10;</root>"
                }
            },
            "P68": {
                "ibm68v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root SYSTEM \"ibm68v01.dtd\" [\r\n  <!ELEMENT root (#PCDATA|a)* >\r\n]>\r\n<root>\r\n  pcdata content\r\n  <a attr1=\"xyz\"/>\r\n</root>\r\n<!--* a valid test for P68 VC:Entity Declared *-->\r\n",
                    "output": "<root>&#10;  pcdata content&#10;  <a attr1=\"xyz\"></a>&#10;</root>"
                },
                "ibm68v02.xml": {
                    "input": "<?xml version=\"1.0\" standalone='no'?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA)* >\r\n  <!ENTITY % pe1 SYSTEM \"ibm68v02.ent\">\r\n  %pe1;\r\n]>\r\n<root>\r\n  pcdata content\r\n</root>\r\n<!--* a valid test for P68 VC:Entity Declared *-->\r\n",
                    "output": "<root>&#10;  pcdata content&#10;</root>"
                }
            },
            "P69": {
                "ibm69v01.xml": {
                    "input": "<?xml version=\"1.0\" standalone=\"no\" ?>\r\n<!DOCTYPE root SYSTEM \"ibm69v01.dtd\" [\r\n  <!ELEMENT root (#PCDATA|a)* >\r\n  <!ENTITY % pe1 \"<!-- comment in PE -->\">\r\n  %pe1;\r\n]>\r\n<root>\r\n  pcdata content\r\n  <a attr1=\"xyz\"/>\r\n</root>\r\n<!--* a valid test for P69 VC:Entity Declared *-->\r\n",
                    "output": "<root>&#10;  pcdata content&#10;  <a attr1=\"xyz\"></a>&#10;</root>"
                },
                "ibm69v02.xml": {
                    "input": "<?xml version=\"1.0\" standalone='no'?>\r\n<!DOCTYPE root [\r\n  <!ELEMENT root (#PCDATA)* >\r\n  <!ENTITY % pe1 SYSTEM \"ibm69v02.ent\">\r\n  %pe1;\r\n]>\r\n<root>\r\n  pcdata content\r\n</root>\r\n<!--* a valid test for P69 VC:Entity Declared *-->\r\n",
                    "output": "<root>&#10;  pcdata content&#10;</root>"
                }
            },
            "P70": {
                "ibm70v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n<!--* Test all legal patterns derived from P70-76 *-->\r\n<!ENTITY % pe1 '<!ATTLIST root att2 CDATA \"&ge1;\">'>\r\n<!ENTITY ge1 \"attdefaultvalue\" >\r\n%pe1;\r\n<!NOTATION JPGformat SYSTEM \"JPGFormat\">\r\n<!ENTITY ge2  SYSTEM \"image.jpg\" NDATA JPGformat>\r\n<!ENTITY % pe2 PUBLIC \"-//w3c//any\" \"ibm70v01.ent\" >\r\n%pe2;\r\n]>\r\n<root att2=\"any\" />\r\n<!-- a valid test case: test P70-P76 -->",
                    "output": "<!DOCTYPE root [\n<!NOTATION JPGformat SYSTEM 'JPGFormat'>\n]>\n<root att2=\"any\"></root>"
                }
            },
            "P78": {
                "ibm78v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n\r\n<!--* Test all legal patterns derived from P78 *-->\r\n<!ENTITY epe1 SYSTEM \"ibm78v01.ent\" >\r\n<!ENTITY epe2 SYSTEM \"ibm78v02.ent\" >\r\n<!ENTITY epe3 SYSTEM \"ibm78v03.ent\" >\r\n\r\n]>\r\n<root>&epe1;&epe2;&epe3;</root>\r\n<!-- a valid test case: test P78, P77, P80 -->\r\n",
                    "output": "<root>&#10;anything legal as PCDATA....&#10;N.B. also tested P77 and P80&#10;anything legal as PCDATA....&#10;N.B. also tested P77anything legal as PCDATA....&#10;e.g. 12345678E-33, &quot;hello&quot;</root>"
                }
            },
            "P79": {
                "ibm79v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE book \r\n[\r\n<!ELEMENT book ANY>\r\n<!ATTLIST notebook att CDATA #IMPLIED>\r\n<!ENTITY % epe SYSTEM \"ibm79v01.ent\" >\r\n%epe;\r\n]>\r\n<book><name>XML Handbook</name> This is a book</book>\r\n\r\n<!-- a valid test case: test P79 -->\r\n",
                    "output": "<book><name>XML Handbook</name> This is a book</book>"
                }
            },
            "P82": {
                "ibm82v01.xml": {
                    "input": "<?xml version=\"1.0\"?>\r\n<!DOCTYPE root \r\n[\r\n<!ELEMENT root (#PCDATA)>\r\n<!ATTLIST root att CDATA #IMPLIED>\r\n<!ATTLIST root entatt1 ENTITY #REQUIRED >\r\n\r\n<!--* Test PublicID in P82 *-->\r\n<!NOTATION JPGformat PUBLIC \"-//image//notreal\" >\r\n<!ENTITY unparsed1  SYSTEM \"image.jpg\" NDATA JPGformat>\r\n]>\r\n<root entatt1=\"unparsed1\">test PublicID in P82</root>\r\n<!-- a valid test case: test P82 and P83 -->\r\n",
                    "output": "<!DOCTYPE root [\n<!NOTATION JPGformat PUBLIC '-//image//notreal'>\n]>\n<root entatt1=\"unparsed1\">test PublicID in P82</root>"
                }
            },
            "P85": {
                "ibm85v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\r\n<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n<!-- This test case covers 149 legal character ranges plus\r\n     51 discrete legal characters for production 85. -->\r\n<?NAME_41-A_5A-Z_4d-M_61-a_7A-z_6d-m_0C0-À_0D6-Ö_0cb-Ë_0D8-Ø_0F6-ö_0e7-ç_0F8-ø_0FF-ÿ_0fb-û_100-Ā_131-ı_118-Ę_134-Ĵ_13E-ľ_139-Ĺ_141-Ł_148-ň_144-ń_14A-Ŋ_17E-ž_164-Ť_180-ƀ_1C3-ǃ_1a1-ơ_1CD-Ǎ_1F0-ǰ_1de-Ǟ_1F4-Ǵ_1F5-ǵ_1f4-Ǵ_1FA-Ǻ_217-ȗ_208-Ȉ_250-ɐ_2A8-ʨ_27c-ɼ_2BB-ʻ_2C1-ˁ_2be-ʾ_386-Ά_388-Έ_38A-Ί_389-Ή_38C-Ό_38E-Ύ_3A1-Ρ_397-Η_3A3-Σ_3CE-ώ_3b8-θ_3D0-ϐ_3D6-ϖ_3d3-ϓ_3DA-Ϛ_3DC-Ϝ_3DE-Ϟ_3E0-Ϡ_3E2-Ϣ_3F3-ϳ_3ea-Ϫ_401-Ё_40C-Ќ_406-І_40E-Ў_44F-я_42e-Ю_451-ё_45C-ќ_456-і_45E-ў_481-ҁ_46f-ѯ_490-Ґ_4C4-ӄ_4aa-Ҫ_4C7-Ӈ_4C8-ӈ_4c7-Ӈ_4CB-Ӌ_4CC-ӌ_4cb-Ӌ_4D0-Ӑ_4EB-ӫ_4dd-ӝ_4EE-Ӯ_4F5-ӵ_4f1-ӱ_4F8-Ӹ_4F9-ӹ_4f8-Ӹ_531-Ա_556-Ֆ_543-Ճ_559-ՙ_561-ա_586-ֆ_573-ճ_5D0-א_5EA-ת_5dd-ם_5F0-װ_5F2-ײ_5f1-ױ_621-ء_63A-غ_62d-ح_641-ف_64A-ي_645-م_671-ٱ_6B7-ڷ_694-ڔ_6BA-ں_6BE-ھ_6bc-ڼ_6C0-ۀ_6CE-ێ_6c7-ۇ_6D0-ې_6D3-ۓ_6d1-ۑ_6D5-ە_6E5-ۥ_6E6-ۦ_6e5-ۥ_0905-अ_0939-ह_091f-ट_093D-ऽ_0958-क़_0961-ॡ_095c-ड़_0985-অ_098C-ঌ_0988-ঈ_098F-এ_0990-ঐ_098f-এ_0993-ও_09A8-ন_099d-ঝ_09AA-প_09B0-র_09ad-ভ_09B2-ল_09B6-শ_09B9-হ_09b7-ষ_09DC-ড়_09DD-ঢ়_09dc-ড়_09DF-য়_09E1-ৡ_09e0-ৠ_09F0-ৰ_09F1-ৱ_09f0-ৰ_0A05-ਅ_0A0A-ਊ_0a07-ਇ_0A0F-ਏ_0A10-ਐ_0a0f-ਏ_0A13-ਓ_0A28-ਨ_0a1d-ਝ_0A2A-ਪ_0A30-ਰ_0a2d-ਭ_0A32-ਲ_0A33-ਲ਼_0a32-ਲ_0A35-ਵ_0A36-ਸ਼_0a35-ਵ_0A38-ਸ_0A39-ਹ_0a38-ਸ_0A59-ਖ਼_0A5C-ੜ_0a5a-ਗ਼_0A5E-ਫ਼_0A72-ੲ_0A74-ੴ_0a73-ੳ_0A85-અ_0A8B-ઋ_0a88-ઈ_0A8D-ઍ_0A8F-એ_0A91-ઑ_0a90-ઐ_0A93-ઓ_0AA8-ન_0a9d-ઝ_0AAA-પ_0AB0-ર_0aad-ભ_0AB2-લ_0AB3-ળ_0ab2-લ_0AB5-વ_0AB9-હ_0ab7-ષ_0ABD-ઽ_0AE0-ૠ_0B05-ଅ_0B0C-ଌ_0b08-ଈ_0B0F-ଏ_0B10-ଐ_0b0f-ଏ_0B13-ଓ_0B28-ନ_0b1d-ଝ_0B2A-ପ_0B30-ର_0b2d-ଭ_0B32-ଲ_0B33-ଳ_0b32-ଲ_0B36-ଶ_0B39-ହ_0b37-ଷ_0B3D-ଽ_0B5C-ଡ଼_0B5D-ଢ଼_0b5c-ଡ଼_0B5F-ୟ_0B61-ୡ_0b60-ୠ_0B85-அ_0B8A-ஊ_0b87-இ_0B8E-எ_0B90-ஐ_0b8f-ஏ_0B92-ஒ_0B95-க_0b93-ஓ_0B99-ங_0B9A-ச_0b99-ங_0B9C-ஜ_0B9E-ஞ_0B9F-ட_0b9e-ஞ_0BA3-ண_0BA4-த_0ba3-ண_0BA8-ந_0BAA-ப_0ba9-ன_0BAE-ம_0BB5-வ_0bb1-ற_0BB7-ஷ_0BB9-ஹ_0bb8-ஸ_0C05-అ_0C0C-ఌ_0c08-ఈ_0C0E-ఎ_0C10-ఐ_0c0f-ఏ_0C12-ఒ_0C28-న_0c1d-ఝ_0C2A-ప_0C33-ళ_0c2e-మ_0C35-వ_0C39-హ_0c37-ష_0C60-ౠ_0C61-ౡ_0c60-ౠ_0C85-ಅ_0C8C-ಌ_0c88-ಈ_0C8E-ಎ_0C90-ಐ_0c8f-ಏ_0C92-ಒ_0CA8-ನ_0c9d-ಝ_0CAA-ಪ_0CB3-ಳ_0cae-ಮ_0CB5-ವ_0CB9-ಹ_0cb7-ಷ_0CDE-ೞ_0CE0-ೠ_0CE1-ೡ_0ce0-ೠ_0D05-അ_0D0C-ഌ_0d08-ഈ_0D0E-എ_0D10-ഐ_0d0f-ഏ_0D12-ഒ_0D28-ന_0d1d-ഝ_0D2A-പ_0D39-ഹ_0d31-റ_0D60-ൠ_0D61-ൡ_0d60-ൠ_0E01-ก_0E2E-ฮ_0e17-ท_0E30-ะ_0E32-า_0E33-ำ_0e32-า_0E40-เ_0E45-ๅ_0e42-โ_0E81-ກ_0E82-ຂ_0e81-ກ_0E84-ຄ_0E87-ງ_0E88-ຈ_0e87-ງ_0E8A-ຊ_0E8D-ຍ_0E94-ດ_0E97-ທ_0e95-ຕ_0E99-ນ_0E9F-ຟ_0e9c-ຜ_0EA1-ມ_0EA3-ຣ_0ea2-ຢ_0EA5-ລ_0EA7-ວ_0EAA-ສ_0EAB-ຫ_0eaa-ສ_0EAD-ອ_0EAE-ຮ_0ead-ອ_0EB0-ະ_0EB2-າ_0EB3-ຳ_0eb2-າ_0EBD-ຽ_0EC0-ເ_0EC4-ໄ_0ec2-ໂ_0F40-ཀ_0F47-ཇ_0f43-གྷ_0F49-ཉ_0F69-ཀྵ_0f59-ཙ_10A0-Ⴀ_10C5-Ⴥ_10b2-Ⴒ_10D0-ა_10F6-ჶ_10e3-უ_1100-ᄀ_1102-ᄂ_1103-ᄃ_1102-ᄂ_1105-ᄅ_1107-ᄇ_1106-ᄆ_1109-ᄉ_110B-ᄋ_110C-ᄌ_110b-ᄋ_110E-ᄎ_1112-ᄒ_1110-ᄐ_113C-ᄼ_113E-ᄾ_1140-ᅀ_114C-ᅌ_114E-ᅎ_1150-ᅐ_1154-ᅔ_1155-ᅕ_1154-ᅔ_1159-ᅙ_115F-ᅟ_1161-ᅡ_1160-ᅠ_1163-ᅣ_1165-ᅥ_1167-ᅧ_1169-ᅩ_116D-ᅭ_116E-ᅮ_116d-ᅭ_1172-ᅲ_1173-ᅳ_1172-ᅲ_1175-ᅵ_119E-ᆞ_11A8-ᆨ_11AB-ᆫ_11AE-ᆮ_11AF-ᆯ_11ae-ᆮ_11B7-ᆷ_11B8-ᆸ_11b7-ᆷ_11BA-ᆺ_11BC-ᆼ_11C2-ᇂ_11bf-ᆿ_11EB-ᇫ_11F0-ᇰ_11F9-ᇹ_1E00-Ḁ_1E9B-ẛ_1e4d-ṍ_1EA0-Ạ_1EF9-ỹ_1ecc-Ọ_1F00-ἀ_1F15-ἕ_1f0a-Ἂ_1F18-Ἐ_1F1D-Ἕ_1f1a-Ἒ_1F20-ἠ_1F45-ὅ_1f32-ἲ_1F48-Ὀ_1F4D-Ὅ_1f4a-Ὂ_1F50-ὐ_1F57-ὗ_1f53-ὓ_1F59-Ὑ_1F5B-Ὓ_1F5D-Ὕ_1F5F-Ὗ_1F7D-ώ_1f6e-Ὦ_1F80-ᾀ_1FB4-ᾴ_1f9a-ᾚ_1FB6-ᾶ_1FBC-ᾼ_1fb9-Ᾱ_1FBE-ι_1FC2-ῂ_1FC4-ῄ_1fc3-ῃ_1FC6-ῆ_1FCC-ῌ_1fc9-Έ_1FD0-ῐ_1FD3-ΐ_1fd1-ῑ_1FD6-ῖ_1FDB-Ί_1fd8-Ῐ_1FE0-ῠ_1FEC-Ῥ_1fe6-ῦ_1FF2-ῲ_1FF4-ῴ_1ff3-ῳ_1FF6-ῶ_1FFC-ῼ_1ff9-Ό_2126-Ω_212A-K_212B-Å_212a-K_212E-℮_2180-ↀ_2182-ↂ_2181-ↁ_3041-ぁ_3094-ゔ_306a-な_30A1-ァ_30FA-ヺ_30cd-ネ_3105-ㄅ_312C-ㄬ_3118-ㄘ_AC00-가_D7A3-힣_c1d1-쇑 This is a PI target ?>\r\n]>\r\n<book/>\r\n",
                    "output": "<?NAME_41-A_5A-Z_4d-M_61-a_7A-z_6d-m_0C0-À_0D6-Ö_0cb-Ë_0D8-Ø_0F6-ö_0e7-ç_0F8-ø_0FF-ÿ_0fb-û_100-Ā_131-ı_118-Ę_134-Ĵ_13E-ľ_139-Ĺ_141-Ł_148-ň_144-ń_14A-Ŋ_17E-ž_164-Ť_180-ƀ_1C3-ǃ_1a1-ơ_1CD-Ǎ_1F0-ǰ_1de-Ǟ_1F4-Ǵ_1F5-ǵ_1f4-Ǵ_1FA-Ǻ_217-ȗ_208-Ȉ_250-ɐ_2A8-ʨ_27c-ɼ_2BB-ʻ_2C1-ˁ_2be-ʾ_386-Ά_388-Έ_38A-Ί_389-Ή_38C-Ό_38E-Ύ_3A1-Ρ_397-Η_3A3-Σ_3CE-ώ_3b8-θ_3D0-ϐ_3D6-ϖ_3d3-ϓ_3DA-Ϛ_3DC-Ϝ_3DE-Ϟ_3E0-Ϡ_3E2-Ϣ_3F3-ϳ_3ea-Ϫ_401-Ё_40C-Ќ_406-І_40E-Ў_44F-я_42e-Ю_451-ё_45C-ќ_456-і_45E-ў_481-ҁ_46f-ѯ_490-Ґ_4C4-ӄ_4aa-Ҫ_4C7-Ӈ_4C8-ӈ_4c7-Ӈ_4CB-Ӌ_4CC-ӌ_4cb-Ӌ_4D0-Ӑ_4EB-ӫ_4dd-ӝ_4EE-Ӯ_4F5-ӵ_4f1-ӱ_4F8-Ӹ_4F9-ӹ_4f8-Ӹ_531-Ա_556-Ֆ_543-Ճ_559-ՙ_561-ա_586-ֆ_573-ճ_5D0-א_5EA-ת_5dd-ם_5F0-װ_5F2-ײ_5f1-ױ_621-ء_63A-غ_62d-ح_641-ف_64A-ي_645-م_671-ٱ_6B7-ڷ_694-ڔ_6BA-ں_6BE-ھ_6bc-ڼ_6C0-ۀ_6CE-ێ_6c7-ۇ_6D0-ې_6D3-ۓ_6d1-ۑ_6D5-ە_6E5-ۥ_6E6-ۦ_6e5-ۥ_0905-अ_0939-ह_091f-ट_093D-ऽ_0958-क़_0961-ॡ_095c-ड़_0985-অ_098C-ঌ_0988-ঈ_098F-এ_0990-ঐ_098f-এ_0993-ও_09A8-ন_099d-ঝ_09AA-প_09B0-র_09ad-ভ_09B2-ল_09B6-শ_09B9-হ_09b7-ষ_09DC-ড়_09DD-ঢ়_09dc-ড়_09DF-য়_09E1-ৡ_09e0-ৠ_09F0-ৰ_09F1-ৱ_09f0-ৰ_0A05-ਅ_0A0A-ਊ_0a07-ਇ_0A0F-ਏ_0A10-ਐ_0a0f-ਏ_0A13-ਓ_0A28-ਨ_0a1d-ਝ_0A2A-ਪ_0A30-ਰ_0a2d-ਭ_0A32-ਲ_0A33-ਲ਼_0a32-ਲ_0A35-ਵ_0A36-ਸ਼_0a35-ਵ_0A38-ਸ_0A39-ਹ_0a38-ਸ_0A59-ਖ਼_0A5C-ੜ_0a5a-ਗ਼_0A5E-ਫ਼_0A72-ੲ_0A74-ੴ_0a73-ੳ_0A85-અ_0A8B-ઋ_0a88-ઈ_0A8D-ઍ_0A8F-એ_0A91-ઑ_0a90-ઐ_0A93-ઓ_0AA8-ન_0a9d-ઝ_0AAA-પ_0AB0-ર_0aad-ભ_0AB2-લ_0AB3-ળ_0ab2-લ_0AB5-વ_0AB9-હ_0ab7-ષ_0ABD-ઽ_0AE0-ૠ_0B05-ଅ_0B0C-ଌ_0b08-ଈ_0B0F-ଏ_0B10-ଐ_0b0f-ଏ_0B13-ଓ_0B28-ନ_0b1d-ଝ_0B2A-ପ_0B30-ର_0b2d-ଭ_0B32-ଲ_0B33-ଳ_0b32-ଲ_0B36-ଶ_0B39-ହ_0b37-ଷ_0B3D-ଽ_0B5C-ଡ଼_0B5D-ଢ଼_0b5c-ଡ଼_0B5F-ୟ_0B61-ୡ_0b60-ୠ_0B85-அ_0B8A-ஊ_0b87-இ_0B8E-எ_0B90-ஐ_0b8f-ஏ_0B92-ஒ_0B95-க_0b93-ஓ_0B99-ங_0B9A-ச_0b99-ங_0B9C-ஜ_0B9E-ஞ_0B9F-ட_0b9e-ஞ_0BA3-ண_0BA4-த_0ba3-ண_0BA8-ந_0BAA-ப_0ba9-ன_0BAE-ம_0BB5-வ_0bb1-ற_0BB7-ஷ_0BB9-ஹ_0bb8-ஸ_0C05-అ_0C0C-ఌ_0c08-ఈ_0C0E-ఎ_0C10-ఐ_0c0f-ఏ_0C12-ఒ_0C28-న_0c1d-ఝ_0C2A-ప_0C33-ళ_0c2e-మ_0C35-వ_0C39-హ_0c37-ష_0C60-ౠ_0C61-ౡ_0c60-ౠ_0C85-ಅ_0C8C-ಌ_0c88-ಈ_0C8E-ಎ_0C90-ಐ_0c8f-ಏ_0C92-ಒ_0CA8-ನ_0c9d-ಝ_0CAA-ಪ_0CB3-ಳ_0cae-ಮ_0CB5-ವ_0CB9-ಹ_0cb7-ಷ_0CDE-ೞ_0CE0-ೠ_0CE1-ೡ_0ce0-ೠ_0D05-അ_0D0C-ഌ_0d08-ഈ_0D0E-എ_0D10-ഐ_0d0f-ഏ_0D12-ഒ_0D28-ന_0d1d-ഝ_0D2A-പ_0D39-ഹ_0d31-റ_0D60-ൠ_0D61-ൡ_0d60-ൠ_0E01-ก_0E2E-ฮ_0e17-ท_0E30-ะ_0E32-า_0E33-ำ_0e32-า_0E40-เ_0E45-ๅ_0e42-โ_0E81-ກ_0E82-ຂ_0e81-ກ_0E84-ຄ_0E87-ງ_0E88-ຈ_0e87-ງ_0E8A-ຊ_0E8D-ຍ_0E94-ດ_0E97-ທ_0e95-ຕ_0E99-ນ_0E9F-ຟ_0e9c-ຜ_0EA1-ມ_0EA3-ຣ_0ea2-ຢ_0EA5-ລ_0EA7-ວ_0EAA-ສ_0EAB-ຫ_0eaa-ສ_0EAD-ອ_0EAE-ຮ_0ead-ອ_0EB0-ະ_0EB2-າ_0EB3-ຳ_0eb2-າ_0EBD-ຽ_0EC0-ເ_0EC4-ໄ_0ec2-ໂ_0F40-ཀ_0F47-ཇ_0f43-གྷ_0F49-ཉ_0F69-ཀྵ_0f59-ཙ_10A0-Ⴀ_10C5-Ⴥ_10b2-Ⴒ_10D0-ა_10F6-ჶ_10e3-უ_1100-ᄀ_1102-ᄂ_1103-ᄃ_1102-ᄂ_1105-ᄅ_1107-ᄇ_1106-ᄆ_1109-ᄉ_110B-ᄋ_110C-ᄌ_110b-ᄋ_110E-ᄎ_1112-ᄒ_1110-ᄐ_113C-ᄼ_113E-ᄾ_1140-ᅀ_114C-ᅌ_114E-ᅎ_1150-ᅐ_1154-ᅔ_1155-ᅕ_1154-ᅔ_1159-ᅙ_115F-ᅟ_1161-ᅡ_1160-ᅠ_1163-ᅣ_1165-ᅥ_1167-ᅧ_1169-ᅩ_116D-ᅭ_116E-ᅮ_116d-ᅭ_1172-ᅲ_1173-ᅳ_1172-ᅲ_1175-ᅵ_119E-ᆞ_11A8-ᆨ_11AB-ᆫ_11AE-ᆮ_11AF-ᆯ_11ae-ᆮ_11B7-ᆷ_11B8-ᆸ_11b7-ᆷ_11BA-ᆺ_11BC-ᆼ_11C2-ᇂ_11bf-ᆿ_11EB-ᇫ_11F0-ᇰ_11F9-ᇹ_1E00-Ḁ_1E9B-ẛ_1e4d-ṍ_1EA0-Ạ_1EF9-ỹ_1ecc-Ọ_1F00-ἀ_1F15-ἕ_1f0a-Ἂ_1F18-Ἐ_1F1D-Ἕ_1f1a-Ἒ_1F20-ἠ_1F45-ὅ_1f32-ἲ_1F48-Ὀ_1F4D-Ὅ_1f4a-Ὂ_1F50-ὐ_1F57-ὗ_1f53-ὓ_1F59-Ὑ_1F5B-Ὓ_1F5D-Ὕ_1F5F-Ὗ_1F7D-ώ_1f6e-Ὦ_1F80-ᾀ_1FB4-ᾴ_1f9a-ᾚ_1FB6-ᾶ_1FBC-ᾼ_1fb9-Ᾱ_1FBE-ι_1FC2-ῂ_1FC4-ῄ_1fc3-ῃ_1FC6-ῆ_1FCC-ῌ_1fc9-Έ_1FD0-ῐ_1FD3-ΐ_1fd1-ῑ_1FD6-ῖ_1FDB-Ί_1fd8-Ῐ_1FE0-ῠ_1FEC-Ῥ_1fe6-ῦ_1FF2-ῲ_1FF4-ῴ_1ff3-ῳ_1FF6-ῶ_1FFC-ῼ_1ff9-Ό_2126-Ω_212A-K_212B-Å_212a-K_212E-℮_2180-ↀ_2182-ↂ_2181-ↁ_3041-ぁ_3094-ゔ_306a-な_30A1-ァ_30FA-ヺ_30cd-ネ_3105-ㄅ_312C-ㄬ_3118-ㄘ_AC00-가_D7A3-힣_c1d1-쇑 This is a PI target ?><book></book>"
                }
            },
            "P86": {
                "ibm86v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\r\n<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n<!-- This test case covers 2 legal character ranges plus\r\n     1 discrete legal characters for production 86. -->\r\n<?NAME_4E00-一_9FA5-龥_76d2-盒_3007-〇_3021-〡_3029-〩_3025-〥 This is a PI target ?>\r\n]>\r\n<book/>\r\n",
                    "output": "<?NAME_4E00-一_9FA5-龥_76d2-盒_3007-〇_3021-〡_3029-〩_3025-〥 This is a PI target ?><book></book>"
                }
            },
            "P87": {
                "ibm87v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\r\n<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n<!-- This test case covers 65 legal character ranges plus\r\n     30 discrete legal characters for production 87. -->\r\n<?NAME_300-̀_345-ͅ_322-̢_360-͠_361-͡_360-͠_483-҃_486-҆_484-҄_591-֑_5A1-֡_599-֙_5A3-֣_5B9-ֹ_5ae-֮_5BB-ֻ_5BD-ֽ_5bc-ּ_5BF-ֿ_5C1-ׁ_5C2-ׂ_5c1-ׁ_5C4-ׄ_64B-ً_652-ْ_64e-َ_670-ٰ_6D6-ۖ_6DC-ۜ_6d9-ۙ_6DD-۝_6DF-۟_6de-۞_6E0-۠_6E4-ۤ_6e2-ۢ_6E7-ۧ_6E8-ۨ_6e7-ۧ_6EA-۪_6ED-ۭ_6eb-۫_0901-ँ_0903-ः_0902-ं_093C-़_093E-ा_094C-ौ_0945-ॅ_094D-्_0951-॑_0954-॔_0952-॒_0962-ॢ_0963-ॣ_0962-ॢ_0981-ঁ_0983-ঃ_0982-ং_09BC-়_09BE-া_09BF-ি_09C0-ী_09C4-ৄ_09c2-ূ_09C7-ে_09C8-ৈ_09c7-ে_09CB-ো_09CD-্_09cc-ৌ_09D7-ৗ_09E2-ৢ_09E3-ৣ_09e2-ৢ_0A02-ਂ_0A3C-਼_0A3E-ਾ_0A3F-ਿ_0A40-ੀ_0A42-ੂ_0a41-ੁ_0A47-ੇ_0A48-ੈ_0a47-ੇ_0A4B-ੋ_0A4D-੍_0a4c-ੌ_0A70-ੰ_0A71-ੱ_0a70-ੰ_0A81-ઁ_0A83-ઃ_0a82-ં_0ABC-઼_0ABE-ા_0AC5-ૅ_0ac1-ુ_0AC7-ે_0AC9-ૉ_0ac8-ૈ_0ACB-ો_0ACD-્_0acc-ૌ_0B01-ଁ_0B03-ଃ_0b02-ଂ_0B3C-଼_0B3E-ା_0B43-ୃ_0b40-ୀ_0B47-େ_0B48-ୈ_0b47-େ_0B4B-ୋ_0B4D-୍_0b4c-ୌ_0B56-ୖ_0B57-ୗ_0b56-ୖ_0B82-ஂ_0B83-ஃ_0b82-ஂ_0BBE-ா_0BC2-ூ_0bc0-ீ_0BC6-ெ_0BC8-ை_0bc7-ே_0BCA-ொ_0BCD-்_0bcb-ோ_0BD7-ௗ_0C01-ఁ_0C03-ః_0c02-ం_0C3E-ా_0C44-ౄ_0c41-ు_0C46-ె_0C48-ై_0c47-ే_0C4A-ొ_0C4D-్_0c4b-ో_0C55-ౕ_0C56-ౖ_0c55-ౕ_0C82-ಂ_0C83-ಃ_0c82-ಂ_0CBE-ಾ_0CC4-ೄ_0cc1-ು_0CC6-ೆ_0CC8-ೈ_0cc7-ೇ_0CCA-ೊ_0CCD-್_0ccb-ೋ_0CD5-ೕ_0CD6-ೖ_0cd5-ೕ_0D02-ം_0D03-ഃ_0d02-ം_0D3E-ാ_0D43-ൃ_0d40-ീ_0D46-െ_0D48-ൈ_0d47-േ_0D4A-ൊ_0D4D-്_0d4b-ോ_0D57-ൗ_0E31-ั_0E34-ิ_0E3A-ฺ_0e37-ื_0E47-็_0E4E-๎_0e4a-๊_0EB1-ັ_0EB4-ິ_0EB9-ູ_0eb6-ຶ_0EBB-ົ_0EBC-ຼ_0ebb-ົ_0EC8-່_0ECD-ໍ_0eca-໊_0F18-༘_0F19-༙_0f18-༘_0F35-༵_0F37-༷_0F39-༹_0F3E-༾_0F3F-༿_0F71-ཱ_0F84-྄_0f7a-ེ_0F86-྆_0F8B-ྋ_0f88-ྈ_0F90-ྐ_0F95-ྕ_0f92-ྒ_0F97-ྗ_0F99-ྙ_0FAD-ྭ_0fa3-ྣ_0FB1-ྱ_0FB7-ྷ_0fb4-ྴ_0FB9-ྐྵ_20D0-⃐_20DC-⃜_20d6-⃖_20E1-⃡_302A-〪_302F-〯_302c-〬_3099-゙_309A-゚ This is a PI target ?>\r\n]>\r\n<book/>\r\n",
                    "output": "<?NAME_300-̀_345-ͅ_322-̢_360-͠_361-͡_360-͠_483-҃_486-҆_484-҄_591-֑_5A1-֡_599-֙_5A3-֣_5B9-ֹ_5ae-֮_5BB-ֻ_5BD-ֽ_5bc-ּ_5BF-ֿ_5C1-ׁ_5C2-ׂ_5c1-ׁ_5C4-ׄ_64B-ً_652-ْ_64e-َ_670-ٰ_6D6-ۖ_6DC-ۜ_6d9-ۙ_6DD-۝_6DF-۟_6de-۞_6E0-۠_6E4-ۤ_6e2-ۢ_6E7-ۧ_6E8-ۨ_6e7-ۧ_6EA-۪_6ED-ۭ_6eb-۫_0901-ँ_0903-ः_0902-ं_093C-़_093E-ा_094C-ौ_0945-ॅ_094D-्_0951-॑_0954-॔_0952-॒_0962-ॢ_0963-ॣ_0962-ॢ_0981-ঁ_0983-ঃ_0982-ং_09BC-়_09BE-া_09BF-ি_09C0-ী_09C4-ৄ_09c2-ূ_09C7-ে_09C8-ৈ_09c7-ে_09CB-ো_09CD-্_09cc-ৌ_09D7-ৗ_09E2-ৢ_09E3-ৣ_09e2-ৢ_0A02-ਂ_0A3C-਼_0A3E-ਾ_0A3F-ਿ_0A40-ੀ_0A42-ੂ_0a41-ੁ_0A47-ੇ_0A48-ੈ_0a47-ੇ_0A4B-ੋ_0A4D-੍_0a4c-ੌ_0A70-ੰ_0A71-ੱ_0a70-ੰ_0A81-ઁ_0A83-ઃ_0a82-ં_0ABC-઼_0ABE-ા_0AC5-ૅ_0ac1-ુ_0AC7-ે_0AC9-ૉ_0ac8-ૈ_0ACB-ો_0ACD-્_0acc-ૌ_0B01-ଁ_0B03-ଃ_0b02-ଂ_0B3C-଼_0B3E-ା_0B43-ୃ_0b40-ୀ_0B47-େ_0B48-ୈ_0b47-େ_0B4B-ୋ_0B4D-୍_0b4c-ୌ_0B56-ୖ_0B57-ୗ_0b56-ୖ_0B82-ஂ_0B83-ஃ_0b82-ஂ_0BBE-ா_0BC2-ூ_0bc0-ீ_0BC6-ெ_0BC8-ை_0bc7-ே_0BCA-ொ_0BCD-்_0bcb-ோ_0BD7-ௗ_0C01-ఁ_0C03-ః_0c02-ం_0C3E-ా_0C44-ౄ_0c41-ు_0C46-ె_0C48-ై_0c47-ే_0C4A-ొ_0C4D-్_0c4b-ో_0C55-ౕ_0C56-ౖ_0c55-ౕ_0C82-ಂ_0C83-ಃ_0c82-ಂ_0CBE-ಾ_0CC4-ೄ_0cc1-ು_0CC6-ೆ_0CC8-ೈ_0cc7-ೇ_0CCA-ೊ_0CCD-್_0ccb-ೋ_0CD5-ೕ_0CD6-ೖ_0cd5-ೕ_0D02-ം_0D03-ഃ_0d02-ം_0D3E-ാ_0D43-ൃ_0d40-ീ_0D46-െ_0D48-ൈ_0d47-േ_0D4A-ൊ_0D4D-്_0d4b-ോ_0D57-ൗ_0E31-ั_0E34-ิ_0E3A-ฺ_0e37-ื_0E47-็_0E4E-๎_0e4a-๊_0EB1-ັ_0EB4-ິ_0EB9-ູ_0eb6-ຶ_0EBB-ົ_0EBC-ຼ_0ebb-ົ_0EC8-່_0ECD-ໍ_0eca-໊_0F18-༘_0F19-༙_0f18-༘_0F35-༵_0F37-༷_0F39-༹_0F3E-༾_0F3F-༿_0F71-ཱ_0F84-྄_0f7a-ེ_0F86-྆_0F8B-ྋ_0f88-ྈ_0F90-ྐ_0F95-ྕ_0f92-ྒ_0F97-ྗ_0F99-ྙ_0FAD-ྭ_0fa3-ྣ_0FB1-ྱ_0FB7-ྷ_0fb4-ྴ_0FB9-ྐྵ_20D0-⃐_20DC-⃜_20d6-⃖_20E1-⃡_302A-〪_302F-〯_302c-〬_3099-゙_309A-゚ This is a PI target ?><book></book>"
                }
            },
            "P88": {
                "ibm88v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\r\n<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n<!-- This test case covers 15 legal character ranges plus\r\n     0 discrete legal characters for production 88. -->\r\n<?NAME_30-0_39-9_34-4_660-٠_669-٩_664-٤_6F0-۰_6F9-۹_6f4-۴_0966-०_096F-९_096a-४_09E6-০_09EF-৯_09ea-৪_0A66-੦_0A6F-੯_0a6a-੪_0AE6-૦_0AEF-૯_0aea-૪_0B66-୦_0B6F-୯_0b6a-୪_0BE7-௧_0BEF-௯_0beb-௫_0C66-౦_0C6F-౯_0c6a-౪_0CE6-೦_0CEF-೯_0cea-೪_0D66-൦_0D6F-൯_0d6a-൪_0E50-๐_0E59-๙_0e54-๔_0ED0-໐_0ED9-໙_0ed4-໔_0F20-༠_0F29-༩_0f24-༤ This is a PI target ?>\r\n]>\r\n<book/>\r\n",
                    "output": "<?NAME_30-0_39-9_34-4_660-٠_669-٩_664-٤_6F0-۰_6F9-۹_6f4-۴_0966-०_096F-९_096a-४_09E6-০_09EF-৯_09ea-৪_0A66-੦_0A6F-੯_0a6a-੪_0AE6-૦_0AEF-૯_0aea-૪_0B66-୦_0B6F-୯_0b6a-୪_0BE7-௧_0BEF-௯_0beb-௫_0C66-౦_0C6F-౯_0c6a-౪_0CE6-೦_0CEF-೯_0cea-೪_0D66-൦_0D6F-൯_0d6a-൪_0E50-๐_0E59-๙_0e54-๔_0ED0-໐_0ED9-໙_0ed4-໔_0F20-༠_0F29-༩_0f24-༤ This is a PI target ?><book></book>"
                }
            },
            "P89": {
                "ibm89v01.xml": {
                    "input": "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\r\n<!DOCTYPE book [\r\n<!ELEMENT book ANY>\r\n<!-- This test case covers 3 legal character ranges plus\r\n     8 discrete legal characters for production 89. -->\r\n<?NAME_0B7-·_2D0-ː_2D1-ˑ_387-·_640-ـ_0E46-ๆ_0EC6-ໆ_3005-々_3031-〱_3035-〵_3033-〳_309D-ゝ_309E-ゞ_309d-ゝ_30FC-ー_30FE-ヾ_30fd-ヽ This is a PI target ?>\r\n]>\r\n<book/>\r\n",
                    "output": "<?NAME_0B7-·_2D0-ː_2D1-ˑ_387-·_640-ـ_0E46-ๆ_0EC6-ໆ_3005-々_3031-〱_3035-〵_3033-〳_309D-ゝ_309E-ゞ_309d-ゝ_30FC-ー_30FE-ヾ_30fd-ヽ This is a PI target ?><book></book>"
                }
            }
        },
        "resources": {
            "P01": {},
            "P02": {},
            "P03": {},
            "P09": {
                "ibm09v03.dtd": "<!ELEMENT student (#PCDATA)> \r\n<!-- testing entity value with PEReference -->\r\n \t<!ENTITY % FullName \"first , last\">\r\n\t<!ENTITY Name \"%FullName;\">",
                "student.dtd": "<?xml encoding=\"utf-8\"?>\r\n<!-- student.dtd -->\r\n<!ENTITY combine \"My Name is %FullName; and my age is &Age; Again %FullName; %FullName; and my status is \r\n\t\t&Status; &Status; and %FullName; &Age; %FullName; &Status; That is all.\">\r\n"
            },
            "P10": {},
            "P11": {
                "student.dtd": "<?xml encoding=\"utf-8\"?>\r\n<!-- student.dtd -->\r\n<!ELEMENT student (#PCDATA)> \r\n"
            },
            "P12": {
                "student.dtd": "<?xml encoding=\"utf-8\"?>\r\n<!-- student.dtd -->\r\n<!ELEMENT student (#PCDATA)> \r\n"
            },
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
                "ibm28v02.dtd": "<!ELEMENT animal (cat|tiger|leopard)+>\r\n"
            },
            "P29": {},
            "P30": {
                "ibm30v01.dtd": "<!ELEMENT animal EMPTY>\r\n",
                "ibm30v02.dtd": "<?xml version='1.0' encoding='UTF-8'?>\r\n<!ELEMENT animal EMPTY>\r\n"
            },
            "P31": {
                "ibm31v01.dtd": "<?xml version='1.0' encoding='UTF-8'?>\r\n<![INCLUDE[\r\n<!ENTITY % rootElement \"<!ELEMENT animal ANY>\">\r\n]]>\r\n%rootElement;\r\n\r\n<!-- Following is a makupdecl -->\r\n<!ENTITY % make_tiger_element \"<!ELEMENT tiger EMPTY>\">\r\n%make_tiger_element;\r\n\r\n<![IGNORE[\r\n<!ELEMENT animal EMPTY>\r\n]]>\r\n\r\n\r\n"
            },
            "P32": {
                "ibm32v01.dtd": "<!ELEMENT animal EMPTY>\r\n<!ATTLIST animal color CDATA #FIXED \"yellow\">",
                "ibm32v02.dtd": "<!ELEMENT animal (#PCDATA)>\r\n<!ENTITY animal_content \"This is a yellow tiger\">",
                "ibm32v03.dtd": "<!ELEMENT animal EMPTY>\r\n<!ATTLIST animal class CDATA #FIXED \"&#41;\">",
                "ibm32v04.dtd": "<!ELEMENT animal (#PCDATA|a)* >\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST animal xml:space (default|preserve) 'preserve'>"
            },
            "P33": {},
            "P34": {},
            "P35": {},
            "P36": {},
            "P37": {},
            "P38": {},
            "P39": {},
            "P40": {},
            "P41": {},
            "P42": {},
            "P43": {},
            "P44": {},
            "P45": {},
            "P47": {},
            "P49": {
                "ibm49v01.dtd": "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!ELEMENT a EMPTY>\r\n<!ELEMENT b (#PCDATA|c)* >\r\n<!ELEMENT c ANY>\r\n\r\n<!--* PE replace Text have both parentheses *-->\r\n<!ENTITY % choice1 \"(a|b|c)\">\r\n<!ELEMENT child1 (a ,%choice1;,c )>\r\n<!--* Another legal PE replace Text *--> \r\n<!ENTITY % choice2 \"a|b\">\r\n<!ELEMENT child2 (%choice2;|c) >\r\n\r\n\r\n"
            },
            "P50": {
                "ibm50v01.dtd": "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!ELEMENT a EMPTY>\r\n<!ELEMENT b (#PCDATA|c)* >\r\n<!ELEMENT c ANY>\r\n\r\n<!--* PE replace Text have both parentheses *-->\r\n<!ENTITY % seq1 \"(a,b,c)\">\r\n<!ELEMENT child1 %seq1; >\r\n<!--* Another legal PE replace Text *--> \r\n<!ENTITY % seq2 \"a,b\">\r\n<!ELEMENT child2 (%seq2;,c) >\r\n\r\n\r\n"
            },
            "P51": {
                "ibm51v02.dtd": "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n  <!--* PEs are properly nested *-->\r\n  <!ELEMENT a (#PCDATA)* >\r\n  <!ELEMENT b (#PCDATA) >\r\n  <!ELEMENT c ( #PCDATA)*>\r\n\r\n  <!ENTITY % mixed0 \"(#PCDATA|c)*\" >\r\n  <!ENTITY % mixed1 \"%mixed0;\">\r\n  <!ELEMENT d %mixed1; >\r\n  \r\n  <!ENTITY % mixed1.5 \"c| b\" > \r\n  <!ELEMENT e (#PCDATA| %mixed1.5; |a)* >\r\n\r\n  <!ELEMENT f (#PCDATA| c)* >\r\n  <!ELEMENT g ( #PCDATA) >\r\n  <!ELEMENT h (#PCDATA )>\r\n\r\n  <!ENTITY % mixed2 \"( #PCDATA )\">\r\n  <!ELEMENT i %mixed2; >\r\n\r\n"
            },
            "P52": {},
            "P54": {},
            "P55": {},
            "P56": {},
            "P57": {},
            "P58": {},
            "P59": {},
            "P60": {},
            "P61": {
                "ibm61v01.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 61-->\r\n<![INCLUDE[\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n",
                "ibm61v02.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 61-->\r\n<![IGNORE[\r\n<!ELEMENT animal ANY>\r\n]]>"
            },
            "P62": {
                "ibm62v01.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![INCLUDE[\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n<!--positive test with pattern1 for P62-->",
                "ibm62v02.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![ INCLUDE[\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n<!--positive test with pattern2 (space included prior to INCLUDE) for P62-->",
                "ibm62v03.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![INCLUDE [\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n<!--positive test with pattern3 (space included after INCLUDE) for P62-->",
                "ibm62v04.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![ INCLUDE [\r\n<!ELEMENT tiger EMPTY>\r\n<!ELEMENT animal ANY>\r\n]]>\r\n\r\n<!--positive test with pattern4 (space included before and after INCLUDE) for P62-->",
                "ibm62v05.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 62-->\r\n<![INCLUDE[\r\n]]>\r\n\r\n<!--Positive test with pattern5 of P62-->\r\n<!--Missing external subset declaration which is o.k.-->"
            },
            "P63": {
                "ibm63v01.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![IGNORE[\r\n]]>\r\n<!--Positive test with pattern1 of P63-->\r\n<!-- Positive test. Test for IGNORE with pattern 1. -->",
                "ibm63v02.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![ IGNORE[\r\n]]>\r\n<!--Positive test with pattern2 of P63-->\r\n<!-- Positive test. Test for IGNORE with pattern 2. -->",
                "ibm63v03.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![IGNORE [\r\n]]>\r\n<!--Positive test with pattern3 of P63-->\r\n<!-- Positive test. Test for IGNORE with pattern 3. -->",
                "ibm63v04.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![IGNORE[\r\n<!ELEMENT animal EMPTY>\r\n<!ELEMENT tiger EMPTY>\r\n]]>\r\n<!--Positive test with pattern4 of P63-->\r\n<!-- Positive test. Test for IGNORE with pattern 4. -->",
                "ibm63v05.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!-- DTD for Production 63-->\r\n<![ IGNORE [\r\n<!ELEMENT animal EMPTY>\r\n<!ELEMENT tiger EMPTY>\r\n]]>\r\n<!--Positive test with pattern5 of P63-->\r\n<!-- Positive test. Test for IGNORE with pattern 5(spaces extra) -->"
            },
            "P64": {
                "ibm64v01.dtd": "<!--dtd for production 64-->\r\n<!ELEMENT doc EMPTY>\r\n<![IGNORE[\r\nEverything is ignored within an ignored section, except the\r\nsub-section delimiters '<![' and ']]>'.  These must be balanced\r\n<!ok\r\n]]>\r\n<!--positive test. Pattern 1-->\r\n",
                "ibm64v02.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!--dtd for production 64-->\r\n<![IGNORE[\r\nEverything is ignored within an ignored section, except the\r\nsub-section delimiters '<![' and ']]>'.  These must be balanced\r\n<![\r\n<!ELEMENT animal EMPTY>\r\n]]>\r\n]]>\r\n<!--Positive test. Pattern2.-->\r\n",
                "ibm64v03.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!--dtd for production 64-->\r\n<![IGNORE[\r\nbegin\r\nEverything is ignored within an ignored section, except the\r\nsub-section delimiters '<![' and ']]>'.  These must be balanced\r\n<![\r\n<!ELEMENT animal EMPTY>\r\n]]>\r\nnesting\r\n<![\r\n<!ELEMENT tiger (#PCDATA)>\r\n]]>\r\nnesting again\r\n<![\r\n<!ELEMENT abc ANY>\r\n]]>\r\nend\r\n]]>\r\n<!--Positive test. Pattern3.-->\r\n"
            },
            "P65": {
                "ibm65v01.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!--dtd for production 65-->\r\n<![IGNORE[\r\n\r\n<![\r\n<!ELEMENT animal EMPTY>\r\n]]>\r\n\r\n]]>\r\n<!--Positive test. Pattern1(Empty string)-->",
                "ibm65v02.dtd": "<?xml  version=\"1.0\" encoding='UTF-8'?>\r\n<!--dtd for production 65-->\r\n<![IGNORE[\r\nthis is some stringwithout brackets\r\n<![\r\n<!ELEMENT animal EMPTY>\r\n]]>\r\nthis is another string without brackets\r\n]]>\r\n<!--Positive test. Pattern2-->"
            },
            "P66": {},
            "P67": {},
            "P68": {
                "ibm68v01.dtd": "<!ENTITY ge1 \"abcdef\">\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA \"&ge1;\">\r\n\r\n",
                "ibm68v02.ent": "<!ENTITY ge1 \"abcdef\">\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA \"&ge1;\">\r\n"
            },
            "P69": {
                "ibm69v01.dtd": "<!ENTITY ge1 \"abcdef\">\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA \"&ge1;\">\r\n%pe1;\r\n",
                "ibm69v02.ent": "<!ENTITY ge1 \"abcdef\">\r\n<!ELEMENT a EMPTY>\r\n<!ATTLIST a attr1 CDATA \"&ge1;\">\r\n<!ENTITY % epe1 \"<!-- comment in PE -->\">\r\n%epe1;\r\n\r\n"
            },
            "P70": {
                "ibm70v01.ent": "<!-- comment !-->"
            },
            "P78": {
                "ibm78v01.ent": "<?xml encoding='utf-8'?>\r\nanything legal as PCDATA....\r\nN.B. also tested P77 and P80",
                "ibm78v02.ent": "<?xml encoding=\"utf-8\"?>\r\nanything legal as PCDATA....\r\nN.B. also tested P77",
                "ibm78v03.ent": "anything legal as PCDATA....\r\ne.g. 12345678E-33, \"hello\""
            },
            "P79": {
                "ibm79v01.ent": "<!ELEMENT name (#PCDATA)>\r\n<!ELEMENT  notebook (#PCDATA)>"
            },
            "P82": {},
            "P85": {},
            "P86": {},
            "P87": {},
            "P88": {},
            "P89": {}
        }
    }
}
export default testData;

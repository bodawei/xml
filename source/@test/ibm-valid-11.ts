const testData = {
    "ibm": {
        "tests": {
            "P02": {},
            "P03": {
                "ibm03v01.xml": {
                    "input": "<?xml version=\"1.1\"?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc (#PCDATA)>\r\n<!ENTITY e SYSTEM \"ibm03v01.ent\">\r\n]>\r\n<doc>&e;</doc>\r\n",
                    "output": "<?xml version=\"1.1\"?><doc>Data&#10;</doc>"
                },
                "ibm03v02.xml": {
                    "input": "<?xml version=\"1.1\"?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc (#PCDATA)>\r\n<!ENTITY e SYSTEM \"ibm03v02.ent\">\r\n]>\r\n<doc>&e;</doc>\r\n",
                    "output": "<?xml version=\"1.1\"?><doc>Data&#10;</doc>"
                },
                "ibm03v03.xml": {
                    "input": "<?xml version=\"1.1\"?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc (#PCDATA)>\r\n<!ENTITY e SYSTEM \"ibm03v03.ent\">\r\n]>\r\n<doc>&e;</doc>\r\n",
                    "output": "<?xml version=\"1.1\"?><doc>&#10;</doc>"
                },
                "ibm03v04.xml": {
                    "input": "<?xml version=\"1.1\"?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc (#PCDATA)>\r\n<!ENTITY e SYSTEM \"ibm03v04.ent\">\r\n]>\r\n<doc>&e;</doc>\r\n",
                    "output": "<?xml version=\"1.1\"?><doc>&#10;</doc>"
                },
                "ibm03v05.xml": {
                    "input": "<?xml version=\"1.1\"?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc (#PCDATA)>\r\n<!ENTITY e \"\r\">\r\n<!ATTLIST doc a CDATA #IMPLIED>\r\n]>\r\n<doc>x&e;y</doc>",
                    "output": "<?xml version=\"1.1\"?><doc>x&#10;y</doc>"
                },
                "ibm03v06.xml": {
                    "input": "<?xml version=\"1.1\"?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc (#PCDATA)>\r\n<!ENTITY e \"\">\r\n<!ATTLIST doc a CDATA #IMPLIED>\r\n]>\r\n<doc>x&e;y</doc>",
                    "output": "<?xml version=\"1.1\"?><doc>x&#10;y</doc>"
                },
                "ibm03v08.xml": {
                    "input": "<?xml version=\"1.1\" \n\t?>\n<!DOCTYPE doc [\n<!ELEMENT doc (#PCDATA)>\n<!ATTLIST doc a CDATA #IMPLIED>\n]>\n<doc>Test</doc>\n",
                    "output": "<?xml version=\"1.1\"?><doc>Test</doc>"
                },
                "ibm03v09.xml": {
                    "input": "<?xml version=\"1.1\"?>\r\n<!DOCTYPE doc [\r\n<!ELEMENT doc (#PCDATA)>\r\n<!ENTITY e SYSTEM \"ibm03v09.ent\">\r\n<!ATTLIST doc a CDATA #IMPLIED>\r\n]>\r\n<doc>Test</doc>",
                    "output": "<?xml version=\"1.1\"?><doc>Test</doc>"
                }
            },
            "P04": {},
            "P04a": {},
            "P05": {},
            "P07": {},
            "P77": {}
        },
        "resources": {
            "P02": {
                "ibm02v06.ent": "<?xml version=\"1.1\" encoding=\"UTF-8\"?>\n<![CDATA[ 0x1: &#x1;,  0x2: &#x2;,  0x3: &#x3;,  0x4: &#x4;,  0x5: &#x5;,  0x6: &#x6;,  0x7: &#x7;,  0x8: &#x8;,  0x9: &#x9;,  0xa: &#xa;,  0xb: &#xb;,  0xc: &#xc;,  0xd: &#xd;,  0xe: &#xe;,  0xf: &#xf;,  0x10: &#x10;,  0x11: &#x11;,  0x12: &#x12;,  0x13: &#x13;,  0x14: &#x14;,  0x15: &#x15;,  0x16: &#x16;,  0x17: &#x17;,  0x18: &#x18;,  0x19: &#x19;,  0x1a: &#x1a;,  0x1b: &#x1b;,  0x1c: &#x1c;,  0x1d: &#x1d;,  0x1e: &#x1e;,  0x1f: &#x1f;,  0x7f: &#x7f;,  0x80: &#x80;,  0x81: &#x81;,  0x82: &#x82;,  0x83: &#x83;,  0x84: &#x84;,  0x85: &#x85;,  0x86: &#x86;,  0x87: &#x87;,  0x88: &#x88;,  0x89: &#x89;,  0x8a: &#x8a;,  0x8b: &#x8b;,  0x8c: &#x8c;,  0x8d: &#x8d;,  0x8e: &#x8e;,  0x8f: &#x8f;,  0x90: &#x90;,  0x91: &#x91;,  0x92: &#x92;,  0x93: &#x93;,  0x94: &#x94;,  0x95: &#x95;,  0x96: &#x96;,  0x97: &#x97;,  0x98: &#x98;,  0x0: &#x0;,  0x9a: &#x9a;,  0x9b: &#x9b;,  0x9c: &#x9c;,  0x9d: &#x9d;,  0x9e: &#x9e;,  0x9f: &#x9f;, \n&#x85;\r\n&#xA0;&#x1234;&#xD7FF;\r\n&#xE000;&#xFEF0;&#xFFFD;\r\n&#x10000;&#x5FEDC;&#x10FFFF;  ]]>\n<?PI 0x1: &#x1;,  0x2: &#x2;,  0x3: &#x3;,  0x4: &#x4;,  0x5: &#x5;,  0x6: &#x6;,  0x7: &#x7;,  0x8: &#x8;,  0x9: &#x9;,  0xa: &#xa;,  0xb: &#xb;,  0xc: &#xc;,  0xd: &#xd;,  0xe: &#xe;,  0xf: &#xf;,  0x10: &#x10;,  0x11: &#x11;,  0x12: &#x12;,  0x13: &#x13;,  0x14: &#x14;,  0x15: &#x15;,  0x16: &#x16;,  0x17: &#x17;,  0x18: &#x18;,  0x19: &#x19;,  0x1a: &#x1a;,  0x1b: &#x1b;,  0x1c: &#x1c;,  0x1d: &#x1d;,  0x1e: &#x1e;,  0x1f: &#x1f;,  0x7f: &#x7f;,  0x80: &#x80;,  0x81: &#x81;,  0x82: &#x82;,  0x83: &#x83;,  0x84: &#x84;,  0x85: &#x85;,  0x86: &#x86;,  0x87: &#x87;,  0x88: &#x88;,  0x89: &#x89;,  0x8a: &#x8a;,  0x8b: &#x8b;,  0x8c: &#x8c;,  0x8d: &#x8d;,  0x8e: &#x8e;,  0x8f: &#x8f;,  0x90: &#x90;,  0x91: &#x91;,  0x92: &#x92;,  0x93: &#x93;,  0x94: &#x94;,  0x95: &#x95;,  0x96: &#x96;,  0x97: &#x97;,  0x98: &#x98;,  0x0: &#x0;,  0x9a: &#x9a;,  0x9b: &#x9b;,  0x9c: &#x9c;,  0x9d: &#x9d;,  0x9e: &#x9e;,  0x9f: &#x9f;,  \n&#x85;\r\n&#xA0;&#x1234;&#xD7FF;\r\n&#xE000;&#xFEF0;&#xFFFD;\r\n&#x10000;&#x5FEDC;&#x10FFFF;  ?>\n<!-- Comment 0x1: &#x1;,  0x2: &#x2;,  0x3: &#x3;,  0x4: &#x4;,  0x5: &#x5;,  0x6: &#x6;,  0x7: &#x7;,  0x8: &#x8;,  0x9: &#x9;,  0xa: &#xa;,  0xb: &#xb;,  0xc: &#xc;,  0xd: &#xd;,  0xe: &#xe;,  0xf: &#xf;,  0x10: &#x10;,  0x11: &#x11;,  0x12: &#x12;,  0x13: &#x13;,  0x14: &#x14;,  0x15: &#x15;,  0x16: &#x16;,  0x17: &#x17;,  0x18: &#x18;,  0x19: &#x19;,  0x1a: &#x1a;,  0x1b: &#x1b;,  0x1c: &#x1c;,  0x1d: &#x1d;,  0x1e: &#x1e;,  0x1f: &#x1f;,  0x7f: &#x7f;,  0x80: &#x80;,  0x81: &#x81;,  0x82: &#x82;,  0x83: &#x83;,  0x84: &#x84;,  0x85: &#x85;,  0x86: &#x86;,  0x87: &#x87;,  0x88: &#x88;,  0x89: &#x89;,  0x8a: &#x8a;,  0x8b: &#x8b;,  0x8c: &#x8c;,  0x8d: &#x8d;,  0x8e: &#x8e;,  0x8f: &#x8f;,  0x90: &#x90;,  0x91: &#x91;,  0x92: &#x92;,  0x93: &#x93;,  0x94: &#x94;,  0x95: &#x95;,  0x96: &#x96;,  0x97: &#x97;,  0x98: &#x98;,  0x0: &#x0;,  0x9a: &#x9a;,  0x9b: &#x9b;,  0x9c: &#x9c;,  0x9d: &#x9d;,  0x9e: &#x9e;,  0x9f: &#x9f;,  \n&#x85;\r\n&#xA0;&#x1234;&#xD7FF;\r\n&#xE000;&#xFEF0;&#xFFFD;\r\n&#x10000;&#x5FEDC;&#x10FFFF;  -->\n\n"
            },
            "P03": {
                "ibm03v01.ent": "Data\r",
                "ibm03v02.ent": "Data",
                "ibm03v03.ent": "\r",
                "ibm03v04.ent": "",
            },
            "P04": {},
            "P04a": {},
            "P05": {},
            "P07": {},
            "P77": {
                "ibm77v01.dtd": "<?xml version='1.0' encoding='UTF-8'?>\n<![INCLUDE [\n<!ELEMENT Ànode EMPTY>\n<!ELEMENT root ANY>\n]]>\n",
                "ibm77v02.dtd": "<?xml version='1.0' encoding='UTF-8'?>\r\n<![INCLUDE [\r\n<!ELEMENT ῿node EMPTY>\r\n<!ELEMENT root ANY>\r\n]]>",
                "ibm77v03.dtd": "<?xml version='1.0' encoding='UTF-8'?>\r\n<![INCLUDE [\r\n<!ELEMENT 更node EMPTY>\r\n<!ELEMENT root ANY>\r\n]]>",
                "ibm77v04.ent": "<?xml version='1.0' encoding='UTF-8'?>\n<Önode/><Önode/><Önode/>\n",
                "ibm77v05.ent": "<?xml version='1.0' encoding='UTF-8'?>\r\n<῿node/><῿node/><῿node/>",
                "ibm77v06.ent": "<?xml version='1.0' encoding='UTF-8'?>\r\n<更root/><更root/><更root/>",
                "ibm77v07.dtd": "<?xml version='1.1' encoding='UTF-8'?>\n<![INCLUDE [\n<!ELEMENT Ønode EMPTY>\n<!ELEMENT root ANY>\n]]>\n",
                "ibm77v08.dtd": "<?xml version='1.1' encoding='UTF-8'?>\r\n<![INCLUDE [\r\n<!ELEMENT ῿node EMPTY>\r\n<!ELEMENT root ANY>\r\n]]>",
                "ibm77v09.dtd": "<?xml version='1.1' encoding='UTF-8'?>\r\n<![INCLUDE [\r\n<!ELEMENT 更node EMPTY>\r\n<!ELEMENT root ANY>\r\n]]>",
                "ibm77v10.ent": "<?xml version='1.1' encoding='UTF-8'?>\n<öroot/><öroot/><öroot/>\n",
                "ibm77v11.ent": "<?xml version='1.1' encoding='UTF-8'?>\r\n<῿root/><῿root/><῿root/>",
                "ibm77v12.ent": "<?xml version='1.1' encoding='UTF-8'?>\r\n<更root/><更root/><更root/>",
                "ibm77v13.dtd": "<![INCLUDE [\n<!ELEMENT ønode EMPTY>\n<!ELEMENT root ANY>\n]]>\n",
                "ibm77v14.dtd": "<![INCLUDE [\r\n<!ELEMENT ῿node EMPTY>\r\n<!ELEMENT root ANY>\r\n]]>",
                "ibm77v15.dtd": "<![INCLUDE [\r\n<!ELEMENT 更node EMPTY>\r\n<!ELEMENT root ANY>\r\n]]>",
                "ibm77v16.ent": "<˿root/><˿root/><˿root/>\n",
                "ibm77v17.ent": "<῿root/><῿root/><῿root/>",
                "ibm77v18.ent": "<更root/><更root/><更root/>",
                "ibm77v19.dtd": "<?xml version='1.1' encoding='UTF-8'?>\r\n<!ELEMENT root (#PCDATA)>\r\n<!ENTITY root_content \"This is a test &#x7F;char\">",
                "ibm77v20.dtd": "<?xml version='1.1' encoding='UTF-8'?>\r\n<!ELEMENT root (#PCDATA)>\r\n<!ENTITY root_content \"This is a test &#x0080;char\">",
                "ibm77v21.dtd": "<?xml version='1.1' encoding='UTF-8'?>\r\n<!ELEMENT root (#PCDATA)>\r\n<!ENTITY root_content \"This is a test &#x009E;char\">",
                "ibm77v22.ent": "<?xml version='1.1' encoding='UTF-8'?>\r\n&#x007F;",
                "ibm77v23.ent": "<?xml version='1.1' encoding='UTF-8'?>\r\n&#x0080;",
                "ibm77v24.ent": "<?xml version='1.1' encoding='UTF-8'?>\r\n&#x009F;",
                "ibm77v25.dtd": "<!ELEMENT root (#PCDATA)>\r\n<!ENTITY root_content \"<!-- &#x007F;&#x008F;-->\">",
                "ibm77v26.dtd": "<!ELEMENT root (#PCDATA)>\r\n<!ENTITY root_content \"<?PITarget &#x0080;&#x0090; PIData?>\">",
                "ibm77v27.dtd": "<?xml encoding='UTF-8'?>\r\n<!ELEMENT root (#PCDATA)>\r\n<!ENTITY root_content \"&#x009F;&#x0081;\">",
                "ibm77v28.ent": "&#x007F;&#x009F;&#x0080;",
                "ibm77v29.ent": "&#x0085;&#x008F;",
                "ibm77v30.ent": "<?xml encoding='UTF-8'?>\r\n&#x0001;&#x007F;"
            }
        }
    }
}
export default testData;

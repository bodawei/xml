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

## Errors

### From the standard's point of view
In section §1.2.0, the XML Standard lays out several kinds of errors:

* *Error*: An error is violation of the rules. Interestingly, it is not required that these be detected and reported.
   * *Validity constraint*: An error that is a violation of a validity constraint. These must be reported if the user asks for them.
* *Fatal error*: A violation of the rules that must be detected and reported. The processor may report remaining document data but must not continue normal processing.
   * *Well-formedness constraint*: A fatal error that is a violation of a well-formedness constraint.
* *For compatibility*: A feature that is here just o maintain compatibility with SGML.
* *For interoperability*: A recommendation that would make it more likel an XML document can be processed by older SGML processors.

### From this processor's point of view
Tiramisu fundamentally represents an XML document as a stream or series of tokens. During processing, when any problem is detected, an "XmlErrorToken" is created and introduced into the stream. Whenever possible, the XmlErrorToken is placed before any token that "contains" the problem.

XmlErrorTokens, like all other tokens, have a `type` property which is set to `XML_ERROR_TOKEN`. Unlike most other tokens, these also have a `subtype` property which identifies the kind of error (e.g. validity, well-formedness).  This arrangement allows any processor to easily identify all errors without needing to know about all types, as well as allowing other processors to identify only particular kinds of errors.

All errors also have:

* `id`: A string that uniquely identifies the particular error condition (e.g. a missing piece of syntax)
* `code`: A number that identifies the particular error. Each `id` and `code` values have a 1:1 relationship.
* `message` A human-readable string that describes the error condition. This may be localized.

Teramisu produces several subtypes of `ERROR_TOKEN`

* `WARNING` (WarningToken): This is used to report any interoperability or compatibility concerns.
* `ERROR` (ErrorToken): This is used to represent any errors that are not syntax or wellformedness.
* `SYNTAX` (SyntaxErrorToken): This is used to represent any violation of the productions in the XML Standard.
* `WELLFORMEDNESS` (WellformednessErrorToken): This is used to represent any violations of the well-formedness constraints.
* `FATAL_ERROR` (FatalErrorToken): This is used for any fatal errors that are not validity constraints.
* `VALIDITY` (ValidityErrorToken): This is used to represent any violations of the validity constraints.

Whenever possible, an ErrorToken also contains a `place` and a `context` property, each of which is an offset into one of the original source files. `place` tries to represent the exact location the error was detected, while `context`, when available, represents the overall token that was being processed.  For example:

   `<?xml encoding="usascii" version="1.0" ?>`

This contains an error in that the encoding value comes before the version. The position will be at character 6 (the start of "encoding"), while the context will be at character 0 (the start of the XML Declaration).


### Thrown Errors
Teramisu only rarely throws Error instances, or reports Errors through the stream event handlers. Those that it does are fundamentally development errors that should easily be detected at development time. One implicit goal of the whole system is that one should be able to deliver "junk" (meaning, some data that is very clearly not XML data) and the processor should simply handle this as a terribly malformed XML document with many errors. Higher level processors may provide the constraints that the XML Standard requires (e.g. stopping normal processing). But the more fundamental processors (parser, checkers, expand) will be as indifferent to any errors as they can be.

### Style guide
#### Codes
By convention, all error codes are unique. These are arranged in the following bands:

* 100-599: Warnings
* 1000-1099: General errors
* 1100-1599: Validity errors
* 1600-1999: "User defined errors"
* 2000-2099: General fatal errors
* 2100-2199: Well formedness constraint errors
* 2200-2499: Syntax errors
* 2600-2999: "user defined fatal errors"

By "user defined" this means if you are building something on top of the Tiramisu system, you can use those codes without fear of conflicts.

#### Error ID's and message strings
There are several conventions for the error ID's and error message templates:

* All ID's are in UPPER_SNAKE_CASE format
* Whenever possible, ID's start with the name of the syntactic entity they are describing
* ID's and essages have these patterns
   * THING_PROBLEM: "THING must WHATEVER. Found OTHER"
   * THING_INVALID_whatever: "THING must (not) have..."
   * THING_NO_whatever: "Missing WHATEVER in THING."
   * THING_XTRA_whatever: "Must not ..."
* WHen an error is a violation of a portion of the XML specification, the message should include the section number in triple-digit format at the end (e.g. §1.2.3) (before a "Found" section, if present). If it applies to only a particular version or edition of the XML standard, that should be noted after (e.g. §1.2.3 - XML 1.1/2)
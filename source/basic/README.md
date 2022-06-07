# Basic

This module provides a variety of "foundationl" functionality that is largely or entirely independent of the XML standard, but is omnipresently used across other modules.

# Offsets and Ranges
Offsets and ranges keep track of either "points" or "ranges of points" in an entity. For example, the letter "x" might be at index 2, row 0 and column 2 of an XML document (an offset), while "xml" might be a sequence of characters from the offset (index 2, row 0, column 2) to (index 4, row 0 and column 4).  These are involved with the processing of STokens

# Miscellaneous utility routines
* Callback-based loop routines (doAsyncLoop, etc)
* Various character class identifying utilities (e.g. isSpace())
* Routines to identify whether two offsets are equal or extracting parts of a range

# Tokens
Foundational to Teramisu's processing are "tokens". As an XML document is processed, it is broken up into a variety of tokens which are streamed through a variety of processors.  STokens (String Tokens) are low-level chunks of the XML document, corresponding to a node in something like an AST (Abstract Syntax Tree, or in this case more appropriately an Abstract Syntax Stream). One or more STokens are gathered together to make a single PTokens (Parsed Tokens), for example an Element, an Entity Declaration and a Comment are all represented as PTokens. A PToken can be converted into an XToken by the xToken module, where an XToken as stripped away some of the potentially unneeded information found in a PToken, making it easier to process the document for some tasks.  There are other Tokens which do not directly relate to some sequence of text in the original XML document. For example, ConformanceVersion tokens record the version of the standard that this processing is conforming to. Problem tokens record violations of the standard found while processing.  Essentially all interesting processing works with and generates Tokens.

All Tokens (escept STokens) carry a `type` property, whose value uniquely identifies the type (class, if you like) of the data in that object. Tokens in Tiramisu are universally duck-typed. That is, they are not identified by ECMAScript classes or prototypes, but instead by the `type` property.

# ConfirmanceVersion token
This is a simple type used to capture a version and edition of the XML standard.  This is used by other modules to keep track of what version so that each can process any XML text appropriately.

# EntityId token
Captures the system and public identitifiers of a particular XML entity. Like ConformanceVersion, this is used to help convey through the processing pipeline what entity is being processed.  This is actually a part of each and every SToken, as well as appearing in the stream of PTokens.

# Problem tokens and related utilities.
Problem tokens are peers of PTokens, ConformanceVersion tokens, etc.  Each captures some known problem in the stream of tokens being processed. Most commonly, they report on a syntax error, a well formed error or a validity error in the immediately following non-problem token. 

## From the standard's point of view
In section §1.2.0, the XML Standard lays out several kinds of problems:

* *Error*: An error is violation of the rules. Interestingly, it is not required that these be detected and reported.
   * *Validity constraint*: An error that is a violation of a validity constraint. These must be reported if the user asks for them.
* *Fatal error*: A violation of the rules that must be detected and reported. The processor may report remaining document data but must not continue normal processing.
   * *Well-formedness constraint*: A fatal error that is a violation of a well-formedness constraint.
* *For compatibility*: A feature that is here just to maintain compatibility with SGML.
* *For interoperability*: A recommendation that would make it more likel an XML document can be processed by older SGML processors.

## From this processor's point of view
During processing, whenever any problem is detected, a Problem instance is created and introduced into the stream. Whenever possible, the Problem is placed before any token that "contains" the problem.

Problem, like all other tokens, have a `type` property which is set to `PROBLEM`. These also have a `serverity` property which identifies whether this is a `WARNING`, `ERROR` or `FATAL_ERROR`. They also have a `source` property which gives more context to where they came from in the processing. Common values are `validity`, `wellformedness`, `syntax`, but may have other values. The severity allows other processors to respond to the problems without needing to understand each code. For instance, the XML standard says that a fatal error should stop processing, so a processor can easily distinguish fatal errors from errors.

All problems also have the following properties:

* `id`: A string that uniquely identifies the particular problem condition (e.g. a missing piece of syntax)
* `code`: A number that identifies the particular problem. The `id` and `code` values have a 1:1 relationship.
* `message` A human-readable string that describes the problem condition. This may be localized, and the same id/code pair may have different messages at different times (though, most differences are simply substitutions of different values from the document)

Whenever possible, an Problems also contain a `place` and a `context` property, each of which is an offset into one of the original source files. `place` tries to represent the exact location the problem was detected, while `context`, when available, represents the overall chunk of the document that was being processed.  For example:

   `<?xml encoding="usascii" version="1.0" ?>`

This contains an error (the encoding value comes before the version). The position will be at character 6 (the start of "encoding"), while the context will be at character 0 (the start of the XML Declaration).

## Thrown Errors
Teramisu only rarely throws ECMAScript Errors. Those that it does are fundamentally development errors that should easily be detected at development time. One implicit goal of the whole system is that its user should be able to deliver "junk" (meaning, some data that is very clearly not XML data) and the processor should simply handle this as a terribly malformed XML document with many problems, rather than throwing any Errors. Higher level processors may provide the constraints that the XML Standard requires (e.g. stopping normal processing). But the more fundamental processors (parser, checkers, expand) will handle prboblems gracefully (though, perhaps uselessly).

## Problem utilities
There are serveral parts to the handling of problems in Tiramisu

* Problem: This constructor function generates a duck-types Problem instance.  Individual sub-systems will create a subclass of this constructor function for each kind of problem that they produce. These subclasses merely deliver several parameters to the super-constructor that users of those subclasses should not need to know about.  Like the Collectors, the goal here is to minimize the number of parameters that need to be provided at Problem reporting time.
* ProblemCodes: This class's constructor takes a mapping of ID's to codes and template messages, and returns an instance with a variety of useful utility methods used to access that data.  These are tighly coupled with Problem constructors and ProblemCollectors
* Collectors are classes whose instances are used to gather a set of Problems.  At runtime, a ProblemCollector is most commonly used, while in many unit test situations, a ParamCollector implementation is used.  In both the wellformed and validity processors, examining a single PToken may generate zero or many Problems, and so a Collector is used to allow that set of Problems to be delivered as a unit to the root processor for delivery to its own output stream.
   * ProblemCollectors take a set of parameters and createa a Problem instance. Most notably, it allows the context to be specified once, which in turn allows most things reporting Problems to be able to not "remember" or even "know" what that context is.
   * ParamCollector also takes a set of parameters, but keeps track of the parameters themselves for testing purposes.
* makeProblemMatcher() creates a jest matcher corresponding to a particular Problem subtype. Each subsystem that subclasses Problem will use makeProblemMatcher to create a matcher to help check for those Problems in tests.

## Style guide
### Codes
By convention, all Problem codes are unique. These are arranged in the following numeric ranges:

* 100-599: Warnings
   - 200-250 are warnings according to the "validity" portions of the standard
* 1000-1099: General errors
* 1100-1599: Validity errors
* 1600-1999: Non-XML-Standard errors
* 2000-2099: General fatal errors
* 2100-2199: Well formedness constraint errors
* 2200-2499: Syntax errors
* 2600-2999: Non-XML-Standard fatal errors

By "Non-XML-Standard" this means if you are building something on top of the Tiramisu system, you can use those codes without fear of conflicts.

### Error ID's and message strings
There are several conventions for the error ID's and error message templates:

* All ID's are in UPPER_SNAKE_CASE format
* Whenever possible, ID's start with the name of the syntactic entity they are describing
* ID's and essages have these patterns
   * THING_PROBLEM: "THING must WHATEVER. Found OTHER"
   * THING_INVALID_whatever: "THING must (not) have..."
   * THING_NO_whatever: "Missing WHATEVER in THING."
   * THING_XTRA_whatever: "Must not ..."
* WHen an error is a violation of a portion of the XML specification, the message should include the section number in triple-digit format at the end (e.g. §1.2.3) (before a "Found" section, if present). If it applies to only a particular version or edition of the XML standard, that should be noted after (e.g. §1.2.3 - XML 1.1/2)
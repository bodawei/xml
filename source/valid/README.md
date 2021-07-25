# Valid

## Overview

## Commentary on individual constraints

x 745 3.3.1 name token
x 744 3.3.1 entity name


### §2.8.0 Root element type
No commentary.

### §2.8.0: Proper Declaration/PE Nesting
This one is a bit hard to understand. This says

> Parameter-entity replacement text must be properly nested with markup declarations. That is to say, if either the first character or the last character of a markup declaration (markupdecl above) is contained in the replacement text for a parameter-entity reference, both must be contained in the same replacement text.

In the spec, it seems to apply to production `[29]` which says `markupdecl ::= elementdecl | AttlistDecl | EntityDecl | NotationDecl | PI | Comment`. But maybe it applies to `[28]` as well.

There's some clarification in [https://www.xml.com/axml/axml.html](https://www.xml.com/axml/axml.html) (not normative, but nonetheless helpful), where it says

> "This is probably not as clear as it could be. Here is an example of a PE reference that is disallowed by this rule: `<!ENTITY % pe1 "EMPTY> <!ELEMENT e2 EMPTY>" >  <!ELEMENT e1 %pe1;"`.

Let's break down some thinking about what this might mean.

From the standpoint of just examining the text of PE references, we can say that just having fragmentary markupdecl in entity text is not invalid in and of itself. This may not be a surprise, because the text of the validity constraint ("must be properly nested with markup declarations") seems to say when the parameter entity is referenced.  Using `xmllint` as a guide, we can test this out as well and see it works fine.

From the standpoint of referencing a parameter entity within `intSubset` and `extSubsetDecl` we need to make sure to disallow:

```
<!ENTITY % troublesome "<!ELEMENT test ">
%troublesome;
ANY>
```

This will be reported as a problem by our parser and the expansion system. The parser will interpret the above as three tokens: `ENTITY_DECLARATION_PTOKEN`, `PARAMENTER_ENTITY_REFERENCE_PTOKEN` `CHARDATA_PTOKEN`, and the last will be reported as a token in the wrong place by the syntax checks in the wellformedness system. When it comes to expansion, the processing there will conclude that the ELEMENT declaration is simply incomplete, and again the syntax checks in the wellformedness system will also report that as an error.  Thus, in this processor, if the "first character ... of a markup declaration" appears in the replacement text of a parameter entity, it will always result in some kind of syntax error. This validity system (redundantly) checks for markup declaration tokens that were missing their closing value, and are are the end of a parameter entity expansion.

Another aspect of this is having the "last character of a markup declaration" in the replacement text.  This covers things like: `<!NOTATION %myPERef;`. Here, again, the parser and expansion will report errors long before the data gets to the validator.  In particular, the parser will parse `<!NOTATION %myPERef; ...` as a `NOTATION_DECLARATION_PTOKEN` with a potentially long `unexpanded` property (it will read `...` until it finds a closing `>`.  Once it has gone through the expander, it will end up with text in the `extra` property (at least the `>` from the `myPERef` replacement text), which will be flagged as a syntax error. This validity system will still report a "Proper Declaration/PE Nesting" validity constraint if it finds an attlist, element, entity or notation declaration PToken with an unexpanded property and a `>` in the extra property. 

Note that the definitions of PI and Comment both say that PE references are not recognized within them. So even seemingly legitimate things like `<!-- %foo; -->` will not cause the PE reference to be recognized, much less `<!-- %foo;`.

The spec doesn't mention this, but it seems like this could apply to conditional sections as well.  For the case of the start of the conditional section being in the replacement text of a PE reference, the same situation described above would happen: the conditional section would start, but not have an end, and would be terminated by the end of the parameter entity's replacement text. For the case of the parameter entity containing just the end of the conditional section, in this case the parser would keep on processing the text after the PE reference as content for the conditional section, until it found a closing `]]>`. The original `]]>` would end up being reported as misplaced text by the wellformedness system.

#### Some interesting cases to keep in mind
* `&foo; <!ENTITY bar 'foo'>">` (`foo` contains `<!ENTITY % whatever "`).

### §2.9.0 Standalone Document Declaration
In the standard, these cases can be a little hard to follow why they are important.

- If an element contains whitespace between child elements, then without validation (that is, attending to the content model), we do not know whether that whitespace is significant or not (in the case of an element with element content, there should be no char data between the child elements, and so the white space is not significant).  If we are validating, then we know to ignore the whitespace. However, if the document was marked as "standalone=yes", and the declaration for that element type was an "external markupp declaration", then the standalone declaration was in error... this isn't a standalone document (it requires processing the so-called external markup declarations in order to correctly interpret the docuent -- that is, identify that the white space is not significant)

### §3.2.0 Unique Element Type Declaration
No commentary.

### §3.1.0 Attribute Value Type
This particular constraint says "The attribute must have been declared; the value must be of the type declared for it." The first portion (that the attribute has been declared) is straight forward. However, it is not at all clear to this validator how to enforce the second part beyond the various validity constraints from §3.3.1.

### §3.2.2 No Duplicate Types
No commentary.

### §3.3.1 ID
No commentary.

### §3.3.1 One ID per Element Type
No commentary.

### §3.3.1 ID Attribute Default
No commentary.

### §3.3.1 IDREF
Note that idref's can be "forward" or "backward" references.  Thus, many may not actually be resolvable until the end of the document.

### §3.3.1 Notation Attributes
This says "all notation names in the declaration must be declared". Note that one of these notations can be declared after the ATTLIST

### §3.3.1 No notation on empty element
This was introduced in 1.0/2, so is not enforced when the conformance version is 1.0/1.

### §3.3.1 No Duplicate Tokens
This was introduced in 1.0/3, so is not enforced when the conformance version is 1.0/1 and 1.0/2.

### §3.3.1 One Notation Per Element Type
This was introduced in 1.0/2, so is not enforced when the conformance version is 1.0/1.

### §3.3.1 Enumeration
No notes

### §3.3.2 Required Attribute
No notes

### §3.3.2 Attribute Default Legal / Attribute Default Value Syntactically Correct
There are substantial wording differences across the different editions of the specification, but this author would not have interpreted different behavior.
It is worth calling out that the spec doesn't require that an ID attribute with a default value  matches the syntax for names.  This makes sense because it is pretty non-sensical for an ID attribute (which is supposed to have a unique value each time it is used) to have a pre-defined value.

### §3.3.2 Validity Constraint: Fixed Attribute Default
No notes

### §4.2.2 Notation Declared
This states that the NDATA name must match the declared name of a notation.

One's thought might be that, like PE references, that this would imply that the notation must be declared before the ENTITY declaration.

However, several XML Conformance tests reveal that it is perfectly legal to have the notation declared after the entity declaration.

And using the `xmllint` as a guide, it is also apparent that these must be declared even if the entity is never referenced.

### §4.7.0 Unique notation name
This assumes that the first occurence of a notation declaration is correct, while subsequent ones are in error.  This is consistent with the general pattern of "first occurrence wins" in XML.

Note also that this is not enforced in 1.0/1, since that edition did not have this constraint.

## Architecture

The wellformedness check system approached checking by having a global context which is checked in the main routine, and then having token-specific checking routines.  The notion was that there is a bunch of more "global" state (bigger than individual tokens) that needs coordinateing.  As a result we had "global" state and "global" processing, as well as local processing.

The downsides to this is that that global state and code is relatively complex to read, write and test.  Though it isn't going to happen, adding another token type is complex.

The first draft of validation ended up with a huge file with a lot of complex state and functionality spread around. Some parts could have been extracted into individual routines, but it has the same problems that the wellformedness checks.

In an effort to cut down on complex "global" logic, this is experimenting with doing all validation only at the element level.  This will produce some duplication, and entails having some pretty detailed global state. otoh, we had pretty detailed global state before.



## ContentModelGraphs
In order to validate whether the elements in a particular model conform to the content model description in an element declaration, this converts a content model in to a graph representation.  

Content models are described by the `children` production in §3.2.1:

```
   [47] children       ::= (choice | seq) ('?' | '*' | '+')?
   [48] cp             ::= (Name | choice | seq) ('?' | '*' | '+')?
   [49] choice         ::= '(' S? cp ( S? '|' S? cp )+ S? ')'
   [50] seq            ::= '(' S? cp ( S? ',' S? cp )* S? ')'
```

The point of the graph conversion is to turn something like `(head, (p | list | note)*, div2*)` into a data structure that we can easily use to determine if a sequence of child elements in an element are of the correct types and in the correct order.  Notice that the above content model allows for all of the following:

```
   head div2
   head p list p p p p note list div2 div2 div2
   head
   head list
```
### High level data structure
We turn any content model into one of a set of `CmState`s.  Each `CmState` has this form:

```
interface CmTransition {
   ref: string;
   stateId: number;
}

interface CmState {
   id: number;
   trans: {
      [name: string]: CmTransition;
   };
   done?: boolean; // true if you can stop when you reach this Cmstate.
}
```
Each state can be thought of as a position "between" a sequenced content particle (`cp` in the productions above, minus the repetition indicator). Choice cp's happen within a state and are captured in the `trans` property of the state. Thus, the produced graph has a state at the start before we have processed any elements, and a state after all.

We trandition (`trans`) through the graph by encountering an element name, looking that element up in the `trans` map and following to the state with the specified id.  If there is no transition, then we are in error.  If we finish reading elements and our current state is not marked `done`, then we are also in error.

The `ref` property is used to keep track of where this transition was in the content model, for reporting to any errors to the user.  Thus, in the `(head, (p | list | note)*, div2*)`, the transition when encountering `head` is `/1`, the transition with `(p | list | note)` is `/2` etc.  The `ref`s are hierarchical, representing the hierarchy in a content model. Thus, the transition for `p` is `/2/1` Note that if a choice `cp` has multiple of the same name, we represent this in the `ref` property as `/1,/3` (in the case of `(foo|bar|foo)`).

### Autotrans

In the first stage of conversion (`cmToCmGraph`) the graph states have an additional property: `autoTrans`. This represents the cases where `*` or `?` is the repeat, and indicates that you could ignore this state and automatically transition to the state with the specified state id.

The auto-trans array may have multiple ids and, and the ids can have multiple values.

### Introduced states

The first stage of processing may also introduce states that don't have an obvious representation in the original content model. This is for repetitions (`*` and `+`) For instance:

```
(first, (second)+, last)
```

will produce:

```js
   0: {   // Start here
      trans: {
         first: { // go to state 2 when encountring "first"
            ref: '/1',
            stateId: 2,
         },
      },
   },
   1: {
      trans: {},
      done: true, // end!
   },
   2: {
      trans: {
         second: {   // go to the artificial state 4 when encountering "second"
            ref: '/2/1',
            stateId: 4,
         },
      },
   },
   3: {
      trans: {
         last: {
            ref: '/3',
            stateId: 1,
         },
      },
   },
   4: {
      autoTrans: [2, 3],  // Now we can either transition back to 2 (in order to get a second "second") or transition to to 3 where we expect to get "last"
      trans: {},
   },
```


## Collapsing autoTrans

The second phase of processing rewrites the graph to replace the `autoTrans` values with additional states. The point is to allow later processing to walk decisively through a graph, and not need to maintain multiple pointers ("I could be here, or there").

Thus, a major part of this process is for the collapse routine to do the "look ahead" and "pull back" the state transitions.  With this, the states above look like:

For exaple, the graph, above, is rewritten to the following. Notice how state 4 no longer has an `autoTrans` value, but instead contains copies of the transitions from the states in 2 and 3.  In this way, once one has seen one "second", one can expect either to see another "second" or a "last".

```js
   0: {
      trans: {
         first: {
            ref: '/1',
            stateId: 2,
         },
      },
   },
   1: {
      trans: {},
      done: true,
   },
   2: {
      trans: {
         second: {
            ref: '/2/1',
            stateId: 4,
         },
      },
   },
   3: {
      trans: {
         last: {
            ref: '/3',
            stateId: 1,
         },
      },
   },
   4: {
      trans: {
         second: {
            ref: '/2/1',
            stateId: 4,
         },
         last: {
            ref: '/3',
            stateId: 1,
         },
      },
   },

```

Note that in some cases, this may combined multiple states. in this case the ref will contain multiple values separated by commas (e.g. `/1,/2/3`). These represent non-deterministic places in the content model, which becomes important for validation.

### Pruning the graph

The last processing phase does two things:

* It removes the (now empty) `autoTrans` properties from the graph.
* The collapsing process may leave some "orphan" states (e.g. #3, above).  These can simply be removed.

### Implementation note
* The graph processing all works with mutable data structures. It might be nice to switch this to working more with immutable structures.
* We probably ought to have a different internal structure and external structure, so the `autoTrans` property is never seen outside.

## Specific token details

### Element end
* If this encounters an unbalanced end, it will ignore the end element.
   * Like wellformedness, this does not try to auto-close parent elements.


## Code style
* A comment should be placed before each check for a valitity error that lists the section, and the portion of the text from the spec that describes the constraint.  This should be done with line comments.
* Each test for a valitity constraint should list the section of the spec this test is checking.
* Each group of tests for one validity constraint should be in its own `describe()` section.
# Notes

## Unassigned
The "unassigned" system is probably the most complex part of this.

We recognize that we can have "within markup declarations" parameter entities (§2.8).

One of the design goals for this system, however, is we should be able to handle parsing of an entity without necessarily having all the external entities available at parsing time.  Put another way, different stages of the process need to handle parsing and entity expansion. Because of this, when we encounter a parameter entity reference within a markup declaration, we need to be able to store the data until some later time.

One approach to this would be to simply scan from the first "%" to the ">" and keep that single SToken around until it was time to start expanding. A problem with this, however, is we can't blindly search for the next ">", since in at least some of the cases we can find ">" in a literal value (e.g. and EntityValue). Which means we need to be smart about this processing.

This has opted to have an intermediate parser, in the unassigned module, which parses the text in the markup declaration into a series of parameter entity references, words (whitespace delimited STokens), spaces (whitespace STokens) and literals (quoted values). This is then attached to the markup declaration PToken in a property called `unassigned`. This unassigned parsing, however, only kicks in if we encounter a parameter entity reference. If we don't find such a thing, then we parse the markup declaration as normal.  When we do find a parameter entity, we store the name of the property where we encountered it, for later use.

At entity expansion time, we expand any parameter entity references within that `unassigned` property (and, remember, there could be several of them) and then call the `assignUnassigned()` function on the PToken with that expanded set of unassigned values.  This then starts a process of trying to align each of the values from the `unassigned` array with the expected properties of the PToken.

> It is worth observing that there is a vast amount of similarity between this `assignUnassigned()` process and the ordinary `parseFooDeclaration()` parsing. So much so that I did seriously consider replacing one of them, so that there was only one process.  What kept me from doing this was twofold: (1) since everything else does "normal" parsing, it seemed nice to keep the same paradigm for non-parameter-entity-in-markup case. Of course, I could have replaced "normal" processing throughout with this style.  However, aside from the fact that the `assignUnassigned()` processing is more complex, it also leads to the fact that (2) the ordinary parsing aborts parsing the markup declaration as soon as something seems really amiss. In contrast, the `unassigned.parsePeRef()` parsing doesn't have enough knowledge to do this correctly  This results in "non-standard" (within this system) behavior which I didn't want to spread that any more broadly than I had to.

When the `assignUnassigned()` process is done, it leaves the unchanged (but expanded) `unassigned` array, as well as the property name attached to the PToken. If there was text that could not be assigned, the remaining pieces are assigned to an optional property called `extra` on the PToken. If this `extra` property is not empty, it always represents an error condition.

Note also that if we could not expand one or more of the paramter entities in the `unassigned` array, we consider this to be a problem, and do no assigning, and set `extra` to the same value as the `unassigned` property.

The `unassigned` array is only associated with the markup declaration PToken, not any logical sub-units (most notably, an ExternalID), even if the parameter entity reference that brought it into existence started in one of those sub-units.

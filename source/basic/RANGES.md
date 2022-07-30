When going through a document, each bit of text has a very clear range.
   External entities as well.

The problem with ranges comes in with entity expansion.

Note: We do a partial parse at the outset
   Value internal entities do get an initial parsing,

In any case, when parsing a parameter entity, note that some of the content of tht entity may be from the original entity it was contained within, but some may come from other entities.  e.g.

   <!ENTITY % foo "<!ELEME">
   <!ENTITY % bar "%foo;NT boo ANY>">

   %bar;

So, it is worth noting that when preparing the replacement text for bar, we end up with ranges of
   <!               ELEMENT
   [From entity 1]  [entity 1, entity2] 

So far, not a big deal.  But I think we can get crazy

   <!ENTITY % a "&25;">
   <!ENTITY % c "o;">
   <!ENTITY % b "%a;c;">
   <!ENTITY d "%b;">

   ...
   &d;


OK. here is what I think:
- Essentially, each successive expansion either produces text, or it generates syntactic elements. (which are just %...; and %#11;) As soon as syntax is generated, it doesn't get parsed again.   so a range of text may have an incredibly large set of ranges, but you will never have hierarchical ranges.
At expansion time, we can't really know for sure which ranges correspond to the text we are expanding.  So, it seems to me that if you touch a segment, you get all of its ranges, even if you don't fully consume it.
   We should be sure to insulate this so someday we could fix that.

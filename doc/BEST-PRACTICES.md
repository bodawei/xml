### Tests
#### General Idea
* Unit tests test logic thoroughly. They should cover 100%, and exercise every major use case
* Integration tests are there merely to make sure the units interoperate successfully
   * They should not be extensive. That is what unit tests are for.
* Don't use a describe block to group a single test, unless it's a fairly special case where this adds value.


#### Unit tests
* Files named *.test.js
* Mock out anything significant
* Add tests to make sure that any calls to those are being called with the right arguments.

#### Integration Tests
* Files named *.integration.test.js
* Tests should be few in number.
* Should be one test to make sure that the thing that is being tested is being called
* Verification that it is calling each of the things mocked out in the unit tests should be done
   * This should not be extensive
   * It should not be reaching to things that that called thing calls
   * As much as possible, tests should not verify details of the behavior, just validate in some way that the call was made and it worked

#### Open Issue
* Not entirely sure how to really lock down that the right parameters are being passed through
* Our parsed structures have a bunch of implicit assumptions (e.g. xmlDeclaration must always have params).  We need to either make these structures well defined or make the checking more flexible.
* Our tests are getting cumbersome with lots of hand-built parsed structures.
   * Probably good to build one prototypical structure at the start of each test file, and then modify that in the tests.
      * Don't start making these all over the place, as you get magic values then
   * Perhaps use the parse routine to generate one from a string.
      * In some situations, this would produce too much intimacy.  but here, the parse routine is the only thing supposed to be producing these.
   * How public are these parsed structures going to be?
* Why do all this spying?  It gets cumbersome, especially checking args.
   * The point is while we don't expect it to happen a lot, we still should allow for each "layer" to evolve separately.  Testing them together means we are often assuming a relationship that then breaks when the called changes.  For example, if we add a check to a wellFormedCheck, we may start getting an error showing up in a unit test which is irrelevant.

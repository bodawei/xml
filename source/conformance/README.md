# `conformance`

This runs all the tests in the XML Conformance Test Suite (see https://www.w3.org/XML/Test/ ).

This module is at one pretty simple and also pretty complex. It is simple because it really just contains a test file, with no actual "business logic". It is complex because the couple thousand tests here are assembled and run through code, rather than being hand-written. And it takes a lot of code (compared to any other tests in this project) to make this happen.

The heart of this is a single test file in `@test/xmlconf.test.ts`. This Jasmine test file runs all of the xmlconf tests against the core tiramisu system.

Rather than having thousands of hand-written copies of each test, the building and running of these tests is entirely automated.

## Extracting xmlconf test data
A script in the build directory, along with an npm script `build:xmlconf` is used to import all of the XML Conformance test data (using tiramisu to do this, since all the metadata about the tests is in an XML Document). This is then transformed and written out as a file in `@test/data`, called creatively, `xmlconf.json`.

## Other test metadata
There are three other bodies of data that go into describing all the test to be run. These all live in `@test/data/`

* `testFilters.ts` This is a file which lists any xmlconf tests that should not be run. It has both an exclude section, as well as an include section. The latter actually means "include only these in the run".  Both sections contain arrays of test ID's (as defined in the xmlconf metadata). This has mainly been used as a debugging tool to help more precisely control which tests should be run at any given time.  However, since there is at least one xmlconf test which I think it wrong (ibm-not-wf-P66-ibm66n03.xml), the exclude list includes those too.

* `expectedCodes.ts` For all error, invalid and not-wellformed tests, we need to identify that these tests fail for the right reasons.  Thus, this file contains the expected error code for each test.  In some cases, the error codes are not precise enough, so additional metadata can be included (at this moment, just a substring of the error message that must be matched). In addition, some tests will fail in some versions/revisions, but not in others (`x-rmt-008` is a good example). Thus, you can also add an entry of the form `x-rmt-008==V1R5` which indicates that this is the expected error information for Version 1.0, revision 5.  Finally, if the error id value is set to `"none"`, then this is the same as saying that the test will not generate any errors.

* `fixTest.ts` Bafflingly, many tests have minor defects in them (!). Mos notably, hundreds of tests lack an XML declaration (`<?xml version=...?>`). One can only assume that the original builders of these tests were relying on a harness that automatically added that, since it is quite explicit in the specification that that is required. In at least one case, it looks like one of the test answers is wrong, and so this fixes that. See the appendix below for more details.

Between these three files, you can see, pretty declaratively, what assumptions and variations are being applied to the xmlconf data.

## Running the tests

The core test file (the previously mentioned `xmlconf.test.ts`) is comparatively simple. It has a routine that sets up the streams to process the test data, and a jasmine test "template" which examines whether this stream produced any errors and (where appropriate) whether the generated XML output text are correct. It also simply iterates over all the test data and generates a jasmine test for each xmlconf test.  Easy as can be.

There is a bunch of code, however, in `@test/helper/` which helps this happen. To summarize the key parts:

* `buildTestDetails` This decptively named routine reads in the various data sources in `@test/data/` (the extracted xmlconf data, the set of expected error codes, the fixes to the tests, and the filter information) and generates a final unified set of data about each test to be run (or, in the case of excluded tests, does not include them).

* `TestExpanderStream` is a wrapper around the `expand` module's expansion functionality. This is needed since all external entities actually live in the test metadata, and not on disk (having been assmbled into that metadata by the extraction process, mentioned above).

* `XTokenToXmlStream` takes a stream of `XToken`s and produces a normalized stream of XML formatted strings.  In essence, we dump the xmlconf test source test into our stream, and on the other end we convert what comes back out into another set of text.

There are, of course, other routines in this directory that assist in the work, but if you've gotten this far, I'm sure you can figure them out by yourself.

## To summarize

1. Data in the xmlconf folder is converted into a JSON format and stored in `@test/data/xmlconf` by a build script.
2. When tests are run
   1. `@test/helper/buildTestDetails` combines the data in `xmlconf.json` with the expected error codes, any modifications to the test text, and tests are excluded as needed.
   2. A set of jasmine tests are autogenerated, one for each xmlconf test
   3. Test data is fed into a series of tiramisu streams, including a custom stream that retrieves external entities from the combined data.
   4. The jasmine test evaluates whether the expected errors (if any) were found, and whether the expected output (if any) matched.

## Appendix
While I haven't combed over every one of the tests in close detail, these are some odd things I've noticed:

These are valid, but the condition they say they are checking for is not entirely correctly described.

* ibm-1-1-valid-P77-ibm77v04.xml says that 0xD6 is not a valid 1.0 NameStart charactter, but it looks like it to me (see the production for Letter and BaseChar in rev 4 https://www.w3.org/TR/2006/REC-xml-20060816/#NT-Letter  and even Rev 5: https://www.w3.org/TR/xml/
* Same for ibm-1-1-valid-P77-ibm77v05.xml concerning 0x01FF
* ibm-1-1-valid-P77-ibm77v07.xml which concerns 0xD8
* ibm-1-1-valid-P77-ibm77v10.xml which again concerns 0xF6

These are "wrong":

* x-rmt-008 says for 1.0/1-4 it should fail, but for 1.0/5 it should pass. This is true for revision 2-5, but is not true for 1.0/1.  That is, if the assertion of the test is: if your processor can handle processing revision 5, then a version of 1.7 is legal, as long as it uses no features not found in 1.9.  Well, then, given the syntax for version in 1.0/1, then if you have a processor that can only handle processng revision 1, then 1.7 is legal as long as it only uses 1.0/1 features.
* These three all have what I think are invalid language codes
   * v-lang03: i-klingon-whorf
   * v-lang04: x-dialect-valleygirl
   * ibm-valid-P36-ibm36v01.xml: i-BS-ABCD

These have errors:

* ibm-invalid-P41-ibm41i02.xml : This has "PCDATA" when it should have "#PCDATA"

These are just baffling:

The oasis tests are a bit strange. They ostly come in two flavors: `o-.*pass.*.xml` and `o-.*fail.*.xml`  (there is one lone `e2.xml`).

* The valid tests are all `o-.*pass.*.xml`.
* The not-wf tests are all `o-.*fail.*.xml`
* There is one error test which is labeled `o-.*pass.*.xml`, which is strange.
* The invalid tests are, however, a mixture of `o-.*pass.*.xml` and `o-.*fail.*.xml`. The three fail ones all seem to be legitimate invalid cases.  However, the pass ones also fail, but usually for reasons other than what it seems to be testing, most often because it is missing a DTD. That is, if you ignore the lack of a DTD, they actually do seem to be passing tests.  There are exception to this, such as o-p16pass1 which has wellformed errors in it.  My interprettion is that these were written against a validator that was not enforcing the §3.0.0 Element Valid validity constraint (and in the case of p16pass, was not checking the target correctly), and thus they passed. Later, they were run with a processor that attended to the lack of a DTD and reported them as inalid, and so they were categorized as "invalid" tests. Maybe someone didn't notice that o-p16pass1 was failing due to a WF error.
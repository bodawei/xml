# jest, jasmine and typescript

I've had a bunch problems with defining matchers, globals, etc.  I think I've gotten this resolved, so thought I'd write down what I understand.

1. My tsconfig loads all .ts files. So any plain old .d.ts file lying around is getting loaded by typescript.
2. I'm loading a few special files in build/
   - Build's intention is to be xml-indepndent thingies that are "global" in some way.
3. Because jasmine and jest use the same names, I believe that typescript is using the definitions from jasmine that we have set up.
   - All hell will break loose when I shut off jasmine
   - or when the globals it, etc are exported from the jasmine package.

I'm trying to use the convention
* beforeJest.ts in each module to define matchers that get loaded
* beforeJasmine.ts for things loaded by jasmine (see its own config file)
* Karma used to just load everything I think.  It is going to break if I try to ressurrect it.

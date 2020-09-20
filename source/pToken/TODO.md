instruction parse  CHECK 2.6
   processsingInstruction  parse CHECK xtoken  2.6
   fieldedInstruction  PARSE, CHECK
      xmlDecl  PARSE, CHECK, XTOKEN 2.8
      textDecl  PARSE, CHECK, XTOKEN  4.3.1
(stuff goes int finished doc folder when the whole row is done

Misc
- Probably time to start upgrading to jest.
   - consideration: what happens with assuring browser capabilities?  We probably need karma in here somewhere.
   - Might be good to do with the new/final wave of tests.
   - kill off all the jasmine.objectContaining() which are working around toEqual() limits

After 1.0
- extractToObject vs extractToObjectNoParams.  Can we collapse these? and better enforce the types?
- Still would like extractNoParams() to be non-blocking and have an explict "wait" call

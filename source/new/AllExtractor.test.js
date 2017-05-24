//   describe('extract("all")', () => {
//
//      describe('basic behavior', () => {
//
//         it('calls back with a chunk with a word terminated by a space', () => {
//            source.addText('fox and friends');
//
//            source.extract('all', [ 'x' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'fo' ]);
//         });
//
//         it('calls back with undefined when nothing in the source', () => {
//            source.addText('');
//            source.endText();
//
//            source.extract('all', [ 'x' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.count()).toEqual(1);
//            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
//         });
//
//         it('calls back with a chunk with a range for the extracted text', () => {
//            source.addText('fox and friends');
//
//            source.extract('all', [ 'x' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 2, 0, 2));
//         });
//
//         it('calls back with a chunk with a range for the extracted text accounting for newlines', () => {
//            source.addText('fox\r\nand\nfriends! ');
//
//            source.extract('all', [ '!' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 16, 2, 7));
//         });
//
//      });
//
//      describe('segment spanning', () => {
//
//         it('does not call back when terminator not found in current non-final segment', () => {
//            source.addText('IAmAWord');
//
//            source.extract('all', [ 'x' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.count()).toEqual(0);
//         });
//
//         it('does not call back when no seguments have been added', () => {
//            source.extract('all', [ 'x' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.count()).toEqual(0);
//         });
//
//         it('calls back with undefined at EOF', () => {
//            source.addText('');
//            source.endText();
//            source.extract('all', [ 'x' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.count()).toEqual(1);
//            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
//         });
//
//         it('can cope with several empty segments', () => {
//            source.addText('');
//            source.addText('');
//            source.addText('');
//            source.endText();
//            source.extract('all', [ 'x' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.count()).toEqual(1);
//            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
//         });
//
//         it('calls back with contents that span segments', () => {
//            source.addText('Te');
//            source.addText('xt');
//            source.addText('10');
//            source.endText();
//
//            source.extract('all', [ '0' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text1' ]);
//         });
//
//         it('calls back with all content up to EOF when no match found', () => {
//            source.addText('Te');
//            source.addText('xt');
//            source.addText('20');
//            source.endText();
//
//            source.extract('all', [ '9' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text20' ]);
//         });
//
//         it('calls back with all content up to match even when match at eof', () => {
//            source.addText('Te');
//            source.addText('xt');
//            source.addText('30 ');
//
//            source.extract('all', [ '0' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text3' ]);
//         });
//
//         it('calls back with segment spanning text when match found before EOF', () => {
//            source.addText('Te');
//            source.addText('xt');
//            source.addText('40');
//            source.endText();
//
//            source.extract('all', [ '0' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text4' ]);
//         });
//
//         it('calls back with text even when final needed segment added after the call', () => {
//            source.addText('Te');
//            source.addText('xt');
//            source.extract('all', [ '0' ], pluckedSpy);
//            expect(pluckedSpy.calls.count()).toEqual(0);
//
//            source.addText('50 ');
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text5' ]);
//         });
//
//         it('calls back with text for a terminator that spans multiple segments', () => {
//            source.addText('Te');
//            source.addText('xt<');
//            source.addText('!');
//            source.addText('-');
//            source.addText('-');
//            source.endText();
//            source.extract('all', [ '<!--' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text' ]);
//         });
//
//         it('calls back with the full text if it finds a terminator does not across multiple segments', () => {
//            source.addText('Te');
//            source.addText('xt<');
//            source.addText('!');
//            source.addText('-');
//            source.addText('-X');
//            source.endText();
//            source.extract('all', [ '<!---' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text<!--X' ]);
//         });
//
//         it('calls back with a range for the extracted text accounting for newlines across segments', () => {
//            source.addText('fox\r');
//            source.addText('and\n');
//            source.addText('friends! ');
//
//            source.extract('all', [ '!' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 15, 2, 7));
//         });
//
//      });
//
//      describe('terminators', () => {
//
//         it('calls back with match of the second terminator', () => {
//            source.addText('text10 ');
//
//            source.extract('all', [ '0', '1' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text' ]);
//         });
//
//         it('calls back with match of a multi character terminator', () => {
//            source.addText('text2 234');
//            source.endText();
//
//            source.extract('all', [ '0', '234' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text2 ' ]);
//         });
//
//         it('reports the full value back if the input ends in the middle of a terminator', () => {
//            source.addText('text1<!-');
//            source.endText();
//
//            source.extract('all', [ '<!--' ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text1<!-' ]);
//         });
//
//         it('reports the value minus the terminator if the terminator is at the end', () => {
//            source.addText('text1<!--');
//            source.endText();
//
//            source.extract('all', [ '<!--' ], pluckedSpy);
//            source.extract('all', [ ], pluckedSpy);
//
//            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text1', '<!--' ]);
//         });
//
//      });
//
//   });
//

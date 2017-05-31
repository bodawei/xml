// all
// multimatch
// VersionExtractor

class VersionExtractor extends Extractor {

   constructor(context) {
      super(context);
      this.accumulated = '';
   }

   process(segment) {
      this.accumulated += segment.text.substr(0, 100);
      segment.index = segment.text.length;

      if (this.accumulated.length < 2) {
         return;
      }

      if (this.accumulated.indexOf('<?') === -1) {
         return this;
      }

      const result = VERSION_REGEXP.exec(this.accumulated);
      if (result) {
         this.matches.push(result[2]);
         this.originals.push(result[2]);
         return this;
      }

      if (this.accumulated.length >= 100) {
         return this;
      }
   }

   finish() {
      return this;
   }

}
class MultiMatchExtractor extends Extractor {
   constructor(context, candidates) {
      super(context);

      this.items = candidates.reduce((items, candidate) => {
         items[candidate] = new MatchExtractor(this.context, candidate);
         return items;
      }, {});
      this.longestMatch = 0;

      this.candidates = Object.keys(this.items); // if any duplicate terminators, this removes them
      this.segments = [];
   }

   process(segment) {
      const startIndex = segment.index;
      let unresolved = 0;

      this.segments.push(segment);

      for (const candidate in this.items) {
         const item = this.items[candidate];
         const result = item.process(segment);

         if (!result) {
            unresolved++;
         } else {
            if (result.matches.length > 0) {
               //  Can probably move this up to the beginning of the forloop!
               if (this.longestMatch < candidate.length) {
                  this.longestMatch = candidate.length;
                  item._lastSegment = segment;
                  item._lastIndex = segment.index;
                  this.match = item;
               }
            }

            delete this.items[candidate];
         }

         segment.index = startIndex;
      }

      if (unresolved !== 0) {
         segment.index = segment.text.length;
      } else {
         if (!this.match) {
            return this;
         }

         while (this.segments[0] !== this.match._lastSegment) {
            this.segments.shift();
         }

         this.segments[0].index = this.match._lastIndex;
         this.unusedSegments = this.segments;
         return this.match;
      }

      return;
   }

   finish() {
      return this;
   }
}

class AllExtractor extends Extractor {
   constructor(context, terminators, spaceTerminators = []) {
      super(context);
      this.spaceTerminators = spaceTerminators;
      this.terminators = terminators;

      const terminatorCharsArray = this.spaceTerminators.concat(this.terminators.map((term) => (term[0])));
      const terminatorChars = terminatorCharsArray.join('');
      this.terminatorRegEx = regexMemo[terminatorChars];

      if (!this.terminatorRegEx) {
         const regexString = '[^' + terminatorChars + ']*';
         this.terminatorRegEx = new RegExp(regexString, 'g');
         regexMemo[terminatorChars] = this.terminatorRegEx;
      }

      const spaceTerminatorChars = this._version === 1.0 ? SPACE_TERMINATOR_CHARS_10 :
         SPACE_TERMINATOR_CHARS_11;

      this.terminatorArray = this.terminators;
      if (this.spaceTerminators.length > 0) {
         this.terminatorArray = spaceTerminatorChars.concat(this.terminators);  // ick
      }
   }

   _processSubExtractor(segment) {
      const result = this.subExtractor.process(segment);
      if (!result) {
         return;
      }

      // Reminder: Since Peek() is used, the first segment is always reset back to its initial index
      const origSegment = this.subExtractor._firstSegment;
      this.unusedSegments = this.subExtractor.unusedSegments;
      delete this.subExtractor;

      if (result.matches.length > 0) {
         return this.finish();
      } else {
         this._addCharAndContinue(origSegment);
      }
   }

   _addCharAndContinue(origSegment) {
      this.originals.push(origSegment.text[origSegment.index]);
      origSegment.index ++;
   }

   process(segment) {
      if (this.subExtractor) {
         return this._processSubExtractor(segment);
      }

      this.terminatorRegEx.lastIndex = segment.index;
      const result = this.terminatorRegEx.exec(segment.text);

      if (result[0].length > 0) {
         this.originals.push(result[0]);
         segment.index += result[0].length;

         if (!segment.atEnd()) {
            this.subExtractor = new Peek(this.context, new MultiMatchExtractor(this.context, this.terminatorArray));
            this.subExtractor._firstSegment = segment;

            return this._processSubExtractor(segment);
         }
      }

      if (!segment.atEnd()) {
         return this.finish();
      }
   }

   finish() {
      if (this.subExtractor) {
         // We found no match up to this point. so ask peek to wrap up and continue
         this.subExtractor.finish();
         this.unusedSegments = this.subExtractor.unusedSegments;
         const origSegment = this.subExtractor._firstSegment;
         delete this.subExtractor;

         this._addCharAndContinue(origSegment);
         return;
      }

      if (this.originals.length > 0) {
         this.matches = [ adjustTextAndOffset(this.originals.join(''), this, this._version) ];
      }
      return this;
   }
}

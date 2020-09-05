import { defaultExtractors } from 'extractor';
import { toSToken, STokenSource } from 'sToken';
import { WordListType, parseWordList, parseAllUnassignedValues } from 'token';

import { assignWordList } from '../assignWordList';

describe('assignWordList() (integration)', () => {
   it('fills in a simple list of names', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('( one| %foo;');
      source.endText();

      parseWordList(source, WordListType.NOTATION, (pToken: any) => {
         const sourceTwo = new STokenSource(defaultExtractors);
         sourceTwo.addText('four | five six ||)');
         sourceTwo.endText();

         parseAllUnassignedValues(sourceTwo, true, (unassignedValues: any) => {
            assignWordList(unassignedValues!, pToken);

            expect(pToken).toEqualRangeless({
               open: toSToken('('),
               openSpace: toSToken(' '),
               words: [
                  {
                     word: toSToken('one'),
                     wordSpace: undefined,
                     connector: toSToken('|'),
                     connectorSpace: toSToken(' '),
                  },
                  {
                     word: toSToken('four'),
                     wordSpace: toSToken(' '),
                     connector: toSToken('|'),
                     connectorSpace: toSToken(' '),
                  },
                  {
                     word: toSToken('five'),
                     wordSpace: toSToken(' '),
                     connector: undefined,
                     connectorSpace: undefined,
                  },
                  {
                     word: toSToken('six'),
                     wordSpace: toSToken(' '),
                     connector: toSToken('|'),
                     connectorSpace: undefined,
                  },
                  {
                     word: undefined,
                     wordSpace: undefined,
                     connector: toSToken('|'),
                     connectorSpace: undefined,
                  },
               ],
               close: toSToken(')'),
               closeSpace: undefined,
            });

            done();
         });
      });
   });
});

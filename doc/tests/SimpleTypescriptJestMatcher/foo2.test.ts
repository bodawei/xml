import { describe, expect, it } from '@jest/globals';
import { climbingETA} from './foo';

expect.extend({
    toBeWithinOneMinuteOf(got, expected) {
      const oneMinute = 60 * 1000; // a minute in milliseconds
  
      let timeDiff = Math.abs(expected.getTime() - got.getTime());
      let timeDiffInSeconds = timeDiff / 1000;
  
      let pass = timeDiff < oneMinute;
      let message = () =>
        `${got} should be within a minute of ${expected}, ` +
          `actual difference: ${timeDiffInSeconds.toFixed(1)}s`;
  
      return { pass, message }
    }
  });

describe('foo', () => {
    test('it takes ten minutes to climb 130 feet', () => {
        const threeOClock = new Date();
        const threeTen = new Date(threeOClock.getTime() + 10 * 1000 * 60);
        
        let eta = climbingETA(threeOClock, 130);
        const foo = expect(eta);

        expect(eta).toBeWithinOneMinuteOfTwo(threeTen);
      });      
})
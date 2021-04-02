/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { EntityId, XmlWarning, Range } from 'basic';
import { ParseToken } from 'pToken';

import { STokenSource, strOrBlank, toSToken } from 'sToken';
import { CommentPToken, ConditionalClosePToken, ConditionalPToken } from 'token';
import { makeTextPToken } from 'token-test';

import { ConditionalBodyProcessor } from '../ConditionalBodyProcessor';

type DeliverPToken = (token: ParseToken | undefined, expanded: () => void) => void;

describe('ConditionalBodyProcessor (unit)', () => {
   let expandToken: jest.MockedFunction<DeliverPToken>;
   let bodyProcessor: jest.MockedFunction<
      (sTokenSource: STokenSource, handleNextToken: DeliverPToken) => void
   >;
   let source: STokenSource;

   beforeEach(() => {
      expandToken = jest.fn();
      bodyProcessor = jest.fn();
      source = new STokenSource();
   });

   it('immediately sets up the body processor to start processing any text we receiver', () => {
      new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);

      expect(bodyProcessor).toHaveBeenCalledWith(source, expect.any(Function));
   });

   it('isDone initially returns false', () => {
      const cbp = new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);

      expect(cbp.isDone).toEqual(false);
   });

   it('isDone returns true if a non-text / non-error token is handled', () => {
      const cbp = new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);

      cbp.handleToken(new ConditionalClosePToken({ open: toSToken(']]>') }), () => {});

      expect(cbp.isDone).toEqual(true);
   });

   it('immediately passes an error token to the expander', () => {
      const expanded = () => {};
      const token = new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      const cbp = new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);

      cbp.handleToken(token, expanded);

      expect(expandToken).toHaveBeenCalledWith(token, expanded);
   });

   it('immediately passes a text token to the expander if we are already done', () => {
      const expanded = () => {};
      const token = makeTextPToken('foo');
      const cbp = new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);
      cbp.handleToken(new ConditionalClosePToken({ open: toSToken(']]>') }), () => {});

      cbp.handleToken(token, expanded);

      expect(expandToken).toHaveBeenCalledWith(token, expanded);
   });

   it('does not pass a text token to the expander if we are not done', () => {
      const token = makeTextPToken('foo');
      const cbp = new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);

      cbp.handleToken(token, () => {});

      expect(expandToken).not.toHaveBeenCalled();
   });

   it('adds text from a text ptoken to the sTokenSource', (done) => {
      const source = new STokenSource();
      const token = makeTextPToken('foo');
      source.addText('x', new Range(new EntityId(), 0, 0, 0, 3, 0, 3)); // work around a bug
      const cbp = new ConditionalBodyProcessor(source, bodyProcessor, expandToken);

      cbp.handleToken(token, () => {});
      source.endText();

      source.extract('all', (sToken) => {
         expect(strOrBlank(sToken)).toEqual('xfoo');
         done?.();
      });
   });

   describe('text processing', () => {
      it('passes tokens directly on', () => {
         const handled = () => {};
         const comment = new CommentPToken({ open: toSToken('<!--') });
         new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);
         const handler = bodyProcessor.mock.calls[0][1];

         handler(comment, handled);

         expect(expandToken).toHaveBeenCalledWith(comment, handled);
      });

      it('passes a conditional start through', () => {
         const handled = () => {};
         const conditional = new ConditionalPToken({ open: toSToken('<![') });
         new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);
         const handler = bodyProcessor.mock.calls[0][1];

         handler(conditional, handled);

         expect(expandToken).toHaveBeenCalledWith(conditional, handled);
      });

      it('responds that it has handled the end of the token stream', () => {
         const handled = jest.fn();
         const cbp = new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);
         const handler = bodyProcessor.mock.calls[0][1];

         handler(undefined, handled);

         expect(handled).toHaveBeenCalled();
         expect(cbp.isDone).toEqual(true);
      });

      it('delivers a previously terminating token once the end of the token stream has been reached', () => {
         const handled = jest.fn();
         const expanded = jest.fn();
         const close = new ConditionalClosePToken({ open: toSToken(']]>') });
         const cbp = new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);
         const handler = bodyProcessor.mock.calls[0][1];
         cbp.handleToken(close, expanded);

         handler(undefined, handled);

         expect(expandToken).toHaveBeenCalledWith(close, expect.any(Function));
      });

      it('wraps up all callbacks once the end of the token stream has been reached after receiving an end', () => {
         const handled = jest.fn();
         const expanded = jest.fn();
         const close = new ConditionalClosePToken({ open: toSToken(']]>') });
         const cbp = new ConditionalBodyProcessor(new STokenSource(), bodyProcessor, expandToken);
         const handler = bodyProcessor.mock.calls[0][1];
         cbp.handleToken(close, expanded);
         // reminder: we have not yet handled the close
         expect(expanded).not.toHaveBeenCalled();

         handler(undefined, handled);
         const expandCb = expandToken.mock.calls[0][1];
         expandCb();

         expect(expanded).toHaveBeenCalled();
         expect(handled).toHaveBeenCalled();
         expect(cbp.isDone).toEqual(true);
      });
   });
});

import { describe, expect, it } from 'vitest';

import { buildAccountPayload } from './accountPayload';

describe('buildAccountPayload', () => {
   it('builds an account payload using balance', () => {
      const payload = buildAccountPayload({
         name: 'Savings',
         balance: '250.00',
         icon: 'landmark',
      });

      expect(payload).toEqual({
         name: 'Savings',
         balance: 250,
         icon: 'landmark',
      });

      expect(payload).not.toHaveProperty('initial_balance');
   });

   it('uses zero when balance is empty', () => {
      const payload = buildAccountPayload({
         name: 'Savings',
         balance: '',
         icon: 'landmark',
      });

      expect(payload.balance).toBe(0);
   });
});

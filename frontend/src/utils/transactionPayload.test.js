import { describe, expect, it } from 'vitest';

import { buildTransactionPayload } from './transactionPayload';

describe('buildTransactionPayload', () => {
   it('builds an income payload', () => {
      const payload = buildTransactionPayload(
         {
            date: '2026-10-06',
            name: 'Salary',
            amount: '1500.50',
            account_id: '3',
            checked: true,
            counterparty: 'Employer',
            subcategory_id: '7',
         },
         'income',
         null,
      );

      expect(payload).toEqual({
         date: '2026-10-06',
         name: 'Salary',
         amount: 1500.5,
         transaction_type: 'income',
         account_id: 3,
         checked: true,
         counterparty: 'Employer',
         subcategory_id: 7,
      });
   });

   it('builds an expense payload', () => {
      const payload = buildTransactionPayload(
         {
            date: '2026-10-06',
            name: 'Fuel',
            amount: '80.00',
            amount_to_receive: '10.00',
            account_id: '3',
            checked: true,
            counterparty: 'Galp',
            subcategory_id: '9',
         },
         'expense',
         null,
      );

      expect(payload).toEqual({
         date: '2026-10-06',
         name: 'Fuel',
         amount: 80,
         transaction_type: 'expense',
         account_id: 3,
         checked: true,
         counterparty: 'Galp',
         amount_to_receive: 10,
         subcategory_id: 9,
      });
   });

   it('builds a transfer payload', () => {
      const payload = buildTransactionPayload(
         {
            date: '2026-10-06',
            name: 'Transfer to savings',
            amount: '200.00',
            account_id: '3',
            transfer_account_id: '4',
            checked: true,
         },
         'transfer',
         {
            id: 12,
         },
      );

      expect(payload).toEqual({
         date: '2026-10-06',
         name: 'Transfer to savings',
         amount: 200,
         transaction_type: 'transfer',
         account_id: 3,
         checked: true,
         transfer_account_id: 4,
         subcategory_id: 12,
      });
   });
});

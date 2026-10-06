export function buildTransactionPayload(
   form,
   type,
   internalTransferSubcategory,
) {
   const amount = Number(form.amount);

   const payload = {
      date: form.date,
      name: form.name.trim(),
      amount,
      transaction_type: type,
      account_id: Number(form.account_id),
      checked: Boolean(form.checked),
   };

   if (type === 'income') {
      const counterparty = form.counterparty.trim();

      payload.counterparty = counterparty || null;

      if (form.subcategory_id) {
         payload.subcategory_id = Number(form.subcategory_id);
      }
   }

   if (type === 'expense') {
      const counterparty = form.counterparty.trim();

      payload.counterparty = counterparty || null;
      payload.amount_to_receive =
         form.amount_to_receive === ''
            ? 0
            : Number(form.amount_to_receive);

      if (form.subcategory_id) {
         payload.subcategory_id = Number(form.subcategory_id);
      }
   }

   if (type === 'transfer') {
      payload.transfer_account_id = Number(form.transfer_account_id);

      if (internalTransferSubcategory) {
         payload.subcategory_id = Number(internalTransferSubcategory.id);
      }
   }

   return payload;
}

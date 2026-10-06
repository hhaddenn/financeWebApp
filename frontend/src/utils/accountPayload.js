export function buildAccountPayload(form) {
   const balance =
      String(form.balance).trim() === ''
         ? 0
         : Number(form.balance);

   return {
      name: form.name.trim(),
      icon: form.icon,
      balance,
   };
}

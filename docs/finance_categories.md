# Finance App Categories & Subcategories

## Expense Categories

### Housing (`house`)
- Rent (`house`)
- Mortgage (`building`)
- Property Tax (`receipt`)
- Home Insurance (`shield`)
- Maintenance (`hammer`)
- Utilities (`zap`)

### Transportation (`car`)
- Fuel (`fuel`)
- Mechanic (`wrench`)
- Parking (`square-parking`)
- Tolls (`waypoints`)
- Insurance (`shield-check`)
- Public Transport (`bus`)
- Car Loan (`badge-euro`)

### Food (`utensils-crossed`)
- Groceries (`shopping-cart`)
- Restaurants (`utensils`)
- Coffee (`coffee`)
- Delivery (`bike`)

### Health (`heart-pulse`)
- Doctor (`stethoscope`)
- Pharmacy (`pill`)
- Health Insurance (`shield-plus`)
- Gym (`dumbbell`)

### Shopping (`shopping-bag`)
- Clothes (`shirt`)
- Electronics (`smartphone`)
- Furniture (`sofa`)
- General Shopping (`shopping-basket`)

### Entertainment (`gamepad-2`)
- Movies (`film`)
- Games (`gamepad-2`)
- Streaming (`tv`)
- Books (`book-open`)
- Music (`music`)

### Education (`graduation-cap`)
- Courses (`monitor-play`)
- Books (`book-open`)
- School Fees (`school`)

### Travel (`plane`)
- Flights (`plane`)
- Hotels (`hotel`)
- Transport (`train`)
- Activities (`map`)

### Family (`users`)
- Children (`baby`)
- Childcare (`heart-handshake`)
- Gifts (`gift`)

### Financial (`landmark`)
- Bank Fees (`building-2`)
- Loan Payments (`badge-euro`)
- Credit Card Fees (`credit-card`)
- Taxes (`receipt-text`)

### Pets (`paw-print`)
- Food (`bone`)
- Vet (`syringe`)
- Accessories (`paw-print`)

### Miscellaneous (`circle-help`)
- Other (`circle-help`)

---

## Income Categories

### Salary (`briefcase`)
- Salary (`wallet`)
- Bonus (`badge-plus`)
- Overtime (`clock-3`)

### Investments (`chart-line`)
- Dividends (`coins`)
- Interest (`percent`)
- Capital Gains (`trending-up`)

### Business (`building`)
- Sales (`shopping-cart`)
- Consulting (`briefcase-business`)
- Freelance (`laptop`)

### Gifts (`gift`)
- Cash Gifts (`gift`)
- Donations Received (`hand-heart`)

### Refunds (`rotate-ccw`)
- Product Refund (`package-open`)
- Tax Refund (`receipt`)

### Other Income (`circle-plus`)
- Other (`circle-plus`)

---

## Recommended Account Icons

- Bank Account (`landmark`)
- Savings Account (`piggy-bank`)
- Cash (`wallet`)
- Credit Card (`credit-card`)
- Investment Account (`chart-line`)
- Crypto Wallet (`bitcoin`)
- Loan (`badge-euro`)

---

## Notes

- Categories should be global and seeded into the database.
- Both categories and subcategories should have icon keys stored as strings.
- Transactions should reference a Subcategory.
- Category is obtained through `transaction.subcategory.category`.
- Transfers normally do not need categories.
- Users can still create custom tags later without affecting the category structure.

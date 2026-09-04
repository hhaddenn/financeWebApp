import transactions from '../../../../data/transactions.json';
import Transaction from './TransactionCard';

export default function TransactionList() {
	return (
		<div className="account-grid">
      {transactions.map((transaction) => (
        <Transaction key={transaction.id} transaction={transaction} />
      ))}
    </div>
	);
}

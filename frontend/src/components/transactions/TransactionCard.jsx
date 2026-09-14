export default function TransactionCard({ transaction }) {

	function handleEditClick() {
		// TODO BUILD FUNCTION TO EDIT
	}

	function handleDeleteClick() {
		// TODO BUILD FUNCTION TO DELETE
	}


  return (
    <article className="account-card">
      <div className="account-card-header">
        <h2>{transaction.name}</h2>
      </div>

      <div className="account-balance">
        <span>CounterParty</span>
        <strong>{transaction.counterparty}</strong>
        <span>Description</span>
        <strong>{transaction.description}</strong>
        <span>Type</span>
        <strong>{transaction.category_type}</strong>
        <span>Amount</span>
        <strong>${transaction.amount}</strong>
        <span>Date</span>
        <strong>{transaction.date}</strong>
      </div>

      <button className="account-edit" onClick={handleEditClick}>Edit</button>
		<button className="account-delete" onClick={handleDeleteClick}>Delete</button>
    </article>
  );
}

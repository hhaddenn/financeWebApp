export default function AccountCard({ account }) {

	function handleEditClick() {
		// TODO BUILD FUNCTION TO EDIT
	}

	function handleDeleteClick() {
		// TODO BUILD FUNCTION TO DELETE
	}


  return (
    <article className="account-card">
      <div className="account-card-header">
        <h2>{account.name}</h2>

        <span className="account-icon">{account.icon}</span>
      </div>

      <div className="account-balance">
        <span>Balance</span>
        <strong>${account.balance}</strong>
      </div>

      <button className="account-edit" onClick={handleEditClick}>Edit</button>
		<button className="account-delete" onClick={handleDeleteClick}>Delete</button>
    </article>
  );
}

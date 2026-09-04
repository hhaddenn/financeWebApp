export default function SubCategoryCard({ subcategory }) {

	function handleEditClick() {
		// TODO BUILD FUNCTION TO EDIT
	}

	function handleDeleteClick() {
		// TODO BUILD FUNCTION TO DELETE
	}


  return (
    <article className="account-card">
      <div className="account-card-header">
        <h2>{subcategory.name}</h2>

        <span className="account-icon">{subcategory.icon}</span>
      </div>

      <button className="account-edit" onClick={handleEditClick}>Edit</button>
		<button className="account-delete" onClick={handleDeleteClick}>Delete</button>
    </article>
  );
}

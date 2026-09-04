export default function CategoryCard({ category }) {

	function handleEditClick() {
		// TODO BUILD FUNCTION TO EDIT
	}

	function handleDeleteClick() {
		// TODO BUILD FUNCTION TO DELETE
	}


  return (
    <article className="account-card">
      <div className="account-card-header">
        <h2>{category.name}</h2>

        <span className="account-icon">{category.icon}</span>
      </div>

      <div className="account-balance">
        <span>Description</span>
        <strong>{category.description}</strong>
        <span>Type</span>
        <strong>{category.category_type}</strong>
      </div>

      <button className="account-edit" onClick={handleEditClick}>Edit</button>
		<button className="account-delete" onClick={handleDeleteClick}>Delete</button>
    </article>
  );
}

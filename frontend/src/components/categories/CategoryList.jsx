import categories from '../../../../data/categories.json';
import CategoryCard from './CategoryCard';

export default function CategoryList() {
	return (
		<div className="account-grid">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
	);
}

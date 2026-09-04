import subcategories from '../../../../data/subcategories.json';
import SubCategoryCard from './SubCategoryCard';

export default function SubCategoryList() {
	return (
		<div className="account-grid">
      {subcategories.map((subcategory) => (
        <SubCategoryCard key={subcategory.id} subcategory={subcategory} />
      ))}
    </div>
	);
}

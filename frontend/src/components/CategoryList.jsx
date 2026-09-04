import categories from '../../../data/categories.json';

export default function CategoryList() {
	return (
		<ol>
			{categories.map((category) => (
				<li>{category.name}</li>
			))}
		</ol>
	);
}

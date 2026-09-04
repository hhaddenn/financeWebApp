import accounts from '../../../data/accounts.json';
import Account from './Account';

export default function AccountList() {
	return (
		<ol>
			{accounts.map((account) => (
				<Account account={account}/>
			))}
		</ol>
	);
}

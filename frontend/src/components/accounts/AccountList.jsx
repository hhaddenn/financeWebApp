import accounts from "../../../../data/accounts.json";
import AccountCard from "./AccountCard";

export default function AccountList() {
  return (
    <div className="account-grid">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}

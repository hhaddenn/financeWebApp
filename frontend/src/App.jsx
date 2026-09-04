import AccountList from "./components/accounts/AccountList";
import CategoryList from "./components/categories/CategoryList";
import SubCategoryList from "./components/subcategories/SubCategoryList";
import TransactionList from "./components/transactions/TransactionList";
import "./App.css";

function App() {
  return (
    <>
      <section>
        <h2>Accounts</h2>
        <AccountList />
      </section>
      <section>
        <h2>Categories</h2>
        <CategoryList />
      </section>
      <section>
        <h2>Subcategories</h2>
        <SubCategoryList />
      </section>
      <section>
        <h2>Transactions</h2>
        <TransactionList />
      </section>
    </>
  );
}

export default App;

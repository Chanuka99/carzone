import NewCustomerClient from "./NewCustomerClient";

export default async function NewCustomerPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Customer</h1>
          <p className="page-subtitle">Register a new customer</p>
        </div>
      </div>
      <NewCustomerClient />
    </div>
  );
}

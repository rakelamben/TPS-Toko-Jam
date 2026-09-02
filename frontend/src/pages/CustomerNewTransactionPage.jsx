import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import TransactionBuilder from "../components/TransactionBuilder";

export default function CustomerNewTransactionPage() {
  const { customer } = useSession();
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Belanja</h1>
          <p>Cari barang, tambahkan ke keranjang, lalu buat transaksi.</p>
        </div>
      </div>
      <TransactionBuilder
        customerId={customer.customer_id}
        onCreated={(invoice) =>
          navigate(`/customer/transactions/${invoice.transaksi.transaction_id}`)
        }
      />
    </div>
  );
}

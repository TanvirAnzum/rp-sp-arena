import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import SellView from "../food/SellView";
import SalesHistory from "../food/SalesHistory";
import ManageProducts from "../food/ManageProducts";
import styles from "../food/FoodPage.module.css";

export default function OtherItemsPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState("sell");

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Other Items</h2>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "sell" ? styles.active : ""}`} onClick={() => setTab("sell")}>
            Sell
          </button>
          <button className={`${styles.tab} ${tab === "history" ? styles.active : ""}`} onClick={() => setTab("history")}>
            History
          </button>
          {isOwner && (
            <button className={`${styles.tab} ${tab === "products" ? styles.active : ""}`} onClick={() => setTab("products")}>
              Products
            </button>
          )}
        </div>
      </div>

      {tab === "sell"     && <SellView     productsCol="otherProducts" salesCol="otherSales" moduleKey="otherItems" />}
      {tab === "history"  && <SalesHistory salesCol="otherSales" />}
      {tab === "products" && isOwner && <ManageProducts productsCol="otherProducts" label="Item" />}
    </div>
  );
}

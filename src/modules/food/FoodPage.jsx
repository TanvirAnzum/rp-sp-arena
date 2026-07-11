import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import SellView from "./SellView";
import SalesHistory from "./SalesHistory";
import ManageProducts from "./ManageProducts";
import styles from "./FoodPage.module.css";

export default function FoodPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState("sell");

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Food Sales</h2>
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

      {tab === "sell"     && <SellView     productsCol="foodProducts" salesCol="foodSales" moduleKey="food" />}
      {tab === "history"  && <SalesHistory salesCol="foodSales" />}
      {tab === "products" && isOwner && <ManageProducts productsCol="foodProducts" label="Food" />}
    </div>
  );
}

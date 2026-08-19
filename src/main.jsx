import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase, supabaseConfigured } from "./lib/supabase";
import "./styles.css";

const medicines = [
  { id: 1, name: "Dolo 650", generic: "Paracetamol 650 mg", price: 32, rx: false, category: "Pain & Fever", symptoms: "fever headache body pain" },
  { id: 2, name: "Crocin Advance", generic: "Paracetamol 500 mg", price: 28, rx: false, category: "Pain & Fever", symptoms: "fever headache pain" },
  { id: 3, name: "Azithral 500", generic: "Azithromycin 500 mg", price: 118, rx: true, category: "Antibiotic", symptoms: "bacterial infection" },
  { id: 4, name: "Cetirizine 10 mg", generic: "Cetirizine", price: 22, rx: false, category: "Allergy", symptoms: "allergy sneezing itching" },
  { id: 5, name: "Pantop 40", generic: "Pantoprazole 40 mg", price: 92, rx: true, category: "Gastric Care", symptoms: "acidity gas heartburn" },
  { id: 6, name: "ORS Lemon", generic: "Oral Rehydration Salts", price: 25, rx: false, category: "Hydration", symptoms: "dehydration weakness loose motion" }
];

const stores = [
  { id: 1, name: "Apollo Pharmacy", distance: "1.2 km", time: "15–25 min", rating: "4.7", phone: "040-40000001" },
  { id: 2, name: "MedPlus", distance: "1.8 km", time: "20–30 min", rating: "4.6", phone: "040-40000002" },
  { id: 3, name: "Sri Sai Medicals", distance: "2.4 km", time: "25–35 min", rating: "4.5", phone: "040-40000003" }
];

const pharmacyPrices = {
  "Dolo 650": { "Apollo Pharmacy": 32, MedPlus: 34, "Sri Sai Medicals": 31 },
  "Crocin Advance": { "Apollo Pharmacy": 28, MedPlus: 29, "Sri Sai Medicals": 27 },
  "Azithral 500": { "Apollo Pharmacy": 118, MedPlus: 121, "Sri Sai Medicals": 115 },
  "Cetirizine 10 mg": { "Apollo Pharmacy": 22, MedPlus: 24, "Sri Sai Medicals": 21 },
  "Pantop 40": { "Apollo Pharmacy": 92, MedPlus: 95, "Sri Sai Medicals": 89 },
  "ORS Lemon": { "Apollo Pharmacy": 25, MedPlus: 26, "Sri Sai Medicals": 24 }
};

const initialStock = Object.fromEntries(
  stores.map((store) => [
    store.name,
    Object.fromEntries(medicines.map((medicine) => [medicine.name, 5]))
  ])
);

function App() {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [view, setView] = useState("home");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [mode, setMode] = useState("pickup");
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [role, setRole] = useState("Customer");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mf_orders") || "[]"); } catch { return []; }
  });

  const [pharmacyStock, setPharmacyStock] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mf_stock") || "null") || initialStock; } catch { return initialStock; }
  });

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setLoggedIn(true);
        setUserEmail(data.session.user.email || "");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
      setUserEmail(session?.user?.email || "");
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => { localStorage.setItem("mf_orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem("mf_stock", JSON.stringify(pharmacyStock)); }, [pharmacyStock]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter((m) => `${m.name} ${m.generic} ${m.category} ${m.symptoms}`.toLowerCase().includes(q));
  }, [query]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function addToCart(medicine) {
    if (medicine.rx && !loggedIn) {
      alert("This medicine requires a prescription/login.");
      setLoginOpen(true);
      return;
    }
    setCart((current) => {
      const found = current.find((x) => x.id === medicine.id);
      if (found) return current.map((x) => x.id === medicine.id ? { ...x, qty: x.qty + 1 } : x);
      return [...current, { ...medicine, qty: 1 }];
    });
  }

  function changeQty(id, delta) {
    setCart((current) => current.map((x) => x.id === id ? { ...x, qty: x.qty + delta } : x).filter((x) => x.qty > 0));
  }

  async function sendOtp() {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return alert("Enter a valid email address.");
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.");
      const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail, options: { shouldCreateUser: true } });
      if (error) throw error;
      setOtpSent(true);
      alert("OTP / email verification has been sent to your email.");
    } catch (error) {
      console.error(error);
      alert(error?.message || "Could not send OTP.");
    } finally { setLoading(false); }
  }

  async function verifyOtp() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    if (!cleanOtp) return alert("Enter the OTP received on your email.");
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.auth.verifyOtp({ email: cleanEmail, token: cleanOtp, type: "email" });
      if (error) throw error;
      if (data?.user) {

  // 🔐 Verify Pharmacy authorization
  if (role === "Pharmacy") {
    const { data: pharmacyVerified, error: pharmacyError } =
      await supabase.rpc("check_pharmacy_verified", {
        p_email: cleanEmail,
      });

    if (pharmacyError) {
      console.error(pharmacyError);
      throw new Error("Pharmacy verification failed.");
    }

    if (!pharmacyVerified) {
      await supabase.auth.signOut();

      localStorage.removeItem("mf_role");
      setLoggedIn(false);
      setUserEmail("");

      throw new Error(
        "This email is not an approved Pharmacy account."
      );
    }
  }

  // ✅ Login successful
  localStorage.setItem("mf_role", role);
  setLoggedIn(true);
  setUserEmail(data.user.email || cleanEmail);
  setLoginOpen(false);
  setOtp("");
  setOtpSent(false);

  setView(
    role === "Pharmacy"
      ? "pharmacy"
      : "home"
  );
}
    } catch (error) {
      console.error(error);
      alert(error?.message || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  }

  async function logout() {
    if (supabaseConfigured && supabase) await supabase.auth.signOut();
    localStorage.removeItem("mf_role");
    setLoggedIn(false);
    setUserEmail("");
    setView("home");
  }

  async function placeOrder() {
    if (!cart.length) return alert("Your cart is empty.");
    if (!loggedIn) return setLoginOpen(true);
    const order = {
      id: `MF-${Date.now()}`,
      email: userEmail,
      pharmacy: selectedStore?.name || "Nearest available pharmacy",
      status: "Placed",
      mode,
      total,
      items: cart.map((item) => ({ name: item.name, qty: item.qty, price: item.price })),
      createdAt: new Date().toISOString()
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    setSelectedStore(null);
    setView("orders");
    if (supabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("orders").insert({ order_id: order.id, total: order.total, mode: order.mode, status: order.status });
        if (error) console.log("Order saved locally:", error);
      } catch (error) { console.log("Order saved locally:", error); }
    }
  }

  async function updateStock(storeName, medicineName, value) {
  const qty = Math.max(0, Number(value) || 0);

  // Screen par quantity update
  setPharmacyStock((current) => ({
    ...current,
    [storeName]: {
      ...current[storeName],
      [medicineName]: qty,
    },
  }));

  // Supabase save
  if (!supabaseConfigured || !supabase || !userEmail) {
    alert("Supabase login required.");
    return;
  }

  try {
    const { error } = await supabase
      .from("pharmacy_stock")
      .upsert(
        {
          pharmacy_email: userEmail,
          store_name: storeName,
          medicine_name: medicineName,
          quantity: qty,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "pharmacy_email,store_name,medicine_name",
        }
      );

    if (error) throw error;

    alert(`${medicineName} stock saved: ${qty}`);
  } catch (error) {
    console.error("Stock save error:", error);
    alert("Stock save nahi hua: " + error.message);
  }
}

  return (
    <div className="mf-app">
      <header className="mf-header">
        <button className="brand" onClick={() => setView("home")}><span className="brand-icon">✚</span><span>MediFind</span></button>
        <div className="search-wrap"><input value={query} onChange={(e) => { setQuery(e.target.value); setView("home"); }} placeholder="Search medicine, generic name or symptom..." /><span>⌕</span></div>
        <nav>
          <button onClick={() => setView("home")}>Home</button>
          <button onClick={() => setView("orders")}>Orders</button>
          {loggedIn && role === "Pharmacy" && <button onClick={() => setView("pharmacy")}>Pharmacy</button>}
          {!loggedIn ? <button className="primary" onClick={() => setLoginOpen(true)}>Login</button> : <button className="profile" onClick={logout}>{userEmail || "Account"} · Logout</button>}
        </nav>
      </header>

      <main>
        {view === "home" && <>
          <section className="hero"><div><p className="eyebrow">MEDICINE FINDER</p><h1>Find medicines near you.</h1><p>Search medicines, compare nearby pharmacy prices and place an order for pickup or delivery.</p><button className="primary large" onClick={() => document.querySelector(".search-wrap input")?.focus()}>Search medicines</button></div><div className="hero-card"><div className="hero-cross">✚</div><strong>Safe & simple</strong><span>Prescription medicines are clearly marked.</span></div></section>
          <section className="section"><div className="section-title"><div><h2>{query ? "Search results" : "Popular medicines"}</h2><p>{results.length} medicines available</p></div></div><div className="medicine-grid">
            {results.map((medicine) => <article className="medicine-card" key={medicine.id}><div className="medicine-top"><span className="pill">{medicine.category}</span>{medicine.rx && <span className="rx">Rx</span>}</div><h3>{medicine.name}</h3><p>{medicine.generic}</p><small>For: {medicine.symptoms}</small><div className="medicine-bottom"><strong>₹{medicine.price}</strong><button onClick={() => { setSelectedMedicine(medicine); setView("medicine"); }}>View</button><button className="primary" onClick={() => addToCart(medicine)}>Add</button></div></article>)}
          </div></section>
        </>}

        {view === "medicine" && selectedMedicine && <section className="section detail"><button className="back" onClick={() => setView("home")}>← Back</button><div className="detail-card"><span className="pill">{selectedMedicine.category}</span>{selectedMedicine.rx && <span className="rx">Prescription required</span>}<h1>{selectedMedicine.name}</h1><p>{selectedMedicine.generic}</p><h2>Compare nearby prices</h2><div className="store-list">
          {stores.map((store) => { const price = pharmacyPrices[selectedMedicine.name]?.[store.name] ?? selectedMedicine.price; const stock = pharmacyStock[store.name]?.[selectedMedicine.name] ?? 0; return <div className="store-row" key={store.id}><div><strong>{store.name}</strong><span>{store.distance} · {store.time} · ★ {store.rating}</span></div><div><b>₹{price}</b><small>{stock > 0 ? `${stock} in stock` : "Out of stock"}</small><button disabled={stock <= 0} onClick={() => { setSelectedStore(store); addToCart({ ...selectedMedicine, price }); }}>Add</button></div></div>; })}
        </div></div></section>}

        {view === "cart" && <section className="section"><button className="back" onClick={() => setView("home")}>← Continue shopping</button><h1>Your cart</h1>{!cart.length ? <div className="empty">Your cart is empty.</div> : <><div className="cart-list">{cart.map((item) => <div className="cart-row" key={item.id}><div><strong>{item.name}</strong><span>₹{item.price} each</span></div><div className="qty"><button onClick={() => changeQty(item.id, -1)}>−</button><b>{item.qty}</b><button onClick={() => changeQty(item.id, 1)}>+</button></div><strong>₹{item.price * item.qty}</strong></div>)}</div><div className="checkout"><div><label>Order mode</label><select value={mode} onChange={(e) => setMode(e.target.value)}><option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></div><div className="total">Total: ₹{total}</div><button className="primary large" onClick={placeOrder}>Place order</button></div></>}</section>}

        {view === "orders" && <section className="section"><div className="section-title"><div><h2>Your orders</h2><p>{orders.length} order(s)</p></div></div>{!orders.length ? <div className="empty">No orders yet.</div> : <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div><strong>{order.id}</strong><span>{new Date(order.createdAt).toLocaleString()}</span></div><div><span>{order.pharmacy} · {order.mode}</span><b>₹{order.total}</b></div><span className="status">{order.status}</span></article>)}</div>}</section>}

        {view === "pharmacy" && (
  <section className="section">
    <div className="section-title">
      <div>
        <h2>Pharmacy stock</h2>
        <p>Update available quantities for your pharmacy.</p>
      </div>
    </div>

    {stores.map((store) => (
      <div className="stock-card" key={store.name}>
        <h3>{store.name}</h3>

        <div className="stock-grid">
          {medicines.map((medicine) => (
            <div className="stock-item" key={medicine.name}>
              <span>{medicine.name}</span>

              <input
                type="number"
                min="0"
                value={
                  pharmacyStock[store.name]?.[medicine.name] ?? 0
                }
                onChange={(e) =>
                  updateStock(
                    store.name,
                    medicine.name,
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  saveStock(store.name, medicine.name)
                }
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </div>
    ))}
  </section>
)}
      </main>

      <button className="cart-fab" onClick={() => setView("cart")}>🛒 Cart <span>{cart.reduce((n, x) => n + x.qty, 0)}</span></button>

      {loginOpen && <div className="modal-backdrop" onClick={() => setLoginOpen(false)}><div className="login-modal" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setLoginOpen(false)}>×</button><div className="login-icon">✚</div><h2>Login to MediFind</h2><p>Log in to place orders and access your MediFind account.</p><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" /><label>Account type</label><select value={role} onChange={(e) => setRole(e.target.value)}><option value="Customer">Customer</option><option value="Pharmacy">Pharmacy</option></select>{!otpSent ? <button className="primary full" disabled={loading} onClick={sendOtp}>{loading ? "Sending..." : "Send OTP"}</button> : <><label>OTP</label><input inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Enter OTP from email" /><button className="primary full" disabled={loading} onClick={verifyOtp}>{loading ? "Verifying..." : "Verify & Login"}</button><button className="secondary full" onClick={sendOtp} disabled={loading}>Resend OTP</button></>}<small className="login-note">OTP is handled by Supabase Auth. Never put SMTP/API secrets in main.jsx.</small></div></div>}

      <footer><strong>MediFind</strong><span>Find medicines. Compare pharmacies. Order simply.</span></footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

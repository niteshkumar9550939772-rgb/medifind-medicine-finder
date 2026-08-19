import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { supabase, supabaseConfigured } from "./lib/supabase";

/* =========================================================
   MEDICINES
========================================================= */

const medicines = [
  {
    id: 1,
    name: "Dolo 650",
    generic: "Paracetamol 650 mg",
    price: 32,
    rx: false,
    stores: 4,
    category: "Pain & Fever",
    symptoms: "fever headache body pain",
  },
  {
    id: 2,
    name: "Crocin Advance",
    generic: "Paracetamol 500 mg",
    price: 28,
    rx: false,
    stores: 3,
    category: "Pain & Fever",
    symptoms: "fever headache pain",
  },
  {
    id: 3,
    name: "Azithral 500",
    generic: "Azithromycin 500 mg",
    price: 118,
    rx: true,
    stores: 3,
    category: "Antibiotic",
    symptoms: "bacterial infection",
  },
  {
    id: 4,
    name: "Cetirizine 10 mg",
    generic: "Cetirizine",
    price: 22,
    rx: false,
    stores: 2,
    category: "Allergy",
    symptoms: "allergy sneezing itching",
  },
  {
    id: 5,
    name: "Pantop 40",
    generic: "Pantoprazole 40 mg",
    price: 92,
    rx: true,
    stores: 5,
    category: "Gastric Care",
    symptoms: "acidity gas heartburn",
  },
  {
    id: 6,
    name: "ORS Lemon",
    generic: "Oral Rehydration Salts",
    price: 25,
    rx: false,
    stores: 3,
    category: "Hydration",
    symptoms: "dehydration weakness loose motion",
  },
];

/* =========================================================
   PHARMACIES
========================================================= */

const stores = [
  {
    id: 1,
    name: "Apollo Pharmacy",
    distance: "1.2 km",
    time: "15–25 min",
    rating: "4.7",
    phone: "040-40000001",
  },
  {
    id: 2,
    name: "MedPlus",
    distance: "1.8 km",
    time: "20–30 min",
    rating: "4.6",
    phone: "040-40000002",
  },
  {
    id: 3,
    name: "Sri Sai Medicals",
    distance: "2.4 km",
    time: "25–35 min",
    rating: "4.5",
    phone: "040-40000003",
  },
];

/* =========================================================
   PHARMACY-WISE PRICES
========================================================= */

const pharmacyPrices = {
  "Dolo 650": {
    "Apollo Pharmacy": 32,
    MedPlus: 34,
    "Sri Sai Medicals": 31,
  },

  "Crocin Advance": {
    "Apollo Pharmacy": 28,
    MedPlus: 29,
    "Sri Sai Medicals": 27,
  },

  "Azithral 500": {
    "Apollo Pharmacy": 118,
    MedPlus: 121,
    "Sri Sai Medicals": 115,
  },

  "Cetirizine 10 mg": {
    "Apollo Pharmacy": 22,
    MedPlus: 24,
    "Sri Sai Medicals": 21,
  },

  "Pantop 40": {
    "Apollo Pharmacy": 92,
    MedPlus: 95,
    "Sri Sai Medicals": 89,
  },

  "ORS Lemon": {
    "Apollo Pharmacy": 25,
    MedPlus: 27,
    "Sri Sai Medicals": 24,
  },
};

/* =========================================================
   INITIAL PHARMACY STOCK
========================================================= */

const initialStock = [
  {
    id: 1,
    name: "Dolo 650",
    generic: "Paracetamol 650 mg",
    price: 32,
    qty: 48,
    rx: false,
  },

  {
    id: 2,
    name: "Cetirizine 10 mg",
    generic: "Cetirizine",
    price: 22,
    qty: 31,
    rx: false,
  },

  {
    id: 3,
    name: "Azithral 500",
    generic: "Azithromycin 500 mg",
    price: 118,
    qty: 12,
    rx: true,
  },

  {
    id: 4,
    name: "Pantop 40",
    generic: "Pantoprazole 40 mg",
    price: 92,
    qty: 0,
    rx: true,
  },

  {
    id: 5,
    name: "ORS Lemon",
    generic: "Oral Rehydration Salts",
    price: 25,
    qty: 20,
    rx: false,
  },
];

/* =========================================================
   APP
========================================================= */

function App() {
  const [query, setQuery] = useState("");

  const [cart, setCart] = useState([]);

  const [view, setView] = useState("home");

  const [selected, setSelected] = useState(null);

  const [mode, setMode] = useState("pickup");

  const [selectedStore, setSelectedStore] = useState(null);

  /* =======================================================
     ORDERS
  ======================================================= */

  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mf_orders") || "[]"
      );
    } catch {
      return [];
    }
  });

  /* =======================================================
     LOGIN
  ======================================================= */

  const [loggedIn, setLoggedIn] = useState(
    () => localStorage.getItem("mf_user") === "1"
  );

  const [loginOpen, setLoginOpen] = useState(false);

  const [phone, setPhone] = useState("");

  const [role, setRole] = useState(
    () => localStorage.getItem("mf_role") || "Customer"
  );

  /* =======================================================
     PHARMACY STOCK
  ======================================================= */

  const [pharmacyStock, setPharmacyStock] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("mf_stock") || "null"
        ) || initialStock
      );
    } catch {
      return initialStock;
    }
  });

  /* =======================================================
     PHARMACY REQUESTS
  ======================================================= */

  const [pharmacyRequests, setPharmacyRequests] =
    useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem("mf_pharmacy_requests") ||
            "[]"
        );
      } catch {
        return [];
      }
    });

  /* =======================================================
     DATABASE
  ======================================================= */

  const [dbStatus, setDbStatus] = useState(
    supabaseConfigured
      ? "Connecting..."
      : "Demo mode"
  );

  /* =======================================================
     SAVE LOCAL DATA
  ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      "mf_orders",
      JSON.stringify(orders)
    );
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(
      "mf_stock",
      JSON.stringify(pharmacyStock)
    );
  }, [pharmacyStock]);

  useEffect(() => {
    localStorage.setItem(
      "mf_pharmacy_requests",
      JSON.stringify(pharmacyRequests)
    );
  }, [pharmacyRequests]);

  /* =======================================================
     SUPABASE CONNECTION CHECK
  ======================================================= */

  useEffect(() => {
    let live = true;

    async function checkDatabase() {
      if (!supabaseConfigured || !supabase) {
        if (live) {
          setDbStatus("Demo mode");
        }

        return;
      }

      try {
        const { error } = await supabase
          .from("medicines")
          .select("id")
          .limit(1);

        if (!live) return;

        if (error) {
          console.error(error);
          setDbStatus("Connected");
        } else {
          setDbStatus("Supabase connected");
        }
      } catch (error) {
        console.error(error);

        if (live) {
          setDbStatus("Demo mode");
        }
      }
    }

    checkDatabase();

    return () => {
      live = false;
    };
  }, []);

  /* =======================================================
     SEARCH
  ======================================================= */

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return medicines;
    }

    return medicines.filter((medicine) => {
      const searchableText =
        `${medicine.name}
        ${medicine.generic}
        ${medicine.category}
        ${medicine.symptoms}`.toLowerCase();

      return searchableText.includes(q);
    });
  }, [query]);

  /* =======================================================
     CART TOTAL
  ======================================================= */

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  /* =======================================================
     CART
  ======================================================= */

  function addToCart(medicine) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === medicine.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === medicine.id
            ? {
                ...item,
                qty: item.qty + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...medicine,
          qty: 1,
        },
      ];
    });
  }

  function changeQty(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                qty: Math.max(
                  0,
                  item.qty + amount
                ),
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  /* =======================================================
     ORDER
  ======================================================= */

  async function placeOrder() {
    if (!cart.length) {
      alert("Cart is empty.");
      return;
    }

    if (!loggedIn) {
      setLoginOpen(true);
      return;
    }

    if (cart.some((item) => item.rx)) {
      const confirmed = window.confirm(
        "Some medicines may require a valid prescription. Continue?"
      );

      if (!confirmed) {
        return;
      }
    }

    const order = {
      id:
        "MF" +
        Date.now().toString().slice(-8),

      items: cart,

      total,

      mode,

      pharmacy:
        selectedStore?.name || "Nearest available pharmacy",

      status: "Placed",

      createdAt:
        new Date().toISOString(),
    };

    setOrders((current) => [
      order,
      ...current,
    ]);

    setCart([]);

    setSelectedStore(null);

    setView("orders");

    if (
      supabaseConfigured &&
      supabase
    ) {
      try {
        await supabase
          .from("orders")
          .insert({
            order_id: order.id,
            total: order.total,
            mode: order.mode,
            status: order.status,
          });
      } catch (error) {
        console.log(
          "Order saved locally:",
          error
        );
      }
    }
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  function login() {
    const cleanPhone =
      phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      alert(
        "Enter a valid 10-digit mobile number."
      );

      return;
    }

    localStorage.setItem(
      "mf_user",
      "1"
    );

    localStorage.setItem(
      "mf_phone",
      cleanPhone
    );

    localStorage.setItem(
      "mf_role",
      role
    );

    setLoggedIn(true);

    setLoginOpen(false);

    setPhone("");

    if (role === "Pharmacy") {
      setView("pharmacy");
    }
  }

  function logout() {
    localStorage.removeItem(
      "mf_user"
    );

    localStorage.removeItem(
      "mf_phone"
    );

    localStorage.removeItem(
      "mf_role"
    );

    setLoggedIn(false);

    setRole("Customer");

    setView("home");
  }

  /* =======================================================
     PHARMACY
  ======================================================= */

  function addPharmacyRequest(medicine) {
    const request = {
      id: Date.now(),
      medicine: medicine.name,
      createdAt:
        new Date().toISOString(),
      status: "Pending",
    };

    setPharmacyRequests(
      (current) => [
        request,
        ...current,
      ]
    );

    alert(
      `${medicine.name} request sent.`
    );
  }

  function saveInventory(item) {
    setPharmacyStock(
      (current) =>
        current.map((stock) =>
          stock.id === item.id
            ? {
                ...stock,
                qty: item.qty,
              }
            : stock
        )
    );
  }

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function goHome() {
    setView("home");
    setSelected(null);
  }

  function openMedicine(medicine) {
    setSelected(medicine);
  }

  function selectPharmacy(store) {
    setSelectedStore(store);

    setMode("pickup");

    alert(
      `${store.name} selected.`
    );

    setView("home");
  }

  /* =======================================================
     PRICE COMPARISON
  ======================================================= */

  function getPrices(medicine) {
    return (
      pharmacyPrices[
        medicine.name
      ] || {}
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="app">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="topbar">

        <button
          className="brand"
          onClick={goHome}
        >
          <span className="brandIcon">
            💊
          </span>

          <span>
            <strong>Medi</strong>Find
          </span>
        </button>

        <div className="searchBox">

          <span>🔎</span>

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search medicines, symptoms or generic name..."
          />

          {query && (
            <button
              className="clearSearch"
              onClick={() =>
                setQuery("")
              }
            >
              ×
            </button>
          )}

        </div>

        <nav className="nav">

          <button
            className={
              view === "home"
                ? "active"
                : ""
            }
            onClick={goHome}
          >
            Home
          </button>

          <button
            className={
              view === "stores"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("stores")
            }
          >
            Stores
          </button>

          <button
            className={
              view === "orders"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("orders")
            }
          >
            Orders

            {orders.length > 0 && (
              <span className="navBadge">
                {orders.length}
              </span>
            )}
          </button>

          <button
            className={
              view === "cart"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("cart")
            }
          >
            🛒 Cart

            {cart.length > 0 && (
              <span className="navBadge">
                {cart.length}
              </span>
            )}
          </button>

          {loggedIn ? (
            <button
              onClick={logout}
            >
              Logout
            </button>
          ) : (
            <button
              className="loginButton"
              onClick={() =>
                setLoginOpen(true)
              }
            >
              Login
            </button>
          )}

        </nav>
      </header>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="content">

        {/* =================================================
            HOME
        ================================================= */}

        {view === "home" && (
          <>

            {/* HERO */}

            <section className="hero">

              <div className="heroContent">

                <div className="heroBadge">
                  ✨ Smart medicine finder
                </div>

                <p className="eyebrow">
                  MEDICINE FINDER
                </p>

                <h1>
                  Find your medicine
                  <span> nearby.</span>
                </h1>

                <p className="heroText">
                  Search medicines,
                  compare prices and
                  discover nearby
                  pharmacies with MediFind.
                </p>

                <div className="heroActions">

                  <button
                    className="primaryButton"
                    onClick={() =>
                      setView("stores")
                    }
                  >
                    📍 Find pharmacies
                  </button>

                  <button
                    className="secondaryButton"
                    onClick={() => {
                      setQuery("");

                      window.scrollTo({
                        top: 500,
                        behavior: "smooth",
                      });
                    }}
                  >
                    Browse medicines →
                  </button>

                </div>

                <div className="heroTrust">

                  <div>
                    <strong>
                      500+
                    </strong>

                    <span>
                      Medicines
                    </span>
                  </div>

                  <div>
                    <strong>
                      50+
                    </strong>

                    <span>
                      Pharmacies
                    </span>
                  </div>

                  <div>
                    <strong>
                      24/7
                    </strong>

                    <span>
                      Search
                    </span>
                  </div>

                </div>

              </div>

              {/* HERO VISUAL */}

              <div className="heroVisual">

                <div className="floatingCard cardOne">

                  <span>💊</span>

                  <div>
                    <strong>
                      Dolo 650
                    </strong>

                    <small>
                      Available nearby
                    </small>
                  </div>

                  <b>
                    ₹32
                  </b>

                </div>

                <div className="medicineCircle">
                  💊
                </div>

                <div className="floatingCard cardTwo">

                  <span>📍</span>

                  <div>
                    <strong>
                      4 pharmacies
                    </strong>

                    <small>
                      Within your area
                    </small>
                  </div>

                </div>

              </div>

            </section>

            {/* DATABASE STATUS */}

            <section className="statusCard">

              <div className="statusLeft">

                <span
                  className={
                    dbStatus
                      .toLowerCase()
                      .includes(
                        "connected"
                      )
                      ? "statusDot online"
                      : "statusDot"
                  }
                />

                <div>

                  <strong>
                    {dbStatus
                      .toLowerCase()
                      .includes(
                        "connected"
                      )
                      ? "MediFind database"
                      : "MediFind"}
                  </strong>

                  <span>
                    {dbStatus}
                  </span>

                </div>

              </div>

              <span className="secureText">
                🔒 Secure connection
              </span>

            </section>

            {/* MEDICINES */}

            <section className="section">

              <div className="sectionHeader">

                <div>

                  <p className="sectionEyebrow">
                    EXPLORE
                  </p>

                  <h2>
                    Popular medicines
                  </h2>

                  <p>
                    Find commonly searched
                    medicines near you.
                  </p>

                </div>

                {query && (
                  <span className="resultCount">
                    {results.length} result
                    {results.length !== 1
                      ? "s"
                      : ""}
                  </span>
                )}

              </div>

              {results.length === 0 ? (

                <div className="emptySearch">

                  <div>
                    🔍
                  </div>

                  <h2>
                    No medicine found
                  </h2>

                  <p>
                    Try another medicine,
                    symptom or generic name.
                  </p>

                  <button
                    className="primaryButton"
                    onClick={() =>
                      setQuery("")
                    }
                  >
                    View all medicines
                  </button>

                </div>

              ) : (

                <div className="medicineGrid">

                  {results.map(
                    (medicine) => (

                      <article
                        className="medicineCard"
                        key={medicine.id}
                      >

                        <div className="medicineTop">

                          <div className="medicineIcon">
                            💊
                          </div>

                          {medicine.rx ? (

                            <span className="rx">
                              Rx
                            </span>

                          ) : (

                            <span className="otc">
                              OTC
                            </span>

                          )}

                        </div>

                        <p className="category">
                          {medicine.category}
                        </p>

                        <h3>
                          {medicine.name}
                        </h3>

                        <p className="generic">
                          {medicine.generic}
                        </p>

                        <div className="medicineBottom">

                          <div>

                            <span className="priceLabel">
                              Starting from
                            </span>

                            <strong className="price">
                              ₹{medicine.price}
                            </strong>

                          </div>

                          <span className="storesAvailable">
                            🏪{" "}
                            {medicine.stores}{" "}
                            stores
                          </span>

                        </div>

                        <div className="cardActions">

                          <button
                            className="detailsButton"
                            onClick={() =>
                              openMedicine(
                                medicine
                              )
                            }
                          >
                            Details
                          </button>

                          <button
                            className="addButton"
                            onClick={() =>
                              addToCart(
                                medicine
                              )
                            }
                          >
                            + Add
                          </button>

                        </div>

                      </article>

                    )
                  )}

                </div>

              )}

            </section>

            {/* WHY MEDIFIND */}

            <section className="whySection">

              <div>

                <p className="sectionEyebrow">
                  WHY MEDIFIND
                </p>

                <h2>
                  Everything you need,
                  <br />
                  in one place.
                </h2>

              </div>

              <div className="featureGrid">

                <div className="feature">

                  <span>
                    🔎
                  </span>

                  <h3>
                    Easy search
                  </h3>

                  <p>
                    Quickly find medicines
                    by brand, generic name
                    or common symptom.
                  </p>

                </div>

                <div className="feature">

                  <span>
                    💰
                  </span>

                  <h3>
                    Compare prices
                  </h3>

                  <p>
                    Compare medicine prices
                    before choosing a pharmacy.
                  </p>

                </div>

                <div className="feature">

                  <span>
                    📍
                  </span>

                  <h3>
                    Nearby stores
                  </h3>

                  <p>
                    Discover pharmacies
                    close to your location.
                  </p>

                </div>

                <div className="feature">

                  <span>
                    🛒
                  </span>

                  <h3>
                    Easy ordering
                  </h3>

                  <p>
                    Add medicines to your
                    cart and place an order.
                  </p>

                </div>

              </div>

            </section>

          </>
        )}

        {/* =================================================
            STORES
        ================================================= */}

        {view === "stores" && (

          <section className="pageSection">

            <div className="pageHeading">

              <p className="sectionEyebrow">
                PHARMACY NETWORK
              </p>

              <h1>
                Nearby pharmacies
              </h1>

              <p>
                Find pharmacies where your
                medicines may be available.
              </p>

            </div>

            <div className="storeGrid">

              {stores.map(
                (store) => (

                  <article
                    className="storeCard"
                    key={store.id}
                  >

                    <div className="storeHeader">

                      <div className="storeIcon">
                        🏥
                      </div>

                      <span className="rating">
                        ⭐ {store.rating}
                      </span>

                    </div>

                    <h2>
                      {store.name}
                    </h2>

                    <p>
                      📍 {store.distance} away
                    </p>

                    <p>
                      🚚 {store.time}
                    </p>

                    <div className="storeStatus">

                      <span className="statusDot online" />

                      Open now

                    </div>

                    <button
                      className="primaryButton full"
                      onClick={() =>
                        selectPharmacy(
                          store
                        )
                      }
                    >
                      Select pharmacy
                    </button>

                  </article>

                )
              )}

            </div>

          </section>

        )}

        {/* =================================================
            CART
        ================================================= */}

        {view === "cart" && (

          <section className="pageSection">

            <div className="pageHeading">

              <p className="sectionEyebrow">
                SHOPPING
              </p>

              <h1>
                Your cart
              </h1>

              <p>
                Review your medicines before
                placing your order.
              </p>

            </div>

            {!cart.length ? (

              <div className="empty">

                <div className="emptyIcon">
                  🛒
                </div>

                <h2>
                  Your cart is empty
                </h2>

                <p>
                  Add some medicines to
                  continue.
                </p>

                <button
                  className="primaryButton"
                  onClick={goHome}
                >
                  Browse medicines
                </button>

              </div>

            ) : (

              <div className="cartLayout">

                <div className="cartList">

                  {cart.map(
                    (item) => (

                      <div
                        className="cartItem"
                        key={item.id}
                      >

                        <div className="cartMedicineIcon">
                          💊
                        </div>

                        <div className="cartInfo">

                          <h3>
                            {item.name}
                          </h3>

                          <p>
                            {item.generic}
                          </p>

                          <small>
                            ₹{item.price} each
                          </small>

                          {item.rx && (
                            <span className="rx">
                              Prescription
                              required
                            </span>
                          )}

                        </div>

                        <div className="quantity">

                          <button
                            onClick={() =>
                              changeQty(
                                item.id,
                                -1
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {item.qty}
                          </span>

                          <button
                            onClick={() =>
                              changeQty(
                                item.id,
                                1
                              )
                            }
                          >
                            +
                          </button>

                        </div>

                        <div className="itemTotal">

                          <strong>
                            ₹
                            {item.price *
                              item.qty}
                          </strong>

                          <button
                            className="clearSearch"
                            onClick={() =>
                              removeFromCart(
                                item.id
                              )
                            }
                          >
                            ×
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

                <div className="checkout">

                  <h2>
                    Order summary
                  </h2>

                  <div className="summaryRow">

                    <span>
                      Items
                    </span>

                    <strong>
                      {cart.reduce(
                        (sum, item) =>
                          sum + item.qty,
                        0
                      )}
                    </strong>

                  </div>

                  <div className="summaryRow">

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      ₹{total}
                    </strong>

                  </div>

                  <div className="summaryRow">

                    <span>
                      Delivery
                    </span>

                    <strong>
                      {mode === "delivery"
                        ? "₹20"
                        : "Free"}
                    </strong>

                  </div>

                  <div className="summaryTotal">

                    <strong>
                      Total
                    </strong>

                    <strong>
                      ₹
                      {total +
                        (mode ===
                        "delivery"
                          ? 20
                          : 0)}
                    </strong>

                  </div>

                  <div className="mode">

                    <label
                      className={
                        mode === "pickup"
                          ? "selectedMode"
                          : ""
                      }
                    >

                      <input
                        type="radio"
                        checked={
                          mode === "pickup"
                        }
                        onChange={() =>
                          setMode(
                            "pickup"
                          )
                        }
                      />

                      <span>
                        <strong>
                          🏪 Pickup
                        </strong>

                        <small>
                          Collect from
                          pharmacy
                        </small>
                      </span>

                    </label>

                    <label
                      className={
                        mode === "delivery"
                          ? "selectedMode"
                          : ""
                      }
                    >

                      <input
                        type="radio"
                        checked={
                          mode === "delivery"
                        }
                        onChange={() =>
                          setMode(
                            "delivery"
                          )
                        }
                      />

                      <span>
                        <strong>
                          🚚 Delivery
                        </strong>

                        <small>
                          Delivered to
                          your address
                        </small>
                      </span>

                    </label>

                  </div>

                  {selectedStore && (
                    <div className="summaryRow">

                      <span>
                        Pharmacy
                      </span>

                      <strong>
                        {selectedStore.name}
                      </strong>

                    </div>
                  )}

                  <button
                    className="primaryButton full"
                    onClick={placeOrder}
                  >
                    {loggedIn
                      ? "Place order"
                      : "Login to order"}
                  </button>

                </div>

              </div>

            )}

          </section>

        )}

        {/* =================================================
            ORDERS
        ================================================= */}

        {view === "orders" && (

          <section className="pageSection">

            <div className="pageHeading">

              <p className="sectionEyebrow">
                ORDER HISTORY
              </p>

              <h1>
                My orders
              </h1>

              <p>
                Track your MediFind orders.
              </p>

            </div>

            {!orders.length ? (

              <div className="empty">

                <div className="emptyIcon">
                  📦
                </div>

                <h2>
                  No orders yet
                </h2>

                <p>
                  Your placed orders will
                  appear here.
                </p>

                <button
                  className="primaryButton"
                  onClick={goHome}
                >
                  Start shopping
                </button>

              </div>

            ) : (

              <div className="orders">

                {orders.map(
                  (order) => (

                    <article
                      className="orderCard"
                      key={order.id}
                    >

                      <div className="orderIcon">
                        📦
                      </div>

                      <div className="orderMain">

                        <strong>
                          #{order.id}
                        </strong>

                        <p>
                          {order.items
                            .map(
                              (item) =>
                                `${item.name} ×${item.qty}`
                            )
                            .join(", ")}
                        </p>

                        <small>
                          {new Date(
                            order.createdAt
                          ).toLocaleString()}
                        </small>

                        <small>
                          🏪{" "}
                          {order.pharmacy ||
                            "Nearest pharmacy"}
                        </small>

                      </div>

                      <div className="orderAmount">

                        <strong>
                          ₹{order.total}
                        </strong>

                        <span>
                          {order.mode}
                        </span>

                      </div>

                      <span className="orderStatus">
                        {order.status}
                      </span>

                    </article>

                  )
                )}

              </div>

            )}

          </section>

        )}

        {/* =================================================
            PHARMACY DASHBOARD
        ================================================= */}

        {view === "pharmacy" && (

          <section className="pageSection">

            <div className="pageHeading">

              <p className="sectionEyebrow">
                PHARMACY MANAGEMENT
              </p>

              <h1>
                Pharmacy dashboard
              </h1>

              <p>
                Manage medicine inventory
                and customer requests.
              </p>

            </div>

            <div className="inventory">

              {pharmacyStock.map(
                (item) => (

                  <div
                    className="inventoryRow"
                    key={item.id}
                  >

                    <div className="inventoryIcon">
                      💊
                    </div>

                    <div className="inventoryInfo">

                      <strong>
                        {item.name}
                      </strong>

                      <p>
                        {item.generic}
                      </p>

                    </div>

                    <input
                      type="number"
                      min="0"
                      value={item.qty}
                      onChange={(e) =>
                        saveInventory({
                          ...item,
                          qty: Number(
                            e.target.value
                          ),
                        })
                      }
                    />

                    <button
                      onClick={() =>
                        addPharmacyRequest(
                          item
                        )
                      }
                    >
                      Request
                    </button>

                  </div>

                )
              )}

            </div>

            <h2 className="subHeading">
              Customer requests
            </h2>

            {!pharmacyRequests.length ? (

              <div className="empty">

                <div className="emptyIcon">
                  📋
                </div>

                <h2>
                  No requests
                </h2>

                <p>
                  Customer medicine
                  requests will appear here.
                </p>

              </div>

            ) : (

              pharmacyRequests.map(
                (request) => (

                  <div
                    className="request"
                    key={request.id}
                  >

                    <strong>
                      {request.medicine}
                    </strong>

                    <span>
                      {request.status}
                    </span>

                  </div>

                )
              )

            )}

          </section>

        )}

      </main>

      {/* ===================================================
          MEDICINE DETAILS MODAL
      =================================================== */}

      {selected && (

        <div
          className="modalBackdrop"
          onClick={() =>
            setSelected(null)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="close"
              onClick={() =>
                setSelected(null)
              }
            >
              ×
            </button>

            <div className="modalMedicineIcon">
              💊
            </div>

            <span className="modalCategory">
              {selected.category}
            </span>

            <h2>
              {selected.name}
            </h2>

            <p>
              {selected.generic}
            </p>

            <strong className="modalPrice">
              ₹{selected.price}
            </strong>

            <div className="modalInfo">

              <div>

                <span>
                  🏪
                </span>

                <strong>
                  {selected.stores}
                </strong>

                <small>
                  Nearby stores
                </small>

              </div>

              <div>

                <span>
                  {selected.rx
                    ? "🔴"
                    : "🟢"}
                </span>

                <strong>
                  {selected.rx
                    ? "Rx"
                    : "OTC"}
                </strong>

                <small>
                  Medicine type
                </small>

              </div>

            </div>

            {selected.rx && (

              <p className="warning">
                ⚠ This medicine may
                require a valid prescription.
              </p>

            )}

            {/* PRICE COMPARISON */}

            <h3>
              Compare pharmacy prices
            </h3>

            <div className="orders">

              {stores.map(
                (store) => {

                  const prices =
                    getPrices(
                      selected
                    );

                  const price =
                    prices[
                      store.name
                    ] ?? selected.price;

                  return (
                    <div
                      className="request"
                      key={store.id}
                    >

                      <div>

                        <strong>
                          {store.name}
                        </strong>

                        <small>
                          <br />
                          📍{" "}
                          {store.distance}
                        </small>

                      </div>

                      <strong>
                        ₹{price}
                      </strong>

                    </div>
                  );
                }
              )}

            </div>

            <button
              className="primaryButton full"
              onClick={() => {
                addToCart(selected);

                setSelected(null);

                setView("cart");
              }}
            >
              🛒 Add to cart
            </button>

          </div>

        </div>

      )}

      {/* ===================================================
          LOGIN MODAL
      =================================================== */}

      {loginOpen && (

        <div
          className="modalBackdrop"
          onClick={() =>
            setLoginOpen(false)
          }
        >

          <div
            className="modal loginModal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="close"
              onClick={() =>
                setLoginOpen(false)
              }
            >
              ×
            </button>

            <div className="loginIcon">
              🔐
            </div>

            <h2>
              Login to MediFind
            </h2>

            <p>
              Login to place orders and
              access your MediFind account.
            </p>

            <label>
              Mobile number
            </label>

            <input
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                    .replace(/\D/g, "")
                )
              }
              placeholder="10-digit mobile number"
              maxLength={10}
            />

            <label>
              Account type
            </label>

            <select
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value
                )
              }
            >

              <option value="Customer">
                Customer
              </option>

              <option value="Pharmacy">
                Pharmacy
              </option>

            </select>

            <button
              className="primaryButton full"
              onClick={login}
            >
              Continue
            </button>

          </div>

        </div>

      )}

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer>

        <div>

          <span className="footerBrand">
            💊 MediFind
          </span>

          <br />

          <span>
            Find medicines smarter.
          </span>

        </div>

        <span>
          © 2026 MediFind
        </span>

        {loggedIn &&
          role === "Pharmacy" && (

            <button
              onClick={() =>
                setView("pharmacy")
              }
            >
              Pharmacy Dashboard
            </button>

          )}

      </footer>

    </div>
  );
}

/* =========================================================
   START REACT
========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <App />
);
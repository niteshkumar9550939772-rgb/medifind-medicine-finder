import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase, supabaseConfigured } from "./lib/supabase";
import "./styles.css";

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
    category: "Pain & Fever",
    symptoms: "fever headache body pain",
  },
  {
    id: 2,
    name: "Crocin Advance",
    generic: "Paracetamol 500 mg",
    price: 28,
    rx: false,
    category: "Pain & Fever",
    symptoms: "fever headache pain",
  },
  {
    id: 3,
    name: "Azithral 500",
    generic: "Azithromycin 500 mg",
    price: 118,
    rx: true,
    category: "Antibiotic",
    symptoms: "bacterial infection",
  },
  {
    id: 4,
    name: "Cetirizine 10 mg",
    generic: "Cetirizine",
    price: 22,
    rx: false,
    category: "Allergy",
    symptoms: "allergy sneezing itching",
  },
  {
    id: 5,
    name: "Pantop 40",
    generic: "Pantoprazole 40 mg",
    price: 92,
    rx: true,
    category: "Gastric Care",
    symptoms: "acidity gas heartburn",
  },
  {
    id: 6,
    name: "ORS Lemon",
    generic: "Oral Rehydration Salts",
    price: 25,
    rx: false,
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
    email: "sachinchauhan9391@gmail.com",
    distance: "1.2 km",
    time: "15–25 min",
    rating: "4.7",
    phone: "040-40000001",
  },
  {
    id: 2,
    name: "MedPlus",
    email: "medplus@example.com",
    distance: "1.8 km",
    time: "20–30 min",
    rating: "4.6",
    phone: "040-40000002",
  },
  {
    id: 3,
    name: "Sri Sai Medicals",
    email: "srisai@example.com",
    distance: "2.4 km",
    time: "25–35 min",
    rating: "4.5",
    phone: "040-40000003",
  },
];

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
    MedPlus: 26,
    "Sri Sai Medicals": 24,
  },
};

/* =========================================================
   DEFAULT STOCK
========================================================= */

const initialStock = Object.fromEntries(
  stores.map((store) => [
    store.name,
    Object.fromEntries(
      medicines.map((medicine) => [medicine.name, 5])
    ),
  ])
);

/* =========================================================
   HELPERS
========================================================= */

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function formatDate(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function createOrderId() {
  return `MF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/* =========================================================
   APP
========================================================= */

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

  const [role, setRole] = useState(
    localStorage.getItem("mf_role") || "Customer"
  );

  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [pharmacyOrders, setPharmacyOrders] = useState([]);

  const [pharmacyStock, setPharmacyStock] =
    useState(initialStock);

  /* =======================================================
     SEARCH
  ======================================================= */

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return medicines;

    return medicines.filter((medicine) =>
      `${medicine.name} ${medicine.generic} ${medicine.category} ${medicine.symptoms}`
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  /* =======================================================
     TOTAL
  ======================================================= */

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );

  /* =======================================================
     RESTORE SESSION
  ======================================================= */

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;

    let active = true;

    async function restoreSession() {
      const { data, error } =
        await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error);
        return;
      }

      if (!active) return;

      const sessionUser = data?.session?.user;

      if (sessionUser) {
        const cleanEmail =
          normalizeEmail(sessionUser.email);

        setLoggedIn(true);
        setUserEmail(cleanEmail);

        const savedRole =
          localStorage.getItem("mf_role") || "Customer";

        setRole(savedRole);

        if (savedRole === "Pharmacy") {
          setView("pharmacy");
        }
      }
    }

    restoreSession();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        const sessionUser = session?.user;

        if (sessionUser) {
          const cleanEmail =
            normalizeEmail(sessionUser.email);

          setLoggedIn(true);
          setUserEmail(cleanEmail);
        } else {
          setLoggedIn(false);
          setUserEmail("");
          setOrders([]);
          setPharmacyOrders([]);
        }
      }
    );

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  /* =======================================================
     SEND OTP
  ======================================================= */

  async function sendOtp() {
    const cleanEmail =
      normalizeEmail(email);

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      alert("Enter a valid email address.");
      return;
    }

    if (!supabaseConfigured || !supabase) {
      alert(
        "Supabase is not configured. Check your .env file."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
          },
        });

      if (error) throw error;

      setEmail(cleanEmail);
      setOtpSent(true);

      alert(
        "Verification code/email has been sent."
      );
    } catch (error) {
      console.error("OTP error:", error);

      alert(
        error?.message ||
          "Could not send verification email."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     VERIFY OTP
  ======================================================= */

  async function verifyOtp() {
    const cleanEmail =
      normalizeEmail(email);

    const cleanOtp =
      otp.trim();

    if (!cleanOtp) {
      alert("Enter the OTP.");
      return;
    }

    if (!supabaseConfigured || !supabase) {
      alert("Supabase is not configured.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: "email",
        });

      if (error) throw error;

      const loggedUser =
        data?.user;

      if (!loggedUser) {
        throw new Error(
          "Login failed. User was not created."
        );
      }

      const actualEmail =
        normalizeEmail(
          loggedUser.email || cleanEmail
        );

      /* -----------------------------------------------
         PHARMACY VERIFICATION
      ------------------------------------------------ */

      if (role === "Pharmacy") {
        const {
          data: pharmacyVerified,
          error: pharmacyError,
        } = await supabase.rpc(
          "check_pharmacy_verified",
          {
            p_email: actualEmail,
          }
        );

        if (pharmacyError) {
          console.error(
            "Pharmacy verification error:",
            pharmacyError
          );

          throw new Error(
            "Pharmacy verification failed."
          );
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

      localStorage.setItem(
        "mf_role",
        role
      );

      setLoggedIn(true);
      setUserEmail(actualEmail);

      setLoginOpen(false);
      setOtp("");
      setOtpSent(false);

      if (role === "Pharmacy") {
        setView("pharmacy");
      } else {
        setView("home");
      }
    } catch (error) {
      console.error(
        "Verify error:",
        error
      );

      alert(
        error?.message ||
          "Invalid or expired OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {
    try {
      if (supabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    localStorage.removeItem("mf_role");

    setLoggedIn(false);
    setUserEmail("");
    setRole("Customer");

    setCart([]);
    setSelectedStore(null);
    setSelectedMedicine(null);

    setOrders([]);
    setPharmacyOrders([]);

    setView("home");
  }

  /* =======================================================
     ADD TO CART
  ======================================================= */

  function addToCart(
    medicine,
    store = null
  ) {
    if (!loggedIn) {
      setLoginOpen(true);
      return;
    }

    if (medicine.rx) {
      alert(
        "This medicine requires a valid prescription."
      );
      return;
    }

    if (!store) {
      alert(
        "Please select a pharmacy."
      );
      return;
    }

    const price =
      pharmacyPrices[
        medicine.name
      ]?.[store.name] ??
      medicine.price;

    const storeEmail =
      normalizeEmail(store.email);

    setSelectedStore(store);

    setCart((current) => {
      const found = current.find(
        (item) =>
          item.id === medicine.id &&
          item.storeEmail === storeEmail
      );

      if (found) {
        return current.map((item) =>
          item.id === medicine.id &&
          item.storeEmail === storeEmail
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
          price,
          qty: 1,
          storeName: store.name,
          storeEmail,
        },
      ];
    });

    alert(
      `${medicine.name} added from ${store.name}.`
    );
  }

  /* =======================================================
     CHANGE QTY
  ======================================================= */

  function changeQty(
    id,
    storeEmail,
    delta
  ) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id &&
          item.storeEmail === storeEmail
            ? {
                ...item,
                qty: Math.max(
                  0,
                  item.qty + delta
                ),
              }
            : item
        )
        .filter(
          (item) => item.qty > 0
        )
    );
  }

  /* =======================================================
     CUSTOMER ORDERS
  ======================================================= */

  async function loadCustomerOrders() {
    if (
      !supabaseConfigured ||
      !supabase ||
      !userEmail
    ) {
      return;
    }

    const cleanEmail =
      normalizeEmail(userEmail);

    if (!cleanEmail) return;

    try {
      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .select("*")
        .eq(
          "customer_email",
          cleanEmail
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error(
        "Customer orders error:",
        error
      );

      alert(
        "Orders load nahi hue: " +
          error.message
      );
    }
  }

  /* =======================================================
     PHARMACY ORDERS
  ======================================================= */

  async function loadPharmacyOrders() {
    if (
      !supabaseConfigured ||
      !supabase
    ) {
      return;
    }

    try {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      const pharmacyEmail =
        normalizeEmail(
          session?.user?.email ||
            userEmail
        );

      if (!pharmacyEmail) {
        setPharmacyOrders([]);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .select("*")
        .eq(
          "pharmacy_email",
          pharmacyEmail
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) throw error;

      setPharmacyOrders(
        data || []
      );
    } catch (error) {
      console.error(
        "Pharmacy orders error:",
        error
      );

      alert(
        "Pharmacy orders load nahi hue: " +
          error.message
      );
    }
  }

  /* =======================================================
     PHARMACY STOCK
  ======================================================= */

  async function loadPharmacyStock() {
    if (
      !supabaseConfigured ||
      !supabase ||
      !userEmail
    ) {
      return;
    }

    try {
      const pharmacyEmail =
        normalizeEmail(userEmail);

      const {
        data,
        error,
      } = await supabase
        .from("pharmacy_stock")
        .select("*")
        .eq(
          "pharmacy_email",
          pharmacyEmail
        );

      if (error) throw error;

      if (!data) return;

      setPharmacyStock(
        (current) => {
          const next = {
            ...current,
          };

          data.forEach(
            (item) => {
              if (
                !next[item.store_name]
              ) {
                next[item.store_name] =
                  {};
              }

              next[
                item.store_name
              ][
                item.medicine_name
              ] =
                Number(
                  item.quantity || 0
                );
            }
          );

          return next;
        }
      );
    } catch (error) {
      console.error(
        "Stock load error:",
        error
      );
    }
  }

 /* =======================================================
   UPDATE STOCK
======================================================= */

async function updateStock(
  storeName,
  medicineName,
  value
) {
  const qty = Math.max(
    0,
    Number(value) || 0
  );

  // Update screen immediately
  setPharmacyStock((current) => ({
    ...current,

    [storeName]: {
      ...(current[storeName] || {}),
      [medicineName]: qty,
    },
  }));

  // Pharmacy login check
  if (
    !supabaseConfigured ||
    !supabase ||
    !userEmail
  ) {
    alert("Pharmacy login required.");
    return;
  }

  try {
    const pharmacyEmail =
      normalizeEmail(userEmail);

    const { error } =
      await supabase
        .from("pharmacy_stock")
        .upsert(
          {
            pharmacy_email:
              pharmacyEmail,

            store_name:
              storeName,

            medicine_name:
              medicineName,

            quantity:
              qty,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "pharmacy_email,store_name,medicine_name",
          }
        );

    if (error) {
      throw error;
    }

    // Reload stock from database
    await loadPharmacyStock();

    alert(
      `${medicineName} stock saved: ${qty}`
    );

  } catch (error) {

    console.error(
      "Stock save error:",
      error
    );

    alert(
      "Stock save nahi hua: " +
        (error?.message ||
          "Unknown error")
    );
  }
}

  /* =======================================================
     UPDATE ORDER STATUS
  ======================================================= */

  async function updateOrderStatus(orderId, newStatus) {
  if (!supabaseConfigured || !supabase) {
    alert("Supabase is not configured.");
    return;
  }

  if (!orderId) {
    alert("Order ID missing.");
    return;
  }

  try {
    console.log("Updating order:", orderId, newStatus);

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
      })
      .eq("order_id", orderId)
      .select("*");

    if (error) {
      console.error("SUPABASE UPDATE ERROR:", error);
      throw error;
    }

    console.log("UPDATED ORDER:", data);

    if (!data || data.length === 0) {
      throw new Error(
        "Status update nahi hua. Supabase RLS policy UPDATE ko block kar rahi ho sakti hai."
      );
    }

    // Pharmacy screen update
    setPharmacyOrders((current) =>
      current.map((order) =>
        order.order_id === orderId
          ? {
              ...order,
              status: newStatus,
            }
          : order
      )
    );

    // Database se fresh pharmacy orders
    await loadPharmacyOrders();

    alert(
      `Order ${orderId} → ${newStatus}`
    );

  } catch (error) {
    console.error(
      "Order status update error:",
      error
    );

    alert(
      "Status update nahi hua:\n\n" +
      (error?.message || "Unknown error")
    );
  }
}

  /* =======================================================
     PLACE ORDER
  ======================================================= */

  async function placeOrder() {
    if (!cart.length) {
      alert(
        "Your cart is empty."
      );
      return;
    }

    if (!loggedIn) {
      setLoginOpen(true);
      return;
    }

    /* -------------------------------------------------------
       IMPORTANT:
       Every cart item has its own pharmacy.
       We only allow one pharmacy per order.
    ------------------------------------------------------- */

    const pharmacyEmails = [
      ...new Set(
        cart
          .map(
            (item) =>
              normalizeEmail(
                item.storeEmail
              )
          )
          .filter(Boolean)
      ),
    ];

    if (
      pharmacyEmails.length !== 1
    ) {
      alert(
        "Please order medicines from the same pharmacy."
      );
      return;
    }

    const pharmacyEmail =
      pharmacyEmails[0];

    const pharmacyItem =
      cart.find(
        (item) =>
          normalizeEmail(
            item.storeEmail
          ) === pharmacyEmail
      );

    const pharmacyName =
      pharmacyItem?.storeName ||
      selectedStore?.name;

    if (!pharmacyName) {
      alert(
        "Pharmacy selection missing."
      );
      return;
    }

    const customerEmail =
      normalizeEmail(
        userEmail
      );

    if (!customerEmail) {
      alert(
        "Customer email missing. Please login again."
      );
      return;
    }

    const orderId =
      createOrderId();

    const createdAt =
      new Date().toISOString();

    const orderItems =
      cart.map(
        (item) => ({
          name: item.name,
          qty: Number(
            item.qty
          ),
          price: Number(
            item.price
          ),
        })
      );

    const orderTotal =
      orderItems.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.qty,
        0
      );

    setLoading(true);

    try {
      if (
        !supabaseConfigured ||
        !supabase
      ) {
        throw new Error(
          "Supabase is not configured."
        );
      }

      /* ---------------------------------------------------
         FINAL DATABASE INSERT
      --------------------------------------------------- */

      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .insert({
          order_id:
            orderId,

          pharmacy_name:
            pharmacyName,

          pharmacy_email:
            pharmacyEmail,

          customer_email:
            customerEmail,

          items:
            orderItems,

          total:
            orderTotal,

          mode:
            mode,

          status:
            "Pending",

          created_at:
            createdAt,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(
        "ORDER CREATED:",
        data
      );

      setOrders(
        (current) => [
          data,
          ...current,
        ]
      );

      setCart([]);
      setSelectedStore(null);

      setView("orders");

      alert(
        `Order placed successfully!\nOrder ID: ${orderId}`
      );

      await loadCustomerOrders();
    } catch (error) {
      console.error(
        "Order save error:",
        error
      );

      alert(
        "Order place nahi hua:\n" +
          (error?.message ||
            "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD ORDERS ON PAGE OPEN
  ======================================================= */

  useEffect(() => {
    if (
      view === "orders" &&
      loggedIn &&
      userEmail
    ) {
      loadCustomerOrders();
    }
  }, [
    view,
    loggedIn,
    userEmail,
  ]);

  /* =======================================================
     LOAD PHARMACY DATA
  ======================================================= */

  useEffect(() => {
    if (
      view === "pharmacy" &&
      loggedIn &&
      role === "Pharmacy" &&
      userEmail
    ) {
      loadPharmacyOrders();
      loadPharmacyStock();
    }
  }, [
    view,
    loggedIn,
    role,
    userEmail,
  ]);

  /* =======================================================
   CUSTOMER LIVE ORDER STATUS
======================================================= */

useEffect(() => {
  if (
    !supabaseConfigured ||
    !supabase ||
    !loggedIn ||
    !userEmail
  ) {
    return;
  }

  let cancelled = false;

  async function refreshCustomerOrders() {
    try {
      const cleanEmail =
        normalizeEmail(userEmail);

      if (!cleanEmail) return;

      const { data, error } =
        await supabase
          .from("orders")
          .select("*")
          .eq(
            "customer_email",
            cleanEmail
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        console.error(
          "Live order refresh error:",
          error
        );
        return;
      }

      if (!cancelled) {
        setOrders(data || []);
      }
    } catch (error) {
      console.error(
        "Customer status refresh error:",
        error
      );
    }
  }

  /* First refresh immediately */
  refreshCustomerOrders();

  /* Then check database every 2 seconds */
  const interval =
    setInterval(
      refreshCustomerOrders,
      2000
    );

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [
  loggedIn,
  userEmail,
]);

  /* =======================================================
     PHARMACY REALTIME
  ======================================================= */

  useEffect(() => {
    if (
      !supabaseConfigured ||
      !supabase ||
      !loggedIn ||
      role !== "Pharmacy" ||
      !userEmail
    ) {
      return;
    }

    const pharmacyEmail =
      normalizeEmail(
        userEmail
      );

    const channel =
      supabase
        .channel(
          `pharmacy-orders-${pharmacyEmail}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter:
              `pharmacy_email=eq.${pharmacyEmail}`,
          },
          () => {
            loadPharmacyOrders();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [
    loggedIn,
    role,
    userEmail,
  ]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="mf-app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="mf-header">

        <button
          className="brand"
          onClick={() =>
            setView("home")
          }
        >
          <span className="brand-icon">
            ✚
          </span>

          <span>
            MediFind
          </span>
        </button>

        <div className="search-wrap">

          <input
            value={query}
            onChange={(e) => {
              setQuery(
                e.target.value
              );
              setView("home");
            }}
            placeholder="Search medicine, generic name or symptom..."
          />

          <span>
            ⌕
          </span>

        </div>

        <nav>

          <button
            onClick={() =>
              setView("home")
            }
          >
            Home
          </button>

          <button
            onClick={() =>
              setView("orders")
            }
          >
            Orders
          </button>

          {loggedIn &&
            role === "Pharmacy" && (
              <button
                onClick={() =>
                  setView(
                    "pharmacy"
                  )
                }
              >
                Pharmacy
              </button>
            )}

          {!loggedIn ? (
            <button
              className="primary"
              onClick={() =>
                setLoginOpen(true)
              }
            >
              Login
            </button>
          ) : (
            <button
              className="profile"
              onClick={logout}
            >
              {userEmail}
              {" · "}
              Logout
            </button>
          )}

        </nav>

      </header>

      <main>

        {/* =================================================
            HOME
        ================================================= */}

        {view === "home" && (
          <>
            <section className="hero">

              <div>

                <p className="eyebrow">
                  MEDICINE FINDER
                </p>

                <h1>
                  Find medicines near you.
                </h1>

                <p>
                  Search medicines,
                  compare nearby
                  pharmacy prices and
                  place an order for
                  pickup or delivery.
                </p>

                <button
                  className="primary large"
                  onClick={() =>
                    document
                      .querySelector(
                        ".search-wrap input"
                      )
                      ?.focus()
                  }
                >
                  Search medicines
                </button>

              </div>

              <div className="hero-card">

                <div className="hero-cross">
                  ✚
                </div>

                <strong>
                  Safe & simple
                </strong>

                <span>
                  Prescription medicines
                  are clearly marked.
                </span>

              </div>

            </section>

            <section className="section">

              <div className="section-title">

                <div>

                  <h2>
                    {query
                      ? "Search results"
                      : "Popular medicines"}
                  </h2>

                  <p>
                    {results.length} medicines
                    available
                  </p>

                </div>

              </div>

              <div className="medicine-grid">

                {results.map(
                  (medicine) => (

                    <article
                      className="medicine-card"
                      key={medicine.id}
                    >

                      <div className="medicine-top">

                        <span className="pill">
                          {medicine.category}
                        </span>

                        {medicine.rx && (
                          <span className="rx">
                            Rx
                          </span>
                        )}

                      </div>

                      <h3>
                        {medicine.name}
                      </h3>

                      <p>
                        {medicine.generic}
                      </p>

                      <small>
                        For:{" "}
                        {medicine.symptoms}
                      </small>

                      <div className="medicine-bottom">

                        <strong>
                          ₹{medicine.price}
                        </strong>

                        <button
                          onClick={() => {
                            setSelectedMedicine(
                              medicine
                            );
                            setView(
                              "medicine"
                            );
                          }}
                        >
                          View
                        </button>

                      </div>

                    </article>

                  )
                )}

              </div>

            </section>
          </>
        )}

        {/* =================================================
            MEDICINE DETAIL
        ================================================= */}

        {view === "medicine" &&
          selectedMedicine && (

            <section className="section detail">

              <button
                className="back"
                onClick={() =>
                  setView("home")
                }
              >
                ← Back
              </button>

              <div className="detail-card">

                <span className="pill">
                  {
                    selectedMedicine.category
                  }
                </span>

                {selectedMedicine.rx && (
                  <span className="rx">
                    Prescription required
                  </span>
                )}

                <h1>
                  {selectedMedicine.name}
                </h1>

                <p>
                  {selectedMedicine.generic}
                </p>

                <h2>
                  Compare nearby prices
                </h2>

                <div className="store-list">

                  {stores.map(
                    (store) => {

                      const price =
                        pharmacyPrices[
                          selectedMedicine
                            .name
                        ]?.[
                          store.name
                        ] ??
                        selectedMedicine.price;

                      const stock =
                        pharmacyStock[
                          store.name
                        ]?.[
                          selectedMedicine
                            .name
                        ] ?? 0;

                      return (
                        <div
                          className="store-row"
                          key={store.id}
                        >

                          <div>

                            <strong>
                              {store.name}
                            </strong>

                            <span>
                              {store.distance}
                              {" · "}
                              {store.time}
                              {" · ★ "}
                              {store.rating}
                            </span>

                          </div>

                          <div>

                            <b>
                              ₹{price}
                            </b>

                            <small>
                              {stock > 0
                                ? `${stock} in stock`
                                : "Out of stock"}
                            </small>

                            <button
                              disabled={
                                stock <= 0
                              }
                              onClick={() =>
                                addToCart(
                                  selectedMedicine,
                                  store
                                )
                              }
                            >
                              Add
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </section>
          )}

        {/* =================================================
            CART
        ================================================= */}

        {view === "cart" && (

          <section className="section">

            <button
              className="back"
              onClick={() =>
                setView("home")
              }
            >
              ← Continue shopping
            </button>

            <h1>
              Your cart
            </h1>

            {!cart.length ? (

              <div className="empty">
                Your cart is empty.
              </div>

            ) : (

              <>

                <div className="cart-list">

                  {cart.map(
                    (item) => (

                      <div
                        className="cart-row"
                        key={`${item.id}-${item.storeEmail}`}
                      >

                        <div>

                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            {item.storeName}
                            {" · "}
                            ₹{item.price}
                            {" "}each
                          </span>

                        </div>

                        <div className="qty">

                          <button
                            onClick={() =>
                              changeQty(
                                item.id,
                                item.storeEmail,
                                -1
                              )
                            }
                          >
                            −
                          </button>

                          <b>
                            {item.qty}
                          </b>

                          <button
                            onClick={() =>
                              changeQty(
                                item.id,
                                item.storeEmail,
                                1
                              )
                            }
                          >
                            +
                          </button>

                        </div>

                        <strong>
                          ₹
                          {item.price *
                            item.qty}
                        </strong>

                      </div>

                    )
                  )}

                </div>

                <div className="checkout">

                  <div>

                    <label>
                      Order mode
                    </label>

                    <select
                      value={mode}
                      onChange={(e) =>
                        setMode(
                          e.target.value
                        )
                      }
                    >

                      <option value="pickup">
                        Pickup
                      </option>

                      <option value="delivery">
                        Delivery
                      </option>

                    </select>

                  </div>

                  <div className="total">
                    Total: ₹{total}
                  </div>

                  <button
                    className="primary large"
                    disabled={loading}
                    onClick={
                      placeOrder
                    }
                  >
                    {loading
                      ? "Placing..."
                      : "Place order"}
                  </button>

                </div>

              </>
            )}

          </section>
        )}

        {/* =================================================
            CUSTOMER ORDERS
        ================================================= */}

        {view === "orders" && (

          <section className="section">

            <div className="section-title">

              <div>

                <h2>
                  Your orders
                </h2>

                <p>
                  {orders.length} order(s)
                </p>

              </div>

              {loggedIn && (
                <button
                  className="secondary"
                  onClick={
                    loadCustomerOrders
                  }
                >
                  Refresh
                </button>
              )}

            </div>

            {!loggedIn ? (

              <div className="empty">

                <p>
                  Login to view your
                  orders.
                </p>

                <button
                  className="primary"
                  onClick={() =>
                    setLoginOpen(true)
                  }
                >
                  Login
                </button>

              </div>

            ) : !orders.length ? (

              <div className="empty">
                No orders yet.
              </div>

            ) : (

              <div className="orders-list">

                {orders.map(
                  (order) => (

                    <article
                      className="order-card"
                      key={
                        order.order_id
                      }
                    >

                      <div>

                        <strong>
                          {order.order_id}
                        </strong>

                        <span>
                          {formatDate(
                            order.created_at
                          )}
                        </span>

                      </div>

                      <div>

                        <span>
                          {
                            order.pharmacy_name
                          }
                          {" · "}
                          {order.mode}
                        </span>

                        <b>
                          ₹{order.total}
                        </b>

                      </div>

                      <span
                        className={`status ${String(
                          order.status || ""
                        ).toLowerCase()}`}
                      >
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

        {view === "pharmacy" &&
          role === "Pharmacy" &&
          loggedIn && (

            <section className="section">

              <div className="section-title">

                <div>

                  <h2>
                    Pharmacy dashboard
                  </h2>

                  <p>
                    Logged in as:
                    {" "}
                    {userEmail}
                  </p>

                </div>

                <button
                  className="secondary"
                  onClick={() => {
                    loadPharmacyOrders();
                    loadPharmacyStock();
                  }}
                >
                  Refresh
                </button>

              </div>

              {/* ORDER REQUESTS */}

              <div className="stock-card">

                <h3>
                  Order Requests
                </h3>

                {!pharmacyOrders.length ? (

                  <div className="empty">
                    No order requests yet.
                  </div>

                ) : (

                  <div className="orders-list">

                    {pharmacyOrders.map(
                      (order) => (

                        <article
                          className="order-card"
                          key={
                            order.order_id
                          }
                        >

                          <div>

                            <strong>
                              {order.order_id}
                            </strong>

                            <span>
                              Customer:
                              {" "}
                              {
                                order.customer_email
                              }
                            </span>

                            <span>
                              {formatDate(
                                order.created_at
                              )}
                            </span>

                          </div>

                          <div>

                            <span>
                              {order.mode}
                            </span>

                            <b>
                              ₹{order.total}
                            </b>

                          </div>

                          <span
                            className={`status ${String(
                              order.status || ""
                            ).toLowerCase()}`}
                          >
                            {order.status}
                          </span>

                          {order.status ===
                            "Pending" && (

                            <div className="order-actions">

                              <button
                                className="primary"
                                onClick={() =>
                                  updateOrderStatus(
                                    order.order_id,
                                    "Accepted"
                                  )
                                }
                              >
                                Accept
                              </button>

                              <button
                                className="secondary"
                                onClick={() =>
                                  updateOrderStatus(
                                    order.order_id,
                                    "Rejected"
                                  )
                                }
                              >
                                Reject
                              </button>

                            </div>

                          )}

                          {order.status ===
                            "Accepted" && (

                            <div className="order-actions">

                              <button
                                className="primary"
                                onClick={() =>
                                  updateOrderStatus(
                                    order.order_id,
                                    "Ready"
                                  )
                                }
                              >
                                Mark Ready
                              </button>

                            </div>

                          )}

                          {order.status ===
                            "Ready" && (

                            <div className="order-actions">

                              <button
                                className="primary"
                                onClick={() =>
                                  updateOrderStatus(
                                    order.order_id,
                                    "Completed"
                                  )
                                }
                              >
                                Complete
                              </button>

                            </div>

                          )}

                        </article>

                      )
                    )}

                  </div>

                )}

              </div>

              {/* STOCK */}

              <div className="section-title">

                <div>

                  <h2>
                    Pharmacy stock
                  </h2>

                  <p>
                    Update available
                    quantities.
                  </p>

                </div>

              </div>

              {stores.map(
                (store) => (

                  <div
                    className="stock-card"
                    key={
                      store.name
                    }
                  >

                    <h3>
                      {store.name}
                    </h3>

                    <div className="stock-grid">

                      {medicines.map(
                        (medicine) => (

                          <div
                            className="stock-item"
                            key={
                              medicine.name
                            }
                          >

                            <span>
                              {medicine.name}
                            </span>

                            <input
                              type="number"
                              min="0"
                              value={
                                pharmacyStock[
                                  store.name
                                ]?.[
                                  medicine.name
                                ] ?? 0
                              }
                              onChange={(e) =>
                                setPharmacyStock(
                                  (current) => ({
                                    ...current,
                                    [store.name]:
                                      {
                                        ...current[
                                          store.name
                                        ],
                                        [medicine.name]:
                                          Number(
                                            e
                                              .target
                                              .value
                                          ) || 0,
                                      },
                                  })
                                )
                              }
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateStock(
                                  store.name,
                                  medicine.name,
                                  pharmacyStock[
                                    store.name
                                  ]?.[
                                    medicine.name
                                  ] ?? 0
                                )
                              }
                            >
                              Save
                            </button>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )
              )}

            </section>

          )}

      </main>

      {/* =================================================
          CART BUTTON
      ================================================= */}

      <button
        className="cart-fab"
        onClick={() =>
          setView("cart")
        }
      >
        🛒 Cart{" "}
        <span>
          {cart.reduce(
            (count, item) =>
              count + item.qty,
            0
          )}
        </span>
      </button>

      {/* =================================================
          LOGIN MODAL
      ================================================= */}

      {loginOpen && (

        <div
          className="modal-backdrop"
          onClick={() =>
            setLoginOpen(false)
          }
        >

          <div
            className="login-modal"
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

            <div className="login-icon">
              ✚
            </div>

            <h2>
              Login to MediFind
            </h2>

            <p>
              Login to place orders
              and manage your account.
            </p>

            <label>
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="email"
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

            {!otpSent ? (

              <button
                className="primary full"
                disabled={loading}
                onClick={
                  sendOtp
                }
              >
                {loading
                  ? "Sending..."
                  : "Send OTP"}
              </button>

            ) : (

              <>

                <label>
                  OTP
                </label>

                <input
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          8
                        )
                    )
                  }
                  placeholder="Enter OTP"
                />

                <button
                  className="primary full"
                  disabled={loading}
                  onClick={
                    verifyOtp
                  }
                >
                  {loading
                    ? "Verifying..."
                    : "Verify & Login"}
                </button>

                <button
                  className="secondary full"
                  disabled={loading}
                  onClick={
                    sendOtp
                  }
                >
                  Resend OTP
                </button>

              </>

            )}

            <small className="login-note">
              Authentication is handled
              securely by Supabase Auth.
            </small>

          </div>

        </div>

      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <strong>
          MediFind
        </strong>

        <span>
          Find medicines. Compare
          pharmacies. Order simply.
        </span>

      </footer>

    </div>
  );
}

/* =========================================================
   START APP
========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <App />
);
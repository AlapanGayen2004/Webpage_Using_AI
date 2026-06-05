import React, { useState, useEffect } from "react";
import { X, Star, CheckCircle2, User, Sparkles, ShieldCheck, Mail, Lock, ShoppingBag, Eye, Heart } from "lucide-react";
import { Product, CartItem, User as UserType, Order } from "./types";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import SupportChat from "./components/SupportChat";
import ProductCatalog from "./components/ProductCatalog";
import CheckoutFlow from "./components/CheckoutFlow";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  // Localization & Custom Styles Preferences
  const [currentLanguage, setLanguage] = useState<"en" | "es" | "fr">("en");
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [highContrast, setHighContrast] = useState(false);

  // Live Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Context Cart & active session structures
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Active user selections
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Open overlays controllers
  const [isOpenCart, setIsOpenCart] = useState(false);
  const [isOpenAdmin, setIsOpenAdmin] = useState(false);
  const [isOpenAuth, setIsOpenAuth] = useState(false);

  // Detailed Product popup Modal
  const [selectedInspectProduct, setSelectedInspectProduct] = useState<Product | null>(null);
  const [inspectSize, setInspectSize] = useState("");
  const [inspectColor, setInspectColor] = useState("");
  const [inspectQuantity, setInspectQuantity] = useState(1);
  const [inspectSuccessString, setInspectSuccessString] = useState("");

  // Customer account credentials forms state
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<"customer" | "admin">("customer");
  const [authFeedback, setAuthFeedback] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Fetch initial databases on mount
  useEffect(() => {
    fetchProducts();
    fetchOrdersLists();

    // Check if user session persisted
    const savedUser = localStorage.getItem("eshop_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Failed to load products list", e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchOrdersLists = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Failed to fetch customer orders indices", e);
    }
  };

  // Add / Adjust elements in Cart
  const handleAddToCart = (p: Product, qty: number, size?: string, color?: string) => {
    const existingIndex = cartItems.findIndex(
      (item) =>
        item.product.id === p.id &&
        item.selectedSize === size &&
        item.selectedColor === color
    );

    if (existingIndex > -1) {
      const copy = [...cartItems];
      copy[existingIndex].quantity += qty;
      setCartItems(copy);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product: p,
        quantity: qty,
        selectedSize: size || "",
        selectedColor: color || "",
      };
      setCartItems((prev) => [...prev, newItem]);
    }
  };

  const handleUpdateCartQty = (id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Inspect Product detail dialog
  const handleOpenProductDetail = (p: Product) => {
    setSelectedInspectProduct(p);
    
    // Choose sensible default size/color configs
    if (p.category === "Footwear") {
      setInspectSize("9");
      setInspectColor("Mineral Slate");
    } else if (p.category === "Apparel") {
      setInspectSize("M");
      setInspectColor("Flax Sand");
    } else {
      setInspectSize("Standard");
      setInspectColor("Classic Matte");
    }
    
    setInspectQuantity(1);
    setInspectSuccessString("");
  };

  const handleInspectAddToCart = () => {
    if (!selectedInspectProduct) return;
    
    if (inspectQuantity > selectedInspectProduct.stock) {
      alert("Selected quantity exceeds available boutique inventory.");
      return;
    }

    handleAddToCart(selectedInspectProduct, inspectQuantity, inspectSize, inspectColor);
    setInspectSuccessString(
      currentLanguage === "es"
        ? "¡Agregado a su bolsa de compras con éxito!"
        : currentLanguage === "fr"
          ? "Ajouté avec succès à votre panier !"
          : "Successfully added to your shopping bag!"
    );

    // Dynamic timeout reset
    setTimeout(() => {
      setInspectSuccessString("");
      setSelectedInspectProduct(null);
    }, 1500);
  };

  // Sign in & Secure credentials verification
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback("");
    setIsAuthSubmitting(true);

    if (!authEmail || !authPassword) {
      setAuthFeedback("Credentials must not be blank.");
      setIsAuthSubmitting(false);
      return;
    }

    try {
      const payload = {
        email: authEmail,
        password: authPassword,
        name: authName,
        role: authRole,
      };

      const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Authenticated
        setCurrentUser(data.user);
        localStorage.setItem("eshop_user", JSON.stringify(data.user));
        localStorage.setItem("eshop_token", data.token);

        // Notify
        setAuthFeedback("");
        setIsOpenAuth(false);
        
        // Reset form inputs
        setAuthEmail("");
        setAuthPassword("");
        setAuthName("");
      } else {
        setAuthFeedback(data.error || "Authentication procedure rejected.");
      }
    } catch (err) {
      setAuthFeedback("Secure login terminal timed out.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSimulateSocial = async (provider: string) => {
    setAuthFeedback("");
    setIsAuthSubmitting(true);
    try {
      const response = await fetch("/api/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem("eshop_user", JSON.stringify(data.user));
        localStorage.setItem("eshop_token", data.token);
        setIsOpenAuth(false);
      } else {
        setAuthFeedback("Social validation handshake timed out.");
      }
    } catch (e) {
      setAuthFeedback("Social validation authentication exception.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const cartTotalCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  // Dynamic application sizing classes (Accessibility)
  const getFontSizeClass = () => {
    if (fontSize === "sm") return "text-[13px]";
    if (fontSize === "lg") return "text-[17px]";
    return "text-[15px]"; // Standard base
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${getFontSizeClass()} ${
      highContrast 
        ? "bg-white text-black" 
        : darkMode 
          ? "bg-slate-950 text-slate-100" 
          : "bg-stone-50/50 text-stone-800"
    }`}>
      
      {/* Dynamic Header */}
      <Header
        currentLanguage={currentLanguage}
        setLanguage={setLanguage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        fontSize={fontSize}
        setFontSize={setFontSize}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onOpenCart={() => setIsOpenCart(true)}
        onOpenAdmin={() => setIsOpenAdmin(true)}
        onOpenAuth={() => setIsOpenAuth(true)}
        cartCount={cartTotalCount}
      />

      {/* Hero Carousel Banner Section */}
      <HeroSection
        currentLanguage={currentLanguage}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          // Scroll dynamically to the product grid
          const element = document.getElementById("product-showcase-anchor");
          element?.scrollIntoView({ behavior: "smooth" });
        }}
        selectedCategory={selectedCategory}
      />

      {/* Main product showpiece anchor */}
      <div id="product-showcase-anchor" className="scroll-mt-8">
        <ProductCatalog
          currentLanguage={currentLanguage}
          products={products}
          isLoadingProducts={isLoadingProducts}
          onAddToCart={handleAddToCart}
          onOpenProductDetail={handleOpenProductDetail}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          highContrast={highContrast}
        />
      </div>

      {/* floating Chat Stylist Assistant */}
      <SupportChat />

      {/* Modal 1: Secure checkout Flow Drawer */}
      <CheckoutFlow
        currentLanguage={currentLanguage}
        isOpen={isOpenCart}
        onClose={() => setIsOpenCart(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        onPlaceOrderSuccess={(completedOrder) => {
          setOrders((prev) => [completedOrder, ...prev]);
          // Refresh catalog to update live stock figures dynamically
          fetchProducts();
        }}
      />

      {/* Modal 2: Admin executive center panel Dashboard */}
      <AdminDashboard
        currentLanguage={currentLanguage}
        isOpen={isOpenAdmin}
        onClose={() => setIsOpenAdmin(false)}
        products={products}
        onRefreshProducts={fetchProducts}
        orders={orders}
        onRefreshOrders={fetchOrdersLists}
      />

      {/* Modal 3: Secure user session credentials portal popup */}
      {isOpenAuth && (
        <div id="auth-modal-overlay" className="fixed inset-0 bg-stone-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border dark:border-slate-800 p-6 flex flex-col text-stone-800 dark:text-stone-200 relative animate-fade-in font-sans">
            <button
              onClick={() => setIsOpenAuth(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-150 text-stone-400 hover:text-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6 space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 mx-auto animate-bounce">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-sans text-sm font-bold uppercase tracking-wider">
                {authMode === "login" ? "Boutique Credentials Access" : "Join Curator Network"}
              </h3>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">Secured Auth Server Gateway</p>
            </div>

            {authFeedback && (
              <div className="p-3 rounded-lg bg-red-50 text-red-650 font-bold mb-4 border border-red-150 text-[11px] text-center animate-pulse">
                {authFeedback}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-semibold">
              {authMode === "register" && (
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-stone-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-2.5 text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full font-semibold"
                    placeholder="Elena Rodríguez"
                  />
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-stone-400">E-mail Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-2.5 text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full font-semibold"
                  placeholder="elena@eshop.com"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-stone-400">Secure PIN Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-2.5 text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full font-semibold"
                  placeholder="••••••••"
                />
              </div>

              {authMode === "register" && (
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-stone-400">Define Network Designation</label>
                  <select
                    value={authRole}
                    onChange={(e: any) => setAuthRole(e.target.value)}
                    className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-2.5 text-stone-955 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full cursor-pointer pointer-events-auto font-semibold"
                  >
                    <option value="customer" className="text-stone-900 dark:text-white bg-white dark:bg-slate-950">Boutique Customer Collector</option>
                    <option value="admin" className="text-stone-900 dark:text-white bg-white dark:bg-slate-950">Executive Boutique Manager (Elena)</option>
                  </select>
                </div>
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={isAuthSubmitting}
                className="w-full flex items-center justify-center py-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-amber-500 dark:text-slate-950 font-bold uppercase tracking-widest text-[11px] cursor-pointer"
              >
                {isAuthSubmitting ? (
                  <span>Dispatching Tokens...</span>
                ) : authMode === "login" ? (
                  "Authorise Credentials"
                ) : (
                  "Create Curator Account"
                )}
              </button>
            </form>

            {/* Simulated social Single Sign-On alternatives */}
            <div className="mt-6 space-y-3.5 border-t border-stone-100 dark:border-slate-800 pt-4">
              <span className="text-[9px] uppercase tracking-widest text-stone-400 text-center block font-mono">Or authorize via Single Sign-On</span>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  id="simulate-sso-google"
                  onClick={() => handleSimulateSocial("Google")}
                  className="flex items-center justify-center space-x-1.5 py-2 rounded border border-stone-200 text-[10px] uppercase font-bold hover:bg-stone-50 dark:hover:bg-slate-900 cursor-pointer pointer-events-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Google Account</span>
                </button>
                <button
                  id="simulate-sso-apple"
                  onClick={() => handleSimulateSocial("Apple ID")}
                  className="flex items-center justify-center space-x-1.5 py-2 rounded border border-stone-200 text-[10px] uppercase font-bold hover:bg-stone-50 dark:hover:bg-slate-900 cursor-pointer pointer-events-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Apple ID token</span>
                </button>
              </div>
            </div>

            {/* Toggle state and mock login notes alert */}
            <div className="mt-6 text-center">
              <button
                id="toggle-auth-mode-btn"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthFeedback("");
                }}
                className="text-[11px] font-sans text-stone-500 hover:text-stone-903 underline cursor-pointer"
              >
                {authMode === "login"
                  ? "New to eShop? Secure an account here"
                  : "Already registered? Login authorized terminal"}
              </button>
              <div className="mt-3.5 text-[9px] font-mono text-amber-600 bg-amber-500/5 p-2 rounded text-left leading-normal border border-amber-500/10">
                💡 <strong>Admin Hub Preview Account:</strong> Login with email: <code>elena@eshop.com</code>, and any password to instantly bypass and unlock the advanced Admin Executive Hub!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Detailed Product Inspection popup Detail Card */}
      {selectedInspectProduct && (
        <div id="product-detail-modal-overlay" className="fixed inset-0 bg-stone-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border dark:border-slate-800/80 flex flex-col md:flex-row overflow-hidden relative animate-fade-in text-stone-800 dark:text-stone-200 font-sans">
            
            {/* Close */}
            <button
              onClick={() => setSelectedInspectProduct(null)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/90 shadow text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Highlight Image mockup */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto md:h-auto max-h-[25rem] bg-stone-100 dark:bg-slate-900 overflow-hidden relative border-r dark:border-slate-850">
              <img
                referrerPolicy="no-referrer"
                src={selectedInspectProduct.image}
                alt={selectedInspectProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right: Technical specifications selections form */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
              <div>
                {/* Category & Rating */}
                <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-stone-400 uppercase">
                  <span>{selectedInspectProduct.category}</span>
                  <span className="flex items-center font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                    {selectedInspectProduct.rating} / 5.0
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-sans text-base md:text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-2">
                  {selectedInspectProduct.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-base font-bold font-sans text-stone-900 dark:text-amber-400">${selectedInspectProduct.price}</span>
                  {selectedInspectProduct.originalPrice && (
                    <span className="text-xs line-through text-stone-450 font-mono">${selectedInspectProduct.originalPrice}</span>
                  )}
                </div>

                <p className="font-serif font-light text-slate-500 dark:text-slate-400 leading-relaxed mt-4 text-[13px]">
                  {selectedInspectProduct.description}
                </p>

                {/* Customizable selections */}
                <div className="space-y-4 mt-6">
                  {/* Highlight feature list items */}
                  <div className="space-y-1">
                    <label className="text-[9px] tracking-widest font-bold uppercase text-stone-400 font-mono">Artisan Highlights</label>
                    <ul className="list-disc pl-4 text-[11px] text-stone-500 dark:text-slate-400">
                      {selectedInspectProduct.features.map((f, idx) => (
                        <li key={idx} className="font-serif">{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1.5">
                    {/* Size Selector */}
                    <div className="flex flex-col space-y-1 text-xs">
                      <label className="text-[9px] tracking-widest font-mono font-bold uppercase text-stone-430">Size Specification</label>
                      <select
                        value={inspectSize}
                        onChange={(e) => setInspectSize(e.target.value)}
                        className="bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded px-2.5 py-1.5 focus:outline-none dark:text-slate-200 cursor-pointer pointer-events-auto"
                      >
                        {selectedInspectProduct.category === "Footwear" ? (
                          <>
                            <option value="8">US 8</option>
                            <option value="9">US 9</option>
                            <option value="10">US 10</option>
                            <option value="11">US 11</option>
                          </>
                        ) : selectedInspectProduct.category === "Apparel" ? (
                          <>
                            <option value="S">S - Petite Fit</option>
                            <option value="M">M - Custom Drape</option>
                            <option value="L">L - Loose Fit</option>
                            <option value="XL">XL - Comfort Oversized</option>
                          </>
                        ) : (
                          <option value="Standard">One Universal Size</option>
                        )}
                      </select>
                    </div>

                    {/* Color Selector */}
                    <div className="flex flex-col space-y-1 text-xs">
                      <label className="text-[9px] tracking-widest font-mono font-bold uppercase text-stone-430">Aesthetic Palette</label>
                      <select
                        value={inspectColor}
                        onChange={(e) => setInspectColor(e.target.value)}
                        className="bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded px-2.5 py-1.5 focus:outline-none dark:text-slate-200 cursor-pointer pointer-events-auto"
                      >
                        {selectedInspectProduct.category === "Footwear" ? (
                          <>
                            <option value="Mineral Slate">Mineral Slate</option>
                            <option value="Obsidian Coal">Obsidian Coal</option>
                            <option value="Chalk Snow">Chalk Snow</option>
                          </>
                        ) : selectedInspectProduct.category === "Apparel" ? (
                          <>
                            <option value="Flax Sand">Flax Sand</option>
                            <option value="Natural Twill">Natural Twill</option>
                            <option value="Midnight Navy">Midnight Navy</option>
                          </>
                        ) : (
                          <>
                            <option value="Classic Matte">Classic Matte</option>
                            <option value="Anodized Gold">Anodized Gold</option>
                            <option value="Industrial Raw">Industrial Raw</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center space-x-3.5 pt-1.5">
                    <span className="text-[9px] tracking-widest font-mono font-bold uppercase text-stone-430">Quantity</span>
                    <div className="flex items-center space-x-2.5 border border-stone-200 dark:border-slate-800 rounded-md p-1 bg-stone-50/50 dark:bg-slate-900">
                      <button
                        onClick={() => setInspectQuantity(Math.max(1, inspectQuantity - 1))}
                        className="w-5.5 h-5.5 rounded bg-white hover:bg-stone-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center cursor-pointer font-mono"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold font-mono w-6 text-center">{inspectQuantity}</span>
                      <button
                        onClick={() => setInspectQuantity(Math.min(selectedInspectProduct.stock, inspectQuantity + 1))}
                        className="w-5.5 h-5.5 rounded bg-white hover:bg-stone-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center cursor-pointer font-mono"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">({selectedInspectProduct.stock} in stock)</span>
                  </div>
                </div>
              </div>

              {/* Success / Action block */}
              <div className="space-y-4 pt-6 mt-6 border-t border-stone-100 dark:border-slate-900">
                {inspectSuccessString && (
                  <div className="p-3 bg-green-50 text-green-650 text-[11px] font-bold text-center border border-green-200 rounded-lg flex items-center justify-center space-x-2 animate-bounce">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
                    <span>{inspectSuccessString}</span>
                  </div>
                )}

                <button
                  id="inspect-add-to-cart-btn"
                  onClick={handleInspectAddToCart}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-stone-900 hover:bg-stone-850 text-stone-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition cursor-pointer"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  <span>Reserve & Bag Curated Piece</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Styled Footer */}
      <footer className={`border-t py-12 transition-colors ${
        highContrast 
          ? "bg-white text-black border-black" 
          : "bg-stone-900 text-stone-300 dark:bg-slate-950 dark:border-slate-900"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 text-white">
              <Sparkles className="w-4.5 h-4.5 text-amber-400" />
              <span className="font-sans text-sm font-bold uppercase tracking-wider">eShop Private Storefront</span>
            </div>
            <p className="font-serif font-light text-[11px] leading-relaxed text-stone-400 my-4">
              Premium curated objects handcrafted by artisanal design collectives worldwide. Sustainable, traceable, and calibrated for modern cognitive spaces.
            </p>
          </div>

          <div>
            <h5 className="font-sans text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-3">Shop Collections</h5>
            <div className="flex flex-col space-y-2 text-[11px] text-stone-400">
              <button onClick={() => { setSelectedCategory("Electronics"); window.scrollTo({ top: 300, behavior: "smooth" }); }} className="text-left hover:text-white transition cursor-pointer">Acoustic Audio Essentials</button>
              <button onClick={() => { setSelectedCategory("Accessories"); window.scrollTo({ top: 300, behavior: "smooth" }); }} className="text-left hover:text-white transition cursor-pointer">Bespoke Chronographs</button>
              <button onClick={() => { setSelectedCategory("Footwear"); window.scrollTo({ top: 300, behavior: "smooth" }); }} className="text-left hover:text-white transition cursor-pointer">Rebound Running Footwear</button>
              <button onClick={() => { setSelectedCategory("Apparel"); window.scrollTo({ top: 300, behavior: "smooth" }); }} className="text-left hover:text-white transition cursor-pointer">Premium Textile Apparel</button>
            </div>
          </div>

          <div>
            <h5 className="font-sans text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-3">Interactive Security</h5>
            <div className="flex flex-col space-y-2 text-[11px] text-stone-400 font-mono">
              <p className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                <span>PCI-DSS Decoupled Ledger</span>
              </p>
              <p className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-green-400" />
                <span>TLS 1.3 Certified Gateway</span>
              </p>
              <button
                onClick={() => { setIsOpenAuth(true); setAuthMode("register"); }}
                className="text-left text-amber-400 underline hover:text-amber-300 font-sans font-bold cursor-pointer"
              >
                Sign Up as Boutique Manager
              </button>
            </div>
          </div>

          <div>
            <h5 className="font-sans text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-3">Artisanal Outpost</h5>
            <address className="not-italic text-[11px] text-stone-400 leading-relaxed font-serif">
              Studio Suite 880<br />
              Carrera del Darro 42<br />
              Albaicín, Granada 18010, ES<br />
              📧 concierge@eshop.com
            </address>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-stone-800/60 dark:border-slate-900 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-stone-500">
          <p>© 2026 eShop Boutique. All rights reserved. Registered Collective, Granada Headquarters.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span className="hover:text-stone-300 cursor-pointer">Intellectual Assets License</span>
            <span>•</span>
            <span className="hover:text-stone-300 cursor-pointer">Climate Neutral Certification Log</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

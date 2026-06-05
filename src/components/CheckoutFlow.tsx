import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Mail, CreditCard, CheckCircle2, Lock, Sparkles, RefreshCw } from "lucide-react";
import { Product, CartItem, ShippingAddress, Order } from "../types";

interface CheckoutFlowProps {
  currentLanguage: "en" | "es" | "fr";
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (itemId: string, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  currentUser: any;
  onPlaceOrderSuccess: (order: Order) => void;
}

const translations = {
  en: {
    cartTitle: "Shopping Bag",
    checkoutSteps: ["Review Bag", "Shipping Details", "Secure Payment", "Order Complete"],
    subtotal: "Subtotal",
    tax: "Sales Tax (8%)",
    discount: "Promo Discount",
    total: "Final Total",
    emptyCart: "Your shopping bag is completely empty.",
    continueShopping: "Browse boutique collection",
    promoCodeLabel: "Promotional Voucher",
    promoPlaceholder: "Enter SAVE20 or FREESHIP",
    applyPromo: "Apply",
    promoSuccess: "Promotional discount applied successfully!",
    promoError: "Invalid promotional discount voucher.",
    nextStep: "Proceed to Checkout",
    prevStep: "Back",
    shippingTitle: "Shipping & Delivery Parameters",
    fullName: "Full Name",
    email: "Email Address",
    street: "Street Address",
    city: "City",
    postalCode: "Postal / ZIP Code",
    country: "Country",
    paymentTitle: "Secure Billing Settlement",
    cardNum: "Card Number",
    cardExp: "Expiry (MM/YY)",
    cardCvc: "Security (CVC)",
    cardPlaceholder: "4242 4242 4242 4242",
    checkoutBtn: "Complete Secure Payment",
    processingTitle: "Authorizing Liquidity...",
    processingDesc: "Our high-concurrency payment gateway is securing transaction certificates via TLS 1.3 encryption protocols.",
    successTitle: "Order Confirmed",
    successDesc: "Your purchase was successfully authenticated. Automated notifications have been logged and scheduled to your inbox.",
    printReceipt: "Order ID:",
    transacId: "Transaction Authorization Token:",
    estDeli: "Estimated climate-neutral delivery date:",
    color: "Color",
    size: "Size",
  },
  es: {
    cartTitle: "Bolsa de Compras",
    checkoutSteps: ["Revisar Bolsa", "Datos de Envío", "Pago Seguro", "Orden Completa"],
    subtotal: "Subtotal",
    tax: "Impuesto de Ventas (8%)",
    discount: "Descuento Promocional",
    total: "Total Final",
    emptyCart: "Su bolsa de compras está completamente vacía.",
    continueShopping: "Ver colecciones de la tienda",
    promoCodeLabel: "Cupón de Descuento",
    promoPlaceholder: "Ingrese SAVE20 o FREESHIP",
    applyPromo: "Aplicar",
    promoSuccess: "¡Cupón promocional aplicado correctamente!",
    promoError: "Cupón de descuento no válido.",
    nextStep: "Proceder al Pago",
    prevStep: "Atrás",
    shippingTitle: "Parámetros de Envío y Entrega",
    fullName: "Nombre Completo",
    email: "Correo Electrónico",
    street: "Calle y Número",
    city: "Ciudad",
    postalCode: "Código Postal",
    country: "País",
    paymentTitle: "Liquidación Factura de Pago",
    cardNum: "Número de Tarjeta",
    cardExp: "Expiración (MM/AA)",
    cardCvc: "Código de Seguridad (CVC)",
    cardPlaceholder: "4242 4242 4242 4242",
    checkoutBtn: "Completar Pago Seguro",
    processingTitle: "Autorizando Liquidez...",
    processingDesc: "Nuestro portal de pagos de alta concurrencia está asegurando certificados criptográficos mediante TLS 1.3.",
    successTitle: "Orden Confirmada",
    successDesc: "Su compra fue autenticada con éxito. Un correo automatizado de seguimiento ha sido calendarizado.",
    printReceipt: "Orden ID:",
    transacId: "Token de Autorización de Transacción:",
    estDeli: "Fecha aproximada de entrega ecológica:",
    color: "Color",
    size: "Medida",
  },
  fr: {
    cartTitle: "Panier d'Achats",
    checkoutSteps: ["Mon Panier", "Livraison", "Paiement Sécurisé", "Commande Validée"],
    subtotal: "Sous-total",
    tax: "Taxes sur les ventes (8%)",
    discount: "Descriptif promotion",
    total: "Total Final",
    emptyCart: "Votre panier est actuellement vide.",
    continueShopping: "Retour aux collections",
    promoCodeLabel: "Bon de Réduction",
    promoPlaceholder: "Entrer SAVE20 ou FREESHIP",
    applyPromo: "Valider",
    promoSuccess: "Bon de réduction appliqué avec succès !",
    promoError: "Code promotionnel invalide.",
    nextStep: "Passer à la livraison",
    prevStep: "Étape précédente",
    shippingTitle: "Adresse de Livraison & Contact",
    fullName: "Nom Complet",
    email: "Adresse E-mail",
    street: "Rue & Numéro",
    city: "Ville",
    postalCode: "Code Postal",
    country: "Pays",
    paymentTitle: "Transaction Bancaire Sécurisée",
    cardNum: "Numéro de Carte",
    cardExp: "Expiration (MM/AA)",
    cardCvc: "Code de sécurité (CVC)",
    cardPlaceholder: "4242 4242 4242 4242",
    checkoutBtn: "Régler la Transaction",
    processingTitle: "Autorisation des fonds...",
    processingDesc: "Notre serveur haute capacité négocie la clé d'achat via les passerelles cryptographiques sûres TLS 1.3.",
    successTitle: "Commande Enregistrée",
    successDesc: "Votre achat a été authentifié avec succès. Un e-mail de suivi automatique a été programmé.",
    printReceipt: "N° de Commande :",
    transacId: "Clé de transaction bancaire :",
    estDeli: "Date d'arrivée verte estimée :",
    color: "Couleur",
    size: "Taille",
  }
};

export default function CheckoutFlow({
  currentLanguage,
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  currentUser,
  onPlaceOrderSuccess,
}: CheckoutFlowProps) {
  const [step, setStep] = useState(1); // 1 = Review, 2 = Shipping, 3 = Payment, 4 = Success
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscountRate, setPromoDiscountRate] = useState(0);
  const [promoFeedback, setPromoFeedback] = useState<{ status: "success" | "error"; text: string } | null>(null);

  // Form Fields State
  const [shipName, setShipName] = useState(currentUser?.name || "");
  const [shipEmail, setShipEmail] = useState(currentUser?.email || "");
  const [shipStreet, setShipStreet] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipPostal, setShipPostal] = useState("");
  const [shipCountry, setShipCountry] = useState("United States");

  const [hasSavedShipping, setHasSavedShipping] = useState(false);
  const [useSavedShipping, setUseSavedShipping] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("eshop_saved_shipping");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setShipName(parsed.name || currentUser?.name || "");
          setShipEmail(parsed.email || currentUser?.email || "");
          setShipStreet(parsed.street || "");
          setShipCity(parsed.city || "");
          setShipPostal(parsed.postalCode || parsed.postal || "");
          setShipCountry(parsed.country || "United States");
          setHasSavedShipping(true);
          setUseSavedShipping(true);
        } catch (e) {
          // ignore
        }
      } else {
        setShipName(currentUser?.name || "");
        setShipEmail(currentUser?.email || "");
        setShipStreet("");
        setShipCity("");
        setShipPostal("");
        setShipCountry("United States");
        setHasSavedShipping(false);
        setUseSavedShipping(false);
      }
    }
  }, [isOpen, currentUser]);

  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusString, setProcessingStatusString] = useState("Vetting card parameters...");
  const [finalPlacedOrder, setFinalPlacedOrder] = useState<Order | null>(null);
  const [errorString, setErrorString] = useState("");

  const t = translations[currentLanguage];

  if (!isOpen) return null;

  // Calculation parameters
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = Math.round(subtotal * promoDiscountRate * 100) / 100;
  const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100;
  const total = Math.round((subtotal - discount + tax) * 100) / 100;

  const handleApplyPromo = () => {
    const input = promoCodeInput.trim().toUpperCase();
    if (input === "SAVE20") {
      setAppliedPromo("SAVE20");
      setPromoDiscountRate(0.2); // 20% Off
      setPromoFeedback({ status: "success", text: t.promoSuccess });
    } else if (input === "FREESHIP") {
      setAppliedPromo("FREESHIP");
      setPromoDiscountRate(0.0); // Simple free deliveries
      setPromoFeedback({ status: "success", text: t.promoSuccess });
    } else {
      setPromoFeedback({ status: "error", text: t.promoError });
    }
  };

  const handleMoveToStep2 = () => {
    setErrorString("");
    if (cartItems.length === 0) return;
    setStep(2);
  };

  const handleMoveToStep3 = () => {
    setErrorString("");
    if (!shipName || !shipEmail || !shipStreet || !shipCity || !shipPostal) {
      setErrorString(currentLanguage === "es" ? "Por favor complete todos los datos requeridos." : "Please complete all shipping parameters.");
      return;
    }
    try {
      const addressData = {
        name: shipName,
        email: shipEmail,
        street: shipStreet,
        city: shipCity,
        postalCode: shipPostal,
        country: shipCountry,
      };
      localStorage.setItem("eshop_saved_shipping", JSON.stringify(addressData));
      setHasSavedShipping(true);
    } catch (e) {
      console.error("Failed to cache shipping parameters", e);
    }
    setStep(3);
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorString("");

    if (paymentMethod === "credit-card") {
      if (!cardNumber || !cardExpiry || !cardCvc) {
        setErrorString(currentLanguage === "es" ? "Por favor complete los datos de su tarjeta de crédito." : "Please complete credit card specifications.");
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStatusString("Verifying terminal ledger liquidity...");

    // Stage 1 visual process timer
    setTimeout(() => {
      setProcessingStatusString("Synchronizing payment gateway encryption handshake...");
      
      // Stage 2 visual process timer
      setTimeout(async () => {
        try {
          const address: ShippingAddress = {
            name: shipName,
            street: shipStreet,
            city: shipCity,
            postalCode: shipPostal,
            country: shipCountry,
          };

          const reqPayload = {
            userId: currentUser?.id || "guest-customer",
            userName: shipName,
            userEmail: shipEmail,
            items: cartItems,
            paymentMethod: paymentMethod === "credit-card" ? "Visa **** 4242" : "Apple Pay digital token",
            shippingAddress: address,
            promoCode: appliedPromo,
          };

          const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqPayload),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Simulated payment processing exception");
          }

          const completedOrder: Order = await response.json();

          setFinalPlacedOrder(completedOrder);
          onPlaceOrderSuccess(completedOrder);
          onClearCart();
          setStep(4);
        } catch (err: any) {
          setErrorString(err.message || "Financial transaction rejected. Please verify limit or try code SAVE20.");
        } finally {
          setIsProcessing(false);
        }
      }, 1500);
    }, 1500);
  };

  const getStepClass = (s: number) => {
    if (step === s) return "text-amber-500 font-bold border-b-2 border-amber-500";
    if (step > s) return "text-stone-400 dark:text-slate-500 line-through";
    return "text-stone-400 dark:text-slate-500";
  };

  const deliveryDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString(currentLanguage === "fr" ? "fr-FR" : currentLanguage === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div id="checkout-sheet-overlay" className="fixed inset-0 bg-stone-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      
      {/* Drawer */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-stone-800 dark:text-slate-100 font-sans border dark:border-slate-800 animate-fade-in">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-slate-900 flex items-center justify-between bg-stone-50 dark:bg-slate-950">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-stone-900 dark:text-amber-400 animate-bounce" />
            <span className="font-sans font-bold text-base uppercase tracking-wider">{t.cartTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic checkout timeline */}
        <div className="px-5 py-3 border-b border-stone-100 dark:border-slate-900 bg-stone-50/30 dark:bg-slate-950/40 text-[10px] tracking-widest font-mono uppercase flex justify-between overflow-x-auto scrollbar-hide space-x-4">
          {t.checkoutSteps.map((name, idx) => (
            <span key={idx} className={getStepClass(idx + 1)}>
              {idx + 1}. {name}
            </span>
          ))}
        </div>

        {/* Content Panel scrollable */}
        <div className="flex-1 p-6 overflow-y-auto">
          {errorString && (
            <div className="p-4.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold mb-6 flex items-center space-x-2 border border-red-200 dark:border-red-950/40 animate-pulse">
              <span>{errorString}</span>
            </div>
          )}

          {/* Render STEP 1: Review BAG */}
          {step === 1 && (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Items */}
              <div className="flex-1 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center space-y-4">
                    <ShoppingBag className="w-12 h-12 text-stone-300" />
                    <p className="text-serif text-sm font-light text-stone-500 dark:text-slate-400">{t.emptyCart}</p>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-semibold tracking-wider uppercase cursor-pointer"
                    >
                      {t.continueShopping}
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 rounded-xl border border-stone-100 dark:border-slate-900 bg-stone-50/40 dark:bg-slate-900/10">
                      <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-stone-100 dark:bg-slate-950">
                        <img referrerPolicy="no-referrer" src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans text-xs font-semibold text-stone-900 dark:text-slate-100 truncate">{item.product.name}</h4>
                        <p className="text-[10px] text-stone-500 dark:text-slate-400 font-mono mt-0.5">
                          {item.selectedSize && `${t.size}: ${item.selectedSize}`} {item.selectedColor && `• ${t.color}: ${item.selectedColor}`}
                        </p>
                        <div className="flex items-center space-x-1.5 mt-2">
                          <button
                            onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                            className="w-5.5 h-5.5 rounded bg-stone-200 hover:bg-stone-300 dark:bg-slate-850 text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                            className="w-5.5 h-5.5 rounded bg-stone-200 hover:bg-stone-300 dark:bg-slate-850 text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-sans text-xs font-bold">${item.product.price * item.quantity}</span>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="block text-stone-400 hover:text-red-500 transition mt-1.5 text-right ml-auto cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Pricing Summary & Promo Coupon */}
              <div className="w-full md:w-80 space-y-6">
                {cartItems.length > 0 && (
                  <>
                    {/* Promo Codes */}
                    <div className="p-4 rounded-xl border border-stone-100 dark:border-slate-900 bg-stone-50/50 dark:bg-slate-900/10">
                      <label className="text-[10px] tracking-widest font-mono uppercase text-stone-400 dark:text-slate-500 block mb-2">{t.promoCodeLabel}</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          placeholder={t.promoPlaceholder}
                          className="flex-1 bg-white dark:bg-slate-900 text-xs px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-slate-800 focus:outline-none focus:border-stone-400"
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="px-4 py-2 bg-stone-900 text-stone-50 dark:bg-amber-500 dark:text-slate-950 font-bold text-xs uppercase tracking-wide rounded-lg hover:bg-stone-800 cursor-pointer"
                        >
                          {t.applyPromo}
                        </button>
                      </div>

                      {promoFeedback && (
                        <p className={`text-[10px] font-mono mt-2 flex items-center space-x-1 ${
                          promoFeedback.status === "success" ? "text-green-600 dark:text-green-400" : "text-red-550"
                        }`}>
                          <span>{promoFeedback.text}</span>
                        </p>
                      )}
                    </div>

                    {/* Summary lists */}
                    <div className="p-4 rounded-xl border border-stone-150 dark:border-slate-900 space-y-3 bg-stone-50/30">
                      <div className="flex justify-between text-xs text-stone-500">
                        <span>{t.subtotal}</span>
                        <span className="font-mono">${subtotal}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-xs text-green-600 dark:text-green-400 font-semibold">
                          <span>{t.discount}</span>
                          <span className="font-mono">-${discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-stone-500">
                        <span>{t.tax}</span>
                        <span className="font-mono">${tax}</span>
                      </div>
                      <div className="h-px bg-stone-200 dark:bg-slate-900 my-1"></div>
                      <div className="flex justify-between text-sm font-bold text-stone-900 dark:text-slate-100">
                        <span>{t.total}</span>
                        <span className="font-sans text-amber-550 dark:text-amber-400">${total}</span>
                      </div>
                    </div>

                    <button
                      id="checkout-next-step-btn"
                      onClick={handleMoveToStep2}
                      className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-widest transition shadow-md cursor-pointer pointer-events-auto"
                    >
                      <span>{t.nextStep}</span>
                      <ArrowRight className="w-4.5 h-4.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Render STEP 2: Shipping details forms */}
          {step === 2 && (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-xs font-semibold text-stone-800 dark:text-slate-100">
              <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-slate-200 pl-1 border-l-4 border-amber-500">
                {t.shippingTitle}
              </h3>

              {hasSavedShipping && (
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 dark:border-slate-800 dark:bg-slate-900/60 flex flex-col space-y-3">
                  <span className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-slate-400 font-bold block mb-1">
                    Choose Delivery Details Profile:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Option A: Use saved address */}
                    <button
                      type="button"
                      onClick={() => setUseSavedShipping(true)}
                      className={`flex items-start text-left p-3 rounded-lg border cursor-pointer transition-all ${
                        useSavedShipping 
                          ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10" 
                          : "border-stone-200 hover:bg-stone-50 dark:border-slate-850 dark:hover:bg-slate-800/45 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={useSavedShipping}
                        onChange={() => {}}
                        className="mt-0.5 mr-2.5 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block uppercase text-[9.5px]">Use Previously Saved Address</span>
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 block mt-1 line-clamp-1">
                          {shipName} — {shipStreet}
                        </span>
                      </div>
                    </button>

                    {/* Option B: Enter other details */}
                    <button
                      type="button"
                      onClick={() => setUseSavedShipping(false)}
                      className={`flex items-start text-left p-3 rounded-lg border cursor-pointer transition-all ${
                        !useSavedShipping 
                          ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10" 
                          : "border-stone-200 hover:bg-stone-50 dark:border-slate-850 dark:hover:bg-slate-800/45 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={!useSavedShipping}
                        onChange={() => {}}
                        className="mt-0.5 mr-2.5 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block uppercase text-[9.5px]">Enter New Credentials</span>
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 block mt-1">
                          Override database with another address.
                        </span>
                      </div>
                    </button>

                  </div>
                </div>
              )}

              {hasSavedShipping && useSavedShipping ? (
                <div className="space-y-6">
                  {/* Saved Shipping Profile located banner block */}
                  <div className="p-5 rounded-xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] tracking-widest font-mono uppercase text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 mr-1 shrink-0 animate-pulse" />
                        <span>Confirm Saved Delivery Profile Details</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-stone-850 dark:text-slate-200 text-xs border-t border-stone-200/50 dark:border-slate-800/80 pt-4 font-semibold">
                      <div>
                        <span className="text-stone-400 dark:text-slate-500 uppercase text-[9px] tracking-wider block font-mono">Recipient Name</span>
                        <p className="font-sans font-bold text-sm text-stone-900 dark:text-white mt-0.5">{shipName}</p>
                      </div>
                      <div>
                        <span className="text-stone-400 dark:text-slate-500 uppercase text-[9px] tracking-wider block font-mono">Email Address</span>
                        <p className="font-serif text-stone-800 dark:text-slate-300 mt-0.5">{shipEmail}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-stone-400 dark:text-slate-500 uppercase text-[9px] tracking-wider block font-mono">Shipping destination</span>
                        <p className="font-serif text-stone-800 dark:text-slate-300 mt-0.5">
                          {shipStreet}, {shipCity}, {shipPostal} ({shipCountry})
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50 dark:bg-slate-900/30 border border-stone-200 dark:border-slate-800/80 rounded-lg p-4 font-serif text-xs font-light text-stone-600 dark:text-slate-400 leading-relaxed">
                    💡 <strong>Quick Checkout Active:</strong> Your shipping credentials are pre-filled safely. You can proceed directly to authorize payment for the new cart amount of <strong className="text-stone-900 dark:text-amber-400 font-sans">${total}</strong>.
                  </div>

                  <div className="pt-6 flex justify-between space-x-4 border-t border-stone-100 dark:border-slate-900">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3 rounded-lg border border-stone-200 hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-900 text-xs font-semibold px-6 uppercase tracking-wider transition cursor-pointer"
                    >
                      {t.prevStep}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      <span>{t.nextStep}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-slate-400">{t.fullName}</label>
                      <input
                        type="text"
                        value={shipName}
                        onChange={(e) => setShipName(e.target.value)}
                        required
                        className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-3 placeholder-stone-400 text-stone-950 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans font-semibold text-xs transition-all w-full"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-slate-400">{t.email}</label>
                      <input
                        type="email"
                        value={shipEmail}
                        onChange={(e) => setShipEmail(e.target.value)}
                        required
                        className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-3 placeholder-stone-400 text-stone-950 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans font-semibold text-xs transition-all w-full"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-slate-400">{t.street}</label>
                    <input
                      type="text"
                      value={shipStreet}
                      onChange={(e) => setShipStreet(e.target.value)}
                      required
                      placeholder="Apartment, suite, unit, number and street name"
                      className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-3 placeholder-stone-400 text-stone-955 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans font-semibold text-xs transition-all w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-slate-400">{t.city}</label>
                      <input
                        type="text"
                        value={shipCity}
                        onChange={(e) => setShipCity(e.target.value)}
                        required
                        className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-3 placeholder-stone-400 text-stone-950 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans font-semibold text-xs transition-all w-full"
                        placeholder="City"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-slate-400">{t.postalCode}</label>
                      <input
                        type="text"
                        value={shipPostal}
                        onChange={(e) => setShipPostal(e.target.value)}
                        required
                        className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-3 placeholder-stone-400 text-stone-950 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans font-semibold text-xs transition-all w-full"
                        placeholder="ZIP or Postal Code"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-slate-400">{t.country}</label>
                      <select
                        value={shipCountry}
                        onChange={(e) => setShipCountry(e.target.value)}
                        className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-3 text-stone-955 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 pointer-events-auto cursor-pointer font-sans font-semibold text-xs transition-all w-full"
                      >
                        <option value="United States" className="text-stone-900 bg-white dark:bg-slate-900 dark:text-white">United States</option>
                        <option value="Canada" className="text-stone-900 bg-white dark:bg-slate-900 dark:text-white">Canada</option>
                        <option value="United Kingdom" className="text-stone-900 bg-white dark:bg-slate-900 dark:text-white">United Kingdom</option>
                        <option value="Spain" className="text-stone-900 bg-white dark:bg-slate-900 dark:text-white">Spain</option>
                        <option value="France" className="text-stone-900 bg-white dark:bg-slate-900 dark:text-white">France</option>
                        <option value="Germany" className="text-stone-900 bg-white dark:bg-slate-900 dark:text-white">Germany</option>
                      </select>
                    </div>
                  </div>

                  {hasSavedShipping && (
                    <div className="pt-2 text-right">
                      <button
                        type="button"
                        onClick={() => setUseSavedShipping(true)}
                        className="text-[10px] uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        ← Use previous details instead
                      </button>
                    </div>
                  )}

                  <div className="pt-6 flex justify-between space-x-4 border-t border-stone-100 dark:border-slate-900">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3 rounded-lg border border-stone-200 hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-900 text-xs font-semibold px-6 uppercase tracking-wider transition cursor-pointer"
                    >
                      {t.prevStep}
                    </button>
                    <button
                      type="button"
                      onClick={handleMoveToStep3}
                      className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      <span>{t.nextStep}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Render STEP 3: Secured credit card gateway payment forms */}
          {step === 3 && (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-xs font-semibold">
              <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-slate-200 pl-1 border-l-4 border-amber-500">
                {t.paymentTitle}
              </h3>

              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
                  <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                  <div className="space-y-2">
                    <h4 className="font-sans text-sm font-semibold tracking-wide uppercase text-stone-900 dark:text-slate-100">{t.processingTitle}</h4>
                    <p className="text-serif text-stone-400 scale-95 dark:text-slate-500 max-w-sm font-light leading-relaxed">{t.processingDesc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 bg-amber-500/15 border border-amber-500/20 px-3 py-1.5 rounded uppercase">
                    {processingStatusString}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleCompletePayment} className="space-y-6">
                  {/* Payment selection types */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("credit-card")}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 font-bold focus:outline-none transition-all cursor-pointer pointer-events-auto ${
                        paymentMethod === "credit-card"
                          ? "border-stone-900 bg-stone-900 text-white dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950"
                          : "bg-white border-stone-200 hover:bg-stone-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[10px] uppercase tracking-wide">Credit / Debit Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("apple-pay")}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 font-bold focus:outline-none transition-all cursor-pointer pointer-events-auto ${
                        paymentMethod === "apple-pay"
                          ? "border-stone-900 bg-stone-900 text-white dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950"
                          : "bg-white border-stone-200 hover:bg-stone-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <Sparkles className="w-5 h-5" />
                      <span className="text-[10px] uppercase tracking-wide">Apple Pay / Token</span>
                    </button>
                  </div>

                  {paymentMethod === "credit-card" ? (
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-[10px] tracking-wider uppercase text-stone-550 dark:text-slate-400">{t.cardNum}</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" />
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            required
                            placeholder={t.cardPlaceholder}
                            className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg pl-10.5 pr-4 py-3 text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full font-semibold text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1.5">
                          <label className="text-[10px] tracking-wider uppercase text-stone-550 dark:text-slate-400">{t.cardExp}</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            required
                            placeholder="MM / YY"
                            className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-3 text-stone-955 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full font-semibold text-xs"
                          />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                          <label className="text-[10px] tracking-wider uppercase text-stone-550 dark:text-slate-400">{t.cardCvc}</label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            required
                            placeholder="123"
                            className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-lg px-4 py-3 text-stone-955 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full font-semibold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-stone-50/50 dark:bg-slate-900/10 text-center text-stone-500 font-serif font-light py-8">
                      Sign in to your device's biometric keychain profile to approve instant eShop token checkout.
                    </div>
                  )}

                  {/* Summary row */}
                  <div className="p-4 rounded-xl border border-stone-100 dark:border-slate-900 bg-stone-50/20 text-right">
                    <span className="text-stone-400 mr-2 uppercase text-[10px]">{t.total}:</span>
                    <span className="text-base font-bold text-stone-900 dark:text-amber-400 font-sans">${total}</span>
                  </div>

                  <div className="pt-6 flex justify-between space-x-4 border-t border-stone-100 dark:border-slate-900">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-3 rounded-lg border border-stone-200 hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-900 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                    >
                      {t.prevStep}
                    </button>
                    <button
                      type="submit"
                      className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{t.checkoutBtn}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Render STEP 4: Success invoice */}
          {step === 4 && finalPlacedOrder && (
            <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-in text-xs font-semibold">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-sans text-base font-bold uppercase tracking-widest text-stone-900 dark:text-slate-100">{t.successTitle}</h3>
                <p className="text-serif font-light text-stone-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">{t.successDesc}</p>
              </div>

              {/* Receipt Details Invoice printable card layout */}
              <div className="p-6 rounded-xl border border-stone-200 dark:border-slate-850 bg-stone-50/40 dark:bg-slate-900/10 text-left space-y-4">
                <div className="flex justify-between border-b border-stone-200/50 pb-2 text-[10px] font-mono text-stone-500">
                  <span>{t.printReceipt} <strong className="text-stone-900 dark:text-slate-200">{finalPlacedOrder.id}</strong></span>
                  <span>{new Date(finalPlacedOrder.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {finalPlacedOrder.items.map((i) => (
                    <div key={i.id} className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-stone-900 dark:text-stone-250">{i.product.name}</span>
                        {i.selectedSize && <span className="text-[10px] text-stone-400 dark:text-slate-500 ml-1">({i.selectedSize})</span>}
                        <span className="font-mono text-stone-400 ml-2">x{i.quantity}</span>
                      </div>
                      <span className="font-mono text-stone-800 dark:text-stone-300">${i.product.price * i.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200/50 pt-3 space-y-2 text-stone-600 dark:text-slate-400 text-xs">
                  <div className="flex justify-between">
                    <span>{t.subtotal}</span>
                    <span className="font-mono">${finalPlacedOrder.subtotal}</span>
                  </div>
                  {finalPlacedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-605">
                      <span>{t.discount}</span>
                      <span className="font-mono">-${finalPlacedOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t.tax}</span>
                    <span className="font-mono">${finalPlacedOrder.tax}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-stone-900 dark:text-slate-100 pt-1 border-t border-dashed">
                    <span>{t.total}</span>
                    <span className="font-sans text-amber-500">${finalPlacedOrder.total}</span>
                  </div>
                </div>

                <div className="border-t border-stone-150 pt-4 text-[10px] font-mono space-y-1 text-stone-400">
                  <p>{t.transacId} <span className="text-stone-800 dark:text-slate-350">{finalPlacedOrder.transactionId}</span></p>
                  <p>{t.estDeli} <span className="text-stone-800 dark:text-slate-350">{deliveryDateString()}</span></p>
                </div>
              </div>

              {/* Simulated Notification content alert preview */}
              <div className="p-4 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-left border border-blue-150/40 space-y-2">
                <h5 className="font-sans text-[10px] uppercase tracking-wider font-bold flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Interactive Automated Email Notification Preview</span>
                </h5>
                <p className="font-serif font-light text-[11px] leading-relaxed select-none">
                  "Hi {finalPlacedOrder.shippingAddress.name}, thank you for shopping curated craft with us! Your order <strong>{finalPlacedOrder.id}</strong> has been successfully authorized and has entered our climate-neutral logistics queue. Tracking details will synchronize synchronously. Support Code: {finalPlacedOrder.transactionId}."
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

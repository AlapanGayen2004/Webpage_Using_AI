import React, { useState, useEffect } from "react";
import { ShieldCheck, TrendingUp, ShoppingBag, Loader2, Sparkles, Plus, Edit, Trash, BarChart3, Receipt, Terminal, Ban, RefreshCw, Layers, Database, Link2, Unlink, ExternalLink } from "lucide-react";
import { Product, Order, SystemLog, AnalyticsSummary } from "../types";

interface AdminDashboardProps {
  currentLanguage: "en" | "es" | "fr";
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  orders: Order[];
  onRefreshOrders: () => void;
}

export default function AdminDashboard({
  currentLanguage,
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  orders,
  onRefreshOrders,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "inventory" | "orders-list" | "logs-viewer" | "google-sheets">("analytics");

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  
  // AI report states
  const [aiReport, setAiReport] = useState("");
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);

  // Edit / Add product form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOrigPrice, setFormOrigPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Electronics");
  const [formStock, setFormStock] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formFeatures, setFormFeatures] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formFeedback, setFormFeedback] = useState("");

  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Google Sheets integration state
  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isConnectingDemo, setIsConnectingDemo] = useState(false);
  const [sheetsFeedback, setSheetsFeedback] = useState("");

  const fetchSheetsStatus = async () => {
    try {
      const res = await fetch("/api/auth/google/status");
      if (res.ok) {
        const data = await res.json();
        setSheetsStatus(data);
        if (data.spreadsheetId) {
          setCustomSpreadsheetId(data.spreadsheetId);
        }
      }
    } catch (err) {
      console.error("Failed to load Google Sheets connection state", err);
    }
  };

  useEffect(() => {
    const handleAuthMessage = (e: MessageEvent) => {
      if (e.data?.type === "OAUTH_AUTH_SUCCESS") {
        fetchSheetsStatus();
        fetchLogs();
      }
    };
    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
      fetchLogs();
      fetchSheetsStatus();
    }
  }, [isOpen, products, orders]);

  const handleConnectGoogle = async () => {
    setSheetsFeedback("");
    try {
      const res = await fetch("/api/auth/google/url");
      const data = await res.json();
      
      if (data.configured && data.url) {
        const width = 550;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.url,
          "GoogleSheetsAuthPopup",
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
        );
        
        if (!popup) {
          setSheetsFeedback("Popup blocked! Access denied. Please enable popups for this site.");
        }
      } else {
        setSheetsFeedback("Google Client keys are missing in your server Secrets. Instantly connect using Sandbox Mode below!");
      }
    } catch (e: any) {
      setSheetsFeedback("OAuth authorization link request failed: " + e.message);
    }
  };

  const handleConnectDemo = async () => {
    setIsConnectingDemo(true);
    setSheetsFeedback("");
    try {
      const res = await fetch("/api/auth/google/demo-connect", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSheetsStatus(data);
        setCustomSpreadsheetId(data.spreadsheetId);
        fetchLogs();
      }
    } catch (e: any) {
      setSheetsFeedback("Failed to activate sandbox sync simulation: " + e.message);
    } finally {
      setIsConnectingDemo(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("Disconnect your Google Sheets integration? Real-time checkout sync will stop.")) return;
    setSheetsFeedback("");
    try {
      const res = await fetch("/api/auth/google/disconnect", { method: "POST" });
      if (res.ok) {
        fetchSheetsStatus();
        fetchLogs();
      }
    } catch (e: any) {
      setSheetsFeedback("Failed to unlink: " + e.message);
    }
  };

  const handleSaveSettings = async () => {
    setSheetsFeedback("");
    try {
      const res = await fetch("/api/auth/google/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: customSpreadsheetId,
          autoSync: sheetsStatus?.autoSync
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSheetsStatus(data);
        setSheetsFeedback("Google Sheets parameters updated successfully.");
        setTimeout(() => setSheetsFeedback(""), 3500);
      }
    } catch (e: any) {
      setSheetsFeedback("Failed to preserve sheet specifications: " + e.message);
    }
  };

  const handleToggleAutoSync = async () => {
    if (!sheetsStatus) return;
    const nextVal = !sheetsStatus.autoSync;
    try {
      const res = await fetch("/api/auth/google/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoSync: nextVal })
      });
      if (res.ok) {
        const data = await res.json();
        setSheetsStatus(data);
      }
    } catch (e: any) {
      setSheetsFeedback("Failed to alter automatic synchronization setting: " + e.message);
    }
  };

  const handleCreateSpreadsheet = async () => {
    setIsCreatingSheet(true);
    setSheetsFeedback("");
    try {
      const res = await fetch("/api/sheets/create", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSheetsStatus(data);
        setCustomSpreadsheetId(data.spreadsheetId);
        setSheetsFeedback(`Spreadsheet file created successfully: "${data.spreadsheetId}"`);
        fetchLogs();
      } else {
        setSheetsFeedback(data.error || "Generation of Master sheet aborted by server.");
      }
    } catch (e: any) {
      setSheetsFeedback("Creation failed: " + e.message);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleManualSyncAll = async () => {
    setIsSyncing(true);
    setSheetsFeedback("");
    try {
      const res = await fetch("/api/sheets/sync-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSheetsFeedback(`Store exported successfully! Synchronized ${products.length} products and ${orders.length} orders to corresponding Google Sheet sheets.`);
        fetchLogs();
      } else {
        setSheetsFeedback(data.error || "Batch synchronization aborted by service.");
      }
    } catch (e: any) {
      setSheetsFeedback("Batch sync execution failed: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };


  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics metrics", err);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load debug log stream", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch("/api/logs/clear", { method: "POST" });
      fetchLogs();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAiReport = async () => {
    setIsGeneratingAiReport(true);
    setAiReport("");
    try {
      const res = await fetch("/api/analytics/ai-report", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data.text);
      } else {
        setAiReport("Failed to generate AI executive briefings due to system network bottlenecks.");
      }
    } catch (err) {
      setAiReport("Failed to generate executive advisory review.");
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  // Open form for CREATE
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormOrigPrice("");
    setFormCategory("Electronics");
    setFormStock("");
    setFormImage("");
    setFormFeatures("");
    setFormTags("");
    setFormFeedback("");
    setShowProductForm(true);
  };

  // Open form for EDIT
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDesc(p.description);
    setFormPrice(p.price.toString());
    setFormOrigPrice(p.originalPrice ? p.originalPrice.toString() : "");
    setFormCategory(p.category);
    setFormStock(p.stock.toString());
    setFormImage(p.image);
    setFormFeatures(p.features.join("\n"));
    setFormTags(p.tags.join(", "));
    setFormFeedback("");
    setShowProductForm(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback("");
    setIsFormSubmitting(true);

    if (!formName || !formDesc || !formPrice || !formStock) {
      setFormFeedback("Please fill in name, description, price, and stock levels.");
      setIsFormSubmitting(false);
      return;
    }

    const payload = {
      name: formName,
      description: formDesc,
      price: Number(formPrice),
      originalPrice: formOrigPrice ? Number(formOrigPrice) : undefined,
      category: formCategory,
      stock: Number(formStock),
      image: formImage || undefined,
      features: formFeatures.split("\n").filter((f) => f.trim() !== ""),
      tags: formTags.split(",").map((t) => t.trim()).filter((t) => t !== ""),
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onRefreshProducts();
        setShowProductForm(false);
      } else {
        const errorData = await res.json();
        setFormFeedback(errorData.error || "Form submission failed.");
      }
    } catch (err) {
      setFormFeedback("Failed to update product details in our central warehouse.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be reversed.`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, itemIdx: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onRefreshOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden text-stone-800 dark:text-slate-100 font-sans border dark:border-slate-850 animate-fade-in">
        
        {/* Header bar */}
        <div className="p-5 border-b border-stone-100 dark:border-slate-900 flex items-center justify-between bg-stone-50 dark:bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded bg-stone-900 text-stone-50 dark:bg-amber-500 dark:text-slate-950">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans text-xs font-bold tracking-widest uppercase">Admin Executive Hub</h3>
              <p className="text-[10px] text-stone-400 dark:text-slate-500 font-mono">Elena Rodríguez • Owner / Boutiques Director</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4.5 py-2.5 rounded-lg border border-stone-300 hover:bg-stone-100 dark:border-slate-800 dark:hover:bg-slate-900 text-xs font-bold uppercase cursor-pointer"
          >
            Close Portal
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-stone-100/50 dark:bg-slate-950/40 border-b border-stone-100 dark:border-slate-900 overflow-x-auto scrollbar-hide text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-4 border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === "analytics"
                ? "border-amber-500 text-stone-950 dark:text-amber-400 font-bold"
                : "border-transparent text-stone-400 dark:text-slate-500 hover:text-stone-700"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Sales & BI Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-4 border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === "inventory"
                ? "border-amber-500 text-stone-950 dark:text-amber-400 font-bold"
                : "border-transparent text-stone-400 dark:text-slate-500 hover:text-stone-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Inventory tracking</span>
          </button>
          <button
            onClick={() => setActiveTab("orders-list")}
            className={`px-6 py-4 border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === "orders-list"
                ? "border-amber-500 text-stone-950 dark:text-amber-400 font-bold"
                : "border-transparent text-stone-400 dark:text-slate-500 hover:text-stone-700"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Customer Orders</span>
          </button>
          <button
            onClick={() => setActiveTab("logs-viewer")}
            className={`px-6 py-4 border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === "logs-viewer"
                ? "border-amber-500 text-stone-950 dark:text-amber-400 font-bold"
                : "border-transparent text-stone-400 dark:text-slate-500 hover:text-stone-700"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Site incident logs</span>
          </button>
          <button
            onClick={() => setActiveTab("google-sheets")}
            className={`px-6 py-4 border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === "google-sheets"
                ? "border-amber-500 text-stone-950 dark:text-amber-400 font-bold"
                : "border-transparent text-stone-400 dark:text-slate-500 hover:text-stone-700"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Google Sheets Sync</span>
          </button>
        </div>

        {/* Tab Contents Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* TAB 1: Analytical Charts Summary Dashboard */}
          {activeTab === "analytics" && (
            <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
              
              {analytics ? (
                <>
                  {/* Row 1 Metrics box */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 rounded-xl border border-stone-100 dark:border-slate-900 bg-stone-50/25">
                      <span className="text-[9px] tracking-widest font-bold uppercase text-stone-400">Total revenue</span>
                      <p className="text-xl font-bold font-sans text-stone-900 dark:text-slate-50 mt-1">${analytics.totalRevenue}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-stone-100 dark:border-slate-900 bg-stone-50/25">
                      <span className="text-[9px] tracking-widest font-bold uppercase text-stone-400">Orders completed</span>
                      <p className="text-xl font-bold font-sans text-stone-900 dark:text-slate-50 mt-1">{analytics.totalOrders}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-stone-100 dark:border-slate-900 bg-stone-50/25">
                      <span className="text-[9px] tracking-widest font-bold uppercase text-stone-400">Products sold</span>
                      <p className="text-xl font-bold font-sans text-stone-900 dark:text-slate-50 mt-1">{analytics.totalProductsSold}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-stone-100 dark:border-slate-900 bg-stone-50/25">
                      <span className="text-[9px] tracking-widest font-bold uppercase text-stone-400">AOV</span>
                      <p className="text-xl font-bold font-sans text-stone-900 dark:text-slate-50 mt-1">${analytics.averageOrderValue}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-stone-100 dark:border-slate-900 bg-stone-50/25 col-span-2 md:col-span-1">
                      <span className="text-[9px] tracking-widest font-bold uppercase text-stone-400">Stores stock status</span>
                      <div className="text-[11px] font-semibold mt-1 space-y-1 font-mono text-stone-605">
                        <p className="text-green-600 dark:text-green-400">Active: {analytics.inventoryStatus.inStock}</p>
                        <p className="text-amber-550">Low: {analytics.inventoryStatus.lowStock}</p>
                        <p className="text-red-500">Out: {analytics.inventoryStatus.outOfStock}</p>
                      </div>
                    </div>
                  </div>

                  {/* SVG Charts customized visually */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                    
                    {/* SVG Chart 1: Revenue over time */}
                    <div className="p-5 rounded-xl border border-stone-150 dark:border-slate-900 bg-white dark:bg-slate-950">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-3">Revenues dynamics (USD)</label>
                      <div className="relative h-44 w-full flex items-end">
                        {/* Render simple analytical bars or line */}
                        <div className="absolute inset-0 flex flex-col justify-between text-[9px] font-mono text-stone-300 pointer-events-none pb-4">
                          <div className="border-b w-full"></div>
                          <div className="border-b w-full"></div>
                          <div className="border-b w-full"></div>
                        </div>

                        <div className="relative z-10 w-full h-full flex items-end justify-around border-b border-stone-300 pb-1">
                          {analytics.revenueByDate.map((item, idx) => {
                            const maxRev = Math.max(...analytics.revenueByDate.map(i => i.revenue)) || 1;
                            const heightPercent = Math.max(10, Math.round((item.revenue / maxRev) * 100));
                            return (
                              <div key={idx} className="flex flex-col items-center flex-1 max-w-[2.4rem] group" title={`Revenue: $${item.revenue}`}>
                                <div
                                  style={{ height: `${heightPercent}%` }}
                                  className="w-4 bg-amber-500/80 dark:bg-amber-500 group-hover:bg-amber-400 rounded-t-sm transition-all"
                                ></div>
                                <span className="text-[8px] font-mono text-stone-400 dark:text-slate-500 mt-1 truncate max-w-full">
                                  {item.date.substring(5, 10)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* SVG Chart 2: Category sales */}
                    <div className="p-5 rounded-xl border border-stone-150 dark:border-slate-900 bg-white dark:bg-slate-950">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-3">Category sales velocity</label>
                      <div className="space-y-3 pt-2">
                        {analytics.categorySales.map((item, idx) => {
                          const maxQty = Math.max(...analytics.categorySales.map(c => c.sales)) || 1;
                          const widthPercent = Math.round((item.sales / maxQty) * 100);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span>{item.category}</span>
                                <span className="font-mono text-stone-400">{item.sales} units (${item.value})</span>
                              </div>
                              <div className="w-full bg-stone-100 dark:bg-slate-900 h-2 rounded overflow-hidden">
                                <div style={{ width: `${widthPercent}%` }} className="bg-stone-800 dark:bg-amber-550 h-full"></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Gemini powered Curator Executive assistant briefing */}
                  <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5/40 dark:bg-slate-900/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded bg-amber-500 text-slate-950">
                          <Sparkles className="w-4.5 h-4.5 animate-spin" />
                        </div>
                        <div>
                          <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-50">Curator cognitive reports</h4>
                          <p className="text-[10px] text-stone-400 font-mono">Formulate boutique pricing / stock suggestions</p>
                        </div>
                      </div>

                      <button
                        id="formulate-ai-metric-report"
                        onClick={handleAiReport}
                        disabled={isGeneratingAiReport}
                        className="flex items-center space-x-1 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wide rounded-lg transition shrink-0 cursor-pointer"
                      >
                        {isGeneratingAiReport ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            <span>Pondering catalog trends...</span>
                          </>
                        ) : (
                          <span>Formulate AI Advisor Review</span>
                        )}
                      </button>
                    </div>

                    {aiReport && (
                      <div className="p-4 rounded-xl border border-amber-500/10 bg-white/50 dark:bg-slate-950/40 font-serif font-light text-xs text-stone-700 dark:text-slate-300 leading-relaxed max-h-[14rem] overflow-y-auto whitespace-pre-line border-t shadow-xs scrollbar-hide text-[11px] animate-fade-in">
                        {aiReport}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-24 text-center">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-stone-400 font-mono uppercase tracking-widest">Compiling live ledger records...</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Complete Products CRUD form restocks */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-sm font-bold uppercase tracking-wide">Luxury Product catalog</h4>
                  <p className="text-xs text-stone-400">CRUD products catalog and change storage units metrics.</p>
                </div>
                <button
                  id="admin-add-product-btn"
                  onClick={handleOpenAddProduct}
                  className="flex items-center space-x-1.5 px-4.5 py-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wide cursor-pointer text-[11px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Curate New Product</span>
                </button>
              </div>

              {/* Advanced CRUD dialog overlay floating */}
              {showProductForm && (
                <div className="p-6 rounded-2xl border border-stone-200 dark:border-slate-850 bg-stone-50 text-xs font-semibold space-y-4 max-w-xl mx-auto shadow-md animate-fade-in">
                  <h4 className="font-sans text-xs uppercase tracking-widest font-bold text-stone-500 border-b pb-2">
                    {editingProduct ? `Modify Product Profile (ID: ${editingProduct.id})` : "Curate boutique product parameters"}
                  </h4>

                  {formFeedback && (
                    <div className="p-3.5 rounded bg-red-50 text-red-650 text-[11px] font-bold border border-red-200/50">
                      {formFeedback}
                    </div>
                  )}

                  <form onSubmit={handleProductSubmit} className="space-y-4 text-stone-700 dark:text-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] tracking-wider uppercase text-stone-400">Product Name</label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-805 rounded px-3 py-2 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] tracking-wider uppercase text-stone-400">Category</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-805 rounded px-3 py-2 focus:outline-none cursor-pointer"
                        >
                          <option value="Electronics">Electronics</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Footwear">Footwear</option>
                          <option value="Apparel">Apparel</option>
                          <option value="Home Decor">Home Decor</option>
                          <option value="Furniture">Furniture</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] tracking-wider uppercase text-stone-400">Details Description</label>
                      <textarea
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        rows={3}
                        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-805 rounded px-3 py-2 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] tracking-wider uppercase text-stone-400">Boutique Price ($)</label>
                        <input
                          type="number"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-805 rounded px-3 py-2 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] tracking-wider uppercase text-stone-400">Original Price ($)</label>
                        <input
                          type="number"
                          value={formOrigPrice}
                          onChange={(e) => setFormOrigPrice(e.target.value)}
                          placeholder="If sale item"
                          className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-805 rounded px-3 py-2 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] tracking-wider uppercase text-stone-400">Warehouse stock</label>
                        <input
                          type="number"
                          value={formStock}
                          onChange={(e) => setFormStock(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-805 rounded px-3 py-2 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] tracking-wider uppercase text-stone-400">Image url</label>
                      <input
                        type="text"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="Leave blank for luxurious standard placeholder lifestyle image"
                        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-805 rounded px-3 py-2 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] tracking-wider uppercase text-stone-400">Highlights Highlights (1 per line)</label>
                        <textarea
                          value={formFeatures}
                          onChange={(e) => setFormFeatures(e.target.value)}
                          rows={2}
                          placeholder="Handcrafted stoneware"
                          className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-805 rounded px-3 py-2 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] tracking-wider uppercase text-stone-400">Aesthetic tags (comma separated)</label>
                        <input
                          type="text"
                          value={formTags}
                          onChange={(e) => setFormTags(e.target.value)}
                          placeholder="sustainable, handcrafted"
                          className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-805 rounded px-3 py-2 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setShowProductForm(false)}
                        className="px-4 py-2 border rounded hover:bg-stone-150 cursor-pointer font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isFormSubmitting}
                        className="flex items-center space-x-1 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-amber-500 dark:text-slate-950 font-bold rounded cursor-pointer"
                      >
                        {isFormSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                        <span>Submit Archive</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lists table */}
              <div className="border border-stone-150 dark:border-slate-900 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-slate-900 text-[10px] tracking-widest font-bold uppercase text-stone-400 dark:text-slate-500 border-b border-stone-250">
                      <th className="p-4">Inspect Card</th>
                      <th className="p-4">curated Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Boutique Price</th>
                      <th className="p-4">Stock balance</th>
                      <th className="p-4 text-center">Manage Parameters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const isLow = p.stock > 0 && p.stock <= 4;
                      const isOut = p.stock === 0;

                      return (
                        <tr key={p.id} className="border-b border-stone-100 dark:border-slate-900/40 hover:bg-stone-50/40 dark:hover:bg-slate-900/15">
                          <td className="p-4">
                            <div className="w-10 h-10 rounded overflow-hidden shadow-xs bg-stone-100 dark:bg-slate-950">
                              <img referrerPolicy="no-referrer" src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="min-w-[10rem]">
                              <p className="font-bold text-stone-900 dark:text-slate-100">{p.name}</p>
                              <p className="text-[10px] text-stone-400 truncate max-w-[20rem] font-serif font-light">{p.description}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-[10px] tracking-wider uppercase text-stone-500 dark:text-slate-400">{p.category}</span>
                          </td>
                          <td className="p-4 font-mono font-bold">${p.price}</td>
                          <td className="p-4 font-mono font-medium">
                            {isOut ? (
                              <span className="text-red-500 font-bold uppercase text-[9px] bg-red-500/10 px-1.5 py-1 rounded">Out of Stock</span>
                            ) : isLow ? (
                              <span className="text-amber-550 font-bold uppercase text-[9px] bg-amber-550/10 px-1.5 py-1 rounded">Low ({p.stock})</span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 font-bold uppercase text-[9px] bg-green-500/10 px-1.5 py-1 rounded">{p.stock} Units</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center space-x-2.5">
                              <button
                                id={`edit-product-catalog-${p.id}`}
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-2 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 transition cursor-pointer"
                                title="Edit product metrics"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                id={`delete-product-catalog-${p.id}`}
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-2 rounded bg-red-50 hover:bg-red-100 text-red-550 transition cursor-pointer"
                                title="Delete product catalog"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Customer Orders list tracker */}
          {activeTab === "orders-list" && (
            <div className="space-y-6">
              
              <div>
                <h4 className="font-sans text-sm font-bold uppercase tracking-wide">Customer orders queue</h4>
                <p className="text-xs text-stone-400">Track and dispatch customer orders ledger.</p>
              </div>

              <div className="border border-stone-150 dark:border-slate-900 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-slate-900 text-[10px] tracking-widest font-bold uppercase text-stone-400 dark:text-slate-500 border-b border-stone-250">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer Info</th>
                      <th className="p-4">Receipt Items</th>
                      <th className="p-4">Final Total</th>
                      <th className="p-4">Order Date</th>
                      <th className="p-4 text-center">Status dispatch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-stone-100 dark:border-slate-900/40 hover:bg-stone-50/40 dark:hover:bg-slate-900/15">
                        <td className="p-4 font-mono font-bold text-stone-900 dark:text-slate-100">{o.id}</td>
                        <td className="p-4">
                          <div className="min-w-[8rem]">
                            <p className="font-bold">{o.userName}</p>
                            <p className="text-[10px] text-stone-400 font-mono">{o.userEmail}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1 text-[10px] text-stone-600 dark:text-slate-400 leading-snug">
                            {o.items.map((i, idx) => (
                              <p key={idx}>
                                {i.product.name} ({i.selectedSize || "Std"}) <span className="font-mono text-stone-400">x{i.quantity}</span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold">${o.total}</td>
                        <td className="p-4 text-stone-400 font-mono text-[10px]">{new Date(o.createdAt).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center">
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, 0, e.target.value)}
                              className={`text-[10px] tracking-wider uppercase font-bold p-1.5 border rounded-md cursor-pointer pointer-events-auto ${
                                o.status === "processing" 
                                  ? "bg-amber-50 border-amber-250 text-amber-600 dark:bg-amber-950/20"
                                  : o.status === "shipped"
                                    ? "bg-indigo-50 border-indigo-250 text-indigo-650 dark:bg-indigo-950/20"
                                    : o.status === "delivered"
                                      ? "bg-green-50 border-green-250 text-green-650 dark:bg-green-950/20"
                                      : "bg-stone-55 border-stone-300 text-stone-500"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing Payment</option>
                              <option value="shipped">Shipped Transit</option>
                              <option value="delivered">Delivered Success</option>
                              <option value="cancelled">Cancelled Lock</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Real-Time diagnostic console logs */}
          {activeTab === "logs-viewer" && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-sm font-bold uppercase tracking-wide">Real-time site incident diagnostics</h4>
                  <p className="text-xs text-stone-400">Real-time HTTP auditing tracking profiles and security integrity counters.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    id="manually-refresh-diagnostics"
                    onClick={fetchLogs}
                    disabled={isLoadingLogs}
                    className="p-2.5 rounded border border-stone-300 hover:bg-stone-100 text-stone-700 dark:border-slate-800 dark:text-slate-350 cursor-pointer"
                    title="Refresh logs trail"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    id="admin-clear-audit-logs"
                    onClick={handleClearLogs}
                    className="flex items-center space-x-1 px-4.5 py-2.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-550 cursor-pointer font-bold uppercase text-[10px]"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Clear logs trail</span>
                  </button>
                </div>
              </div>

              {/* Console logs container */}
              <div className="p-4 rounded-xl border border-stone-900 bg-stone-900 text-stone-100 font-mono text-[10px] leading-relaxed max-h-[22rem] overflow-y-auto space-y-2">
                {isLoadingLogs && logs.length === 0 ? (
                  <p className="text-stone-400 animate-pulse">Analyzing diagnostic kernel logs...</p>
                ) : logs.length === 0 ? (
                  <p className="text-stone-500">Log terminal blank.</p>
                ) : (
                  logs.map((l) => (
                    <div key={l.id} className="flex flex-col sm:flex-row sm:space-x-3.5 border-b border-stone-800/80 pb-2">
                      <span className="text-stone-400 shrink-0">{new Date(l.timestamp).toLocaleString()}</span>
                      
                      {/* Log level color blocks */}
                      <span className={`font-bold shrink-0 uppercase tracking-widest ${
                        l.level === "error" 
                          ? "text-red-400" 
                          : l.level === "warn"
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}>
                        [{l.level}]
                      </span>

                      <span className="flex-1 text-slate-100">{l.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Google Sheets Sync Center */}
          {activeTab === "google-sheets" && (
            <div className="space-y-6 max-w-4xl mx-auto p-1 animate-fade-in text-stone-800 dark:text-stone-100">
              <div className="border-b border-stone-150 pb-4 dark:border-slate-800/80">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl dark:bg-green-950/40 dark:text-green-400">
                    <Database className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h4 className="font-sans text-base font-bold uppercase tracking-wide text-stone-900 dark:text-stone-50">
                      Google Sheets Integration Center
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      Directly export, sync, and append your catalog items and sales orders into your master Google Spreadsheet Database in real-time.
                    </p>
                  </div>
                </div>
              </div>

              {sheetsFeedback && (
                <div className="p-4.5 rounded-xl text-xs font-semibold border bg-amber-50/70 border-amber-200 text-amber-800 dark:bg-amber-955/20 dark:border-amber-900/60 dark:text-amber-300">
                  {sheetsFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Connection Status Section */}
                <div className="col-span-1 md:col-span-12 lg:col-span-5 space-y-6">
                  <div className="p-5.5 rounded-2xl border border-stone-100 bg-stone-50/40 dark:border-slate-900 dark:bg-slate-950/40 space-y-4">
                    <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                      Integration Profile
                    </h5>

                    {sheetsStatus?.isLinked ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">
                            Linked & Active
                          </span>
                        </div>

                        <div className="space-y-2 text-stone-800 dark:text-stone-200">
                          <div>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500 uppercase font-bold tracking-wider">Authorized Account</span>
                            <div className="text-xs font-semibold truncate mt-0.5">{sheetsStatus.email}</div>
                          </div>
                          <div className="pt-2">
                            <span className="text-[10px] text-stone-400 dark:text-slate-500 uppercase font-bold tracking-wider">Storage Sync Mode</span>
                            <div className="flex items-center mt-1">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                                sheetsStatus.mode === 'demo' 
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-400' 
                                  : 'bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-400'
                              }`}>
                                {sheetsStatus.mode === 'demo' ? 'Sandbox Simulation' : 'Live Production Sync'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleDisconnectGoogle}
                          className="w-full flex items-center justify-center space-x-2 py-2.5 border border-red-200 text-red-500 hover:text-red-600 rounded-xl hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-900 text-xs font-bold uppercase cursor-pointer transition-colors"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>Disconnect Account</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-stone-300 dark:bg-slate-800"></span>
                          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                            Not Connected
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-stone-500 dark:text-slate-400">
                          Authorize eShop boutique workbook permissions to write to spreadsheets in real-time.
                        </p>

                        <div className="space-y-2.5">
                          {sheetsStatus?.hasServerOAuthKeys ? (
                            <button
                              onClick={handleConnectGoogle}
                              className="w-full bg-green-600 text-stone-50 rounded-xl py-3 text-xs font-bold hover:bg-green-700 uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-sm"
                            >
                              <Link2 className="w-4 h-4 animate-bounce" />
                              <span>Authorize Google Sheets</span>
                            </button>
                          ) : (
                            <div className="p-3 bg-amber-50/60 border border-amber-250/70 rounded-xl dark:bg-amber-955/20 dark:border-amber-900/45 text-[11px] text-amber-800 dark:text-amber-400 leading-normal">
                              <p className="font-bold">⚠️ Production Credentials Pending Setup</p>
                              <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-1">
                                Google Client Key environment variables are empty. Build testing sync actions using our simulation link.
                              </p>
                            </div>
                          )}

                          <button
                            onClick={handleConnectDemo}
                            disabled={isConnectingDemo}
                            className="w-full bg-stone-900 text-stone-50 rounded-xl py-3 text-xs font-bold hover:bg-stone-800 uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-colors border border-stone-850 dark:bg-slate-900 dark:border-slate-800"
                          >
                            {isConnectingDemo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
                            <span>Link Sandbox Sync Simulator</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations Section */}
                <div className="col-span-1 md:col-span-12 lg:col-span-7 space-y-6">
                  {sheetsStatus?.isLinked ? (
                    <div className="p-5.5 rounded-2xl border border-stone-100 bg-white dark:border-slate-900 dark:bg-slate-950 space-y-5">
                      <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                        Spreadsheet Specifications
                      </h5>

                      {/* Connection ID Input */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
                            Target Google Spreadsheet ID
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={customSpreadsheetId}
                              onChange={(e) => setCustomSpreadsheetId(e.target.value)}
                              placeholder="e.g. 1eShop_Boutique_Mock_Sheet_ID_Demo_3829104"
                              className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:outline-none focus:border-green-500 font-mono text-stone-700 dark:text-slate-300"
                            />
                            <button
                              onClick={handleSaveSettings}
                              className="px-4.5 py-2.5 bg-stone-900 hover:bg-stone-850 dark:bg-slate-900 dark:hover:bg-slate-800 border dark:border-slate-800 text-indigo-50 dark:text-slate-100 rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>

                        {sheetsStatus.spreadsheetUrl && (
                          <a
                            href={sheetsStatus.spreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 text-xs text-green-600 hover:text-green-700 font-bold dark:text-green-400 tracking-wide"
                          >
                            <span>Open Google Sheet database file</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Toggle Auto sync */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50/50 dark:bg-slate-900/60 border border-stone-100 dark:border-slate-850">
                        <div className="pr-4">
                          <div className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                            Auto Checkout Synchronizer
                          </div>
                          <p className="text-[10px] text-stone-400 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Every time a purchase successfully executes at checkout, map order items and billing details to Sheets database.
                          </p>
                        </div>
                        <button
                          onClick={handleToggleAutoSync}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            sheetsStatus.autoSync ? "bg-green-600" : "bg-stone-200 dark:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              sheetsStatus.autoSync ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Commands Bento grid buttons */}
                      <div className="pt-2 space-y-3">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-slate-500">
                          Data Sync Commands
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          
                          <button
                            onClick={handleCreateSpreadsheet}
                            disabled={isCreatingSheet}
                            className="flex flex-col items-start p-4 text-left rounded-xl border border-stone-150 hover:bg-stone-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50 cursor-pointer transition-all duration-150"
                          >
                            <Plus className="w-4 h-4 text-green-600 mr-2 shrink-0 mb-2 dark:text-green-400" />
                            <span className="text-xs font-bold uppercase tracking-wide text-stone-800 dark:text-slate-100">
                              {isCreatingSheet ? "Structuring..." : "Create Spreadsheet"}
                            </span>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500 mt-1 leading-normal">
                              Generate a formatted sheet with automatic Orders & Product catalog sheets and headers.
                            </span>
                          </button>

                          <button
                            onClick={handleManualSyncAll}
                            disabled={isSyncing}
                            className="flex flex-col items-start p-4 text-left rounded-xl border border-stone-150 hover:bg-stone-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50 cursor-pointer transition-all duration-150"
                          >
                            <RefreshCw className={`w-4 h-4 text-green-600 mr-2 shrink-0 mb-2 dark:text-green-400 ${isSyncing ? "animate-spin" : ""}`} />
                            <span className="text-xs font-bold uppercase tracking-wide text-stone-800 dark:text-slate-100">
                              {isSyncing ? "Exporting..." : "Sync Store Catalog"}
                            </span>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500 mt-1 leading-normal">
                              Conduct a full batch export. Writes {products.length} catalog items and {orders.length} transaction invoices.
                            </span>
                          </button>

                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-stone-100 dark:border-slate-900 bg-stone-50/10 flex flex-col items-center justify-center text-center space-y-4 min-h-[18rem]">
                      <Database className="w-10 h-10 text-stone-300 dark:text-slate-700 animate-pulse" />
                      <div className="max-w-xs space-y-1">
                        <h6 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">
                          Configure Sheet Source
                        </h6>
                        <p className="text-[11px] text-stone-400 dark:text-slate-500 leading-normal">
                          Authorize eShop boutique workbook permissions to write to spreadsheets in real-time.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
              
              {/* Manual setup instruction documentation */}
              <div className="p-5.5 rounded-2xl border border-stone-100 bg-stone-50/40 dark:border-slate-900 dark:bg-slate-950/40 space-y-3.5">
                <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
                  Client Setup Instructions (Google Cloud Developer Keys)
                </h5>
                <ol className="list-decimal list-inside text-xs text-stone-500 dark:text-slate-400 space-y-2.5 leading-relaxed">
                  <li>
                    Go to the <strong>Google Cloud Console</strong> and authorize standard Google Sheets API.
                  </li>
                  <li>
                    Enable the <strong>Google Sheets API</strong> and the <strong>Google Drive API</strong>.
                  </li>
                  <li>
                    Under <strong>APIs & Services &gt; OAuth consent screen</strong>, configure a target Web application.
                  </li>
                  <li>
                    Add scope <code className="px-1.5 py-0.5 bg-stone-150 dark:bg-slate-900 rounded font-mono text-[10px]/normal text-stone-600 dark:text-slate-400">https://www.googleapis.com/auth/spreadsheets</code>.
                  </li>
                  <li>
                    Create an <strong>OAuth 2.0 Client ID</strong>, select <strong>Web application</strong>, and set the Redirect URI exactly as:
                    <code className="block px-2.5 py-1.5 bg-stone-150 border border-stone-200 dark:border-slate-850 rounded font-mono text-[10.5px] mt-1 text-stone-700 dark:bg-slate-900 dark:text-slate-300 break-all select-all">
                      {window.location.origin}/api/auth/google/callback
                    </code>
                  </li>
                  <li>
                    Copy <strong>Client ID</strong> and <strong>Client Secret</strong> into Secret variables named:
                    <strong className="text-stone-800 dark:text-stone-300 font-bold"> GOOGLE_CLIENT_ID </strong> and <strong className="text-stone-800 dark:text-stone-300 font-bold"> GOOGLE_CLIENT_SECRET </strong>.
                  </li>
                </ol>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

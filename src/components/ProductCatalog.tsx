import React, { useState } from "react";
import { Search, Star, ShoppingCart, SlidersHorizontal, Package, Tag, ArrowUpDown, RefreshCw, X, Sparkles } from "lucide-react";
import { Product } from "../types";

interface ProductCatalogProps {
  currentLanguage: "en" | "es" | "fr";
  products: Product[];
  isLoadingProducts: boolean;
  onAddToCart: (p: Product, qty: number, size?: string, color?: string) => void;
  onOpenProductDetail: (p: Product) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  highContrast: boolean;
}

const translations = {
  en: {
    searchPlaceholder: "Search curated items, categories, tags...",
    allCategories: "All Collections",
    priceRange: "Price Range",
    allPrices: "All Prices",
    under100: "Under $100",
    between100_300: "$100 - $300",
    above300: "Over $300",
    sortBy: "Sort By",
    sortFeatured: "Featured Selection",
    sortLowHigh: "Price: Low to High",
    sortHighLow: "Price: High to Low",
    sortRating: "Customer Rating",
    stockStatus: "Inventory availability",
    excludeOutOfStock: "Hide Out of Stock Items",
    ratingFilter: "Aesthetic Rating",
    allRatings: "Any Rating",
    highAndAbove: "4.5+ Stars Only",
    buyNow: "Select Options",
    lowStock: "Few remaining",
    outOfStock: "Sold Out",
    matchingResults: "curated products matching filters",
    noResults: "No Curated Products Found Matching Your Criteria.",
    features: "Artisan Highlights",
    tags: "Aesthetic tags",
  },
  es: {
    searchPlaceholder: "Buscar productos, colecciones, etiquetas...",
    allCategories: "Todas las Colecciones",
    priceRange: "Rango de Precios",
    allPrices: "Todos los Precios",
    under100: "Menos de $100",
    between100_300: "$100 - $300",
    above300: "Más de $300",
    sortBy: "Ordenar Por",
    sortFeatured: "Selección Destacada",
    sortLowHigh: "Precio: Menor a Mayor",
    sortHighLow: "Precio: Mayor a Menor",
    sortRating: "Calificación de Clientes",
    stockStatus: "Disponibilidad de Inventario",
    excludeOutOfStock: "Ocultar Agotados",
    ratingFilter: "Calificación Estética",
    allRatings: "Cualquier Calificación",
    highAndAbove: "Solo de 4.5+ Estrellas",
    buyNow: "Ver Opciones",
    lowStock: "Pocas unidades",
    outOfStock: "Agotado",
    matchingResults: "productos curados coinciden",
    noResults: "No se encontraron productos que coincidan con sus criterios.",
    features: "Aspectos de Artesanía",
    tags: "Etiquetas estéticas",
  },
  fr: {
    searchPlaceholder: "Rechercher des produits, collections, tags...",
    allCategories: "Toutes les Collections",
    priceRange: "Fourchette de Prix",
    allPrices: "Tous les Tarifs",
    under100: "Moins de 100 $",
    between100_300: "100 $ - 300 $",
    above300: "Plus de 300 $",
    sortBy: "Trier Par",
    sortFeatured: "Sélection Coup de Coeur",
    sortLowHigh: "Prix : du - au + cher",
    sortHighLow: "Prix : du + au - cher",
    sortRating: "Avis des Clients",
    stockStatus: "Disponibilité des stocks",
    excludeOutOfStock: "Masquer les produits épuisés",
    ratingFilter: "Note Esthétique",
    allRatings: "Toutes les Notes",
    highAndAbove: "Note 4.5+ uniquement",
    buyNow: "Sélectionner Options",
    lowStock: "Presque épuisé",
    outOfStock: "Rupture de Stock",
    matchingResults: "produits correspondent",
    noResults: "Aucun produit correspondant à vos paramètres n'a été trouvé.",
    features: "Détails de Conception",
    tags: "Catégories de style",
  }
};

export default function ProductCatalog({
  currentLanguage,
  products,
  isLoadingProducts,
  onAddToCart,
  onOpenProductDetail,
  selectedCategory,
  setSelectedCategory,
  highContrast
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "under100" | "100-300" | "above300">("all");
  const [ratingFilter, setRatingFilter] = useState<"all" | "high">("all");
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [sortBy, setSortBy] = useState<"featured" | "low-high" | "high-low" | "rating">("featured");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const t = translations[currentLanguage];

  // Extraction of unique Categories dynamic
  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtering Logic
  const filteredProducts = products.filter((p) => {
    // Category match
    if (selectedCategory !== "all" && p.category !== selectedCategory) {
      return false;
    }
    
    // Search match (name, desc, tags, category, features)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = p.name.toLowerCase().includes(q);
      const inDesc = p.description.toLowerCase().includes(q);
      const inCategory = p.category.toLowerCase().includes(q);
      const inTags = p.tags.some((tag) => tag.toLowerCase().includes(q));
      const inFeatures = p.features.some((f) => f.toLowerCase().includes(q));
      if (!inName && !inDesc && !inCategory && !inTags && !inFeatures) {
        return false;
      }
    }

    // Price filters
    if (priceFilter === "under100" && p.price >= 100) return false;
    if (priceFilter === "100-300" && (p.price < 100 || p.price > 300)) return false;
    if (priceFilter === "above300" && p.price <= 300) return false;

    // Rating filter
    if (ratingFilter === "high" && p.rating < 4.5) return false;

    // Stock availability filter
    if (hideOutOfStock && p.stock <= 0) return false;

    return true;
  });

  // Sorting Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "low-high") return a.price - b.price;
    if (sortBy === "high-low") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; // Default Featured remains original order
  });

  // Total results info line
  const resultString = `${sortedProducts.length} ${t.matchingResults}`;

  const resetFilters = () => {
    setSearchQuery("");
    setPriceFilter("all");
    setRatingFilter("all");
    setHideOutOfStock(false);
    setSortBy("featured");
    setSelectedCategory("all");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans md:py-16">
      
      {/* Top Search bar, Category list tabs, Filters toggle */}
      <div className="flex flex-col space-y-6 md:space-y-8">
        
        {/* Row 1: Search Form + Sort option */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full text-xs pl-10.5 pr-4 py-3.5 rounded-lg border focus:outline-none dark:text-slate-200 transition-all ${
                highContrast 
                  ? "bg-white text-black border-black focus:border-black" 
                  : "bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 focus:border-stone-400 dark:focus:border-amber-400"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-slate-500 hover:dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3.5">
            <button
              id="advanced-filters-accordion-btn"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center space-x-2 px-4 py-3.5 border rounded-lg text-xs tracking-wider uppercase font-medium transition cursor-pointer select-none ${
                showAdvancedFilters
                  ? "bg-stone-900 border-stone-900 text-stone-50 dark:bg-amber-500 dark:border-amber-500 dark:text-slate-950"
                  : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <div className="relative flex items-center border border-stone-200 dark:border-slate-800 rounded-lg px-3.5 bg-white dark:bg-slate-900">
              <ArrowUpDown className="w-4 h-4 text-stone-400 dark:text-slate-500 mr-2" />
              <select
                id="catalog-sort-select"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-xs py-3.5 pr-6 focus:outline-none dark:text-slate-200 font-medium tracking-wide uppercase cursor-pointer"
              >
                <option value="featured" className="dark:bg-slate-950">{t.sortFeatured}</option>
                <option value="low-high" className="dark:bg-slate-950">{t.sortLowHigh}</option>
                <option value="high-low" className="dark:bg-slate-950">{t.sortHighLow}</option>
                <option value="rating" className="dark:bg-slate-950">{t.sortRating}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Tab sliders */}
        <div className="flex overflow-x-auto pb-1.5 scrollbar-hide space-x-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[10px] tracking-widest uppercase font-bold px-5.5 py-3 rounded-full transition-all border shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? highContrast
                    ? "bg-black text-white border-black"
                    : "bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-400"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-800 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-600 dark:hover:text-slate-200"
              }`}
            >
              {cat === "all" ? t.allCategories : cat}
            </button>
          ))}
        </div>

        {/* Detailed Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-6 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/20 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-stone-700 dark:text-slate-200">
            {/* Column 1: Prices */}
            <div>
              <h5 className="font-sans text-[10px] uppercase tracking-widest font-bold text-stone-400 dark:text-slate-500 mb-3">{t.priceRange}</h5>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: "all", label: t.allPrices },
                  { key: "under100", label: t.under100 },
                  { key: "100-300", label: t.between100_300 },
                  { key: "above300", label: t.above300 },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPriceFilter(opt.key)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition ${
                      priceFilter === opt.key
                        ? "bg-stone-900 border-stone-900 text-white dark:bg-amber-500 dark:border-amber-400 dark:text-slate-950"
                        : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Rating */}
            <div>
              <h5 className="font-sans text-[10px] uppercase tracking-widest font-bold text-stone-400 dark:text-slate-500 mb-3">{t.ratingFilter}</h5>
              <div className="flex flex-wrap gap-2 flex-col">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold">
                  <input
                    type="radio"
                    name="rating-filt"
                    checked={ratingFilter === "all"}
                    onChange={() => setRatingFilter("all")}
                    className="accent-stone-900 dark:accent-amber-500"
                  />
                  <span>{t.allRatings}</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold mt-1">
                  <input
                    type="radio"
                    name="rating-filt"
                    checked={ratingFilter === "high"}
                    onChange={() => setRatingFilter("high")}
                    className="accent-stone-900 dark:accent-amber-500"
                  />
                  <span className="flex items-center space-x-1">
                    <span>{t.highAndAbove}</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </span>
                </label>
              </div>
            </div>

            {/* Column 3: Out of stock & Clear */}
            <div className="flex flex-col justify-between">
              <div>
                <h5 className="font-sans text-[10px] uppercase tracking-widest font-bold text-stone-400 dark:text-slate-500 mb-3">{t.stockStatus}</h5>
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={hideOutOfStock}
                    onChange={(e) => setHideOutOfStock(e.target.checked)}
                    className="accent-stone-900 dark:accent-amber-500 rounded border-stone-300"
                  />
                  <span>{t.excludeOutOfStock}</span>
                </label>
              </div>

              <div className="pt-4 flex items-center space-x-2">
                <button
                  onClick={resetFilters}
                  className="flex items-center space-x-1.5 text-xs text-red-500 hover:text-red-600 font-semibold uppercase tracking-wider underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count bar */}
        <div className="flex justify-between items-center text-xs text-stone-500 dark:text-slate-400 font-medium">
          <span>{resultString}</span>
        </div>
      </div>

      {/* Grid of Products catalog */}
      {isLoadingProducts ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-stone-500 dark:text-slate-400 font-mono tracking-widest uppercase">Fetching curated catalog...</p>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-stone-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <SlidersHorizontal className="w-10 h-10 text-stone-300" />
          <p className="text-serif text-stone-600 dark:text-slate-300">{t.noResults}</p>
          <button
            onClick={resetFilters}
            className="px-5.5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-wider uppercase cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 mt-8">
          {sortedProducts.map((p) => {
            const isLowStock = p.stock > 0 && p.stock <= 4;
            const isOutOfStock = p.stock === 0;

            return (
              <div
                key={p.id}
                onClick={() => onOpenProductDetail(p)}
                className="group flex flex-col cursor-pointer transition-transform duration-300 relative overflow-hidden rounded-xl border border-stone-200/60 hover:border-stone-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-1 text-stone-800 dark:text-slate-100"
              >
                {/* Sale / Stock labels */}
                <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1.5 h-auto">
                  {p.originalPrice && p.originalPrice > p.price && (
                    <span className="text-[9px] tracking-widest font-sans font-bold bg-amber-400 text-stone-950 px-2.5 py-1 rounded">
                      SALE
                    </span>
                  )}
                  {isLowStock && (
                    <span className="text-[9px] tracking-widest font-sans font-bold bg-amber-550 text-white dark:bg-amber-600 px-2.5 py-1 rounded">
                      {t.lowStock}
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="text-[9px] tracking-widest font-sans font-bold bg-stone-800 text-stone-300 px-2.5 py-1 rounded">
                      {t.outOfStock}
                    </span>
                  )}
                </div>

                {/* Product Image Wrapper */}
                <div className="w-full aspect-square bg-stone-100 dark:bg-slate-950 overflow-hidden relative border-b border-stone-100 dark:border-slate-800/60">
                  <img
                    referrerPolicy="no-referrer"
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                  />
                  {/* Subtle hover prompt overlay */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 dark:bg-slate-900/95 text-[10px] font-sans font-bold tracking-widest text-stone-900 dark:text-slate-100 px-4 py-2.5 rounded shadow-md uppercase">
                      Inspect Craft
                    </span>
                  </div>
                </div>

                {/* Product Details info container */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    {/* Category */}
                    <p className="text-[9px] font-mono tracking-widest text-stone-400 dark:text-slate-500 uppercase">{p.category}</p>
                    
                    {/* Title */}
                    <h4 className="font-sans text-sm font-semibold tracking-tight leading-snug text-stone-900 dark:text-stone-100">
                      {p.name}
                    </h4>

                    {/* Customer ratings */}
                    <div className="flex items-center space-x-1 text-xs text-stone-500 dark:text-slate-400">
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <span className="font-bold text-stone-800 dark:text-slate-200">{p.rating}</span>
                      <span className="font-mono text-[10px]">({p.reviewCount})</span>
                    </div>
                  </div>

                  {/* Pricing row */}
                  <div className="pt-4 flex items-baseline justify-between">
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-sm font-bold font-sans text-stone-900 dark:text-slate-100">${p.price}</span>
                      {p.originalPrice && (
                        <span className="text-xs line-through text-stone-400 font-mono">${p.originalPrice}</span>
                      )}
                    </div>

                    <button
                      id={`inspect-product-${p.id}`}
                      className={`text-[9px] font-sans font-bold uppercase tracking-wider border rounded-md px-3 py-1.5 cursor-pointer transition-all ${
                        isOutOfStock
                          ? "border-stone-200 text-stone-400 dark:border-slate-800 dark:text-slate-500 cursor-not-allowed"
                          : "border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-400 dark:hover:text-slate-950"
                      }`}
                      disabled={isOutOfStock}
                    >
                      {t.buyNow}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

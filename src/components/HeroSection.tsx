import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Truck, RefreshCw } from "lucide-react";

interface HeroSectionProps {
  currentLanguage: "en" | "es" | "fr";
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}

const slides = {
  en: [
    {
      title: "ACOUSTIC PERFECTION",
      subtitle: "Uncompromised Hybrid ANC Sound",
      desc: "Immerse yourself into pure memory foam comfort and rich auditory dynamics curated with professional engineering.",
      action: "Discover Audio",
      category: "Electronics",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJTD2C1GEuOviw2urlwWaO6lUentST0vcDxbJ5scvNIhEhn4RckqdlqVmZG4moa554R-ClqjPRORzeYTmgtx1reDQ-sG1VFeIYUiNC28wILnJQPLQ5TCrD2kxJLOHS9qT1nph-oiUICa1XkhWiRSlVljMTUEspjNXLZAKUNbdP_1ayEfV1QQXMbORTYF45YkK11oEWmnwVkBFx6yiuI9CMoPd0tcOeJw16HGhFRgoPXo1Blv6agS-pIIQD9gsvfAQ8cTa0bEl6svXM",
    },
    {
      title: "CHRONOGRAPH SERIES",
      subtitle: "Surgical Steel mechanical precision",
      desc: "A striking modern geometry meeting traditional Swiss-inspired dials and premium Italian cognac leather straps.",
      action: "Explore Details",
      category: "Accessories",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwrBSearWliR0q8dKEkZ47EXruEoXqdw5BqjHUL_h8NaVIb2TUHw4afQnvui1Px30Nsv3J9n9ScBkCbAaBI6G8PtL3n9n_Q6mg18Va8EU1NJmPvzp-Tgb6nd9wWTKXODfIbvNHsYpt--w7uKgKqByAnRd_x6NFg_0ez_2TserWGtw23J3xwcw6Kssh4Pb1P24BzHBg3IxqqzRItdcHts7WYya3M-_WW6hhe99zeC7H69K3NP95JKbGCEnkFfvC3FjxP9OlmYG0cH6f"
    },
    {
      title: "AERO-LITE PRIME",
      subtitle: "Daily Athletic Cushion Agility",
      desc: "Spun from 100% recycled knit sock fibers with custom rebound foam metrics for effortless morning strides.",
      action: "Explore Footwear",
      category: "Footwear",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3LRx8KhdgkuRLnbfPQMdTuWq-Rgaiz84L82totBfmGAkGqr4jB6KAwuAgDjNjbBA0HjPBoWttu-aWnukwaEmvseFGNEqcZDbxsLWIWp0KB4wN7amQj8uTY4QSX25sETvCG1RT7a9hVMhSQwXgrt3im83Uj0cr-_GqtqqKCfUqfOg8d75zmpTyj0PsIFwpZ6kby5Ky3Mpt3UUzrK2pgDpnl9r4fXB5bBc2aITS3SPRhi-7vnpn6bdNpqLax1gOMUWgXx68VUDiGNpD",
    }
  ],
  es: [
    {
      title: "PERFECCIÓN ACÚSTICA",
      subtitle: "Sonido Inolvidable con ANC Híbrido",
      desc: "Sumérgete en el confort de espumas con memoria y dinámicas de audio nítidas calibradas para audiófilos exigentes.",
      action: "Descubrir Audio",
      category: "Electronics",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJTD2C1GEuOviw2urlwWaO6lUentST0vcDxbJ5scvNIhEhn4RckqdlqVmZG4moa554R-ClqjPRORzeYTmgtx1reDQ-sG1VFeIYUiNC28wILnJQPLQ5TCrD2kxJLOHS9qT1nph-oiUICa1XkhWiRSlVljMTUEspjNXLZAKUNbdP_1ayEfV1QQXMbORTYF45YkK11oEWmnwVkBFx6yiuI9CMoPd0tcOeJw16HGhFRgoPXo1Blv6agS-pIIQD9gsvfAQ8cTa0bEl6svXM"
    },
    {
      title: "SERIE CRONÓGRAFO",
      subtitle: "Precisión Mecánica de Acero Quirúrgico",
      desc: "Un diseño geométrico impactante casado con correas tradicionales de cuero italiano de curtido vegetal.",
      action: "Ver Detalles",
      category: "Accessories",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwrBSearWliR0q8dKEkZ47EXruEoXqdw5BqjHUL_h8NaVIb2TUHw4afQnvui1Px30Nsv3J9n9ScBkCbAaBI6G8PtL3n9n_Q6mg18Va8EU1NJmPvzp-Tgb6nd9wWTKXODfIbvNHsYpt--w7uKgKqByAnRd_x6NFg_0ez_2TserWGtw23J3xwcw6Kssh4Pb1P24BzHBg3IxqqzRItdcHts7WYya3M-_WW6hhe99zeC7H69K3NP95JKbGCEnkFfvC3FjxP9OlmYG0cH6f"
    },
    {
      title: "AERO-LITE PRIME",
      subtitle: "Amortiguación reactiva para el día a día",
      desc: "Tejido con hilo de calcetín 100% reciclado y espumas de polímetro liviano para zancadas dinámicas.",
      action: "Ver Calzado",
      category: "Footwear",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3LRx8KhdgkuRLnbfPQMdTuWq-Rgaiz84L82totBfmGAkGqr4jB6KAwuAgDjNjbBA0HjPBoWttu-aWnukwaEmvseFGNEqcZDbxsLWIWp0KB4wN7amQj8uTY4QSX25sETvCG1RT7a9hVMhSQwXgrt3im83Uj0cr-_GqtqqKCfUqfOg8d75zmpTyj0PsIFwpZ6kby5Ky3Mpt3UUzrK2pgDpnl9r4fXB5bBc2aITS3SPRhi-7vnpn6bdNpqLax1gOMUWgXx68VUDiGNpD",
    }
  ],
  fr: [
    {
      title: "PERFECTION ACOUSTIQUE",
      subtitle: "Son ANC Hybride Sans Compromis",
      desc: "Évadez-vous avec un confort de mousses à mémoire de forme et une clarté sonore digne des plus grands studios.",
      action: "Découvrir Son",
      category: "Electronics",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJTD2C1GEuOviw2urlwWaO6lUentST0vcDxbJ5scvNIhEhn4RckqdlqVmZG4moa554R-ClqjPRORzeYTmgtx1reDQ-sG1VFeIYUiNC28wILnJQPLQ5TCrD2kxJLOHS9qT1nph-oiUICa1XkhWiRSlVljMTUEspjNXLZAKUNbdP_1ayEfV1QQXMbORTYF45YkK11oEWmnwVkBFx6yiuI9CMoPd0tcOeJw16HGhFRgoPXo1Blv6agS-pIIQD9gsvfAQ8cTa0bEl6svXM"
    },
    {
      title: "SÉRIE CHRONOGRAPHE",
      subtitle: "Précision Mécanique en Acier Chirurgical",
      desc: "L'élégance de courbes modernes couplée à un bracelet artisanal en cuir italien de premier choix.",
      action: "Explorer Collections",
      category: "Accessories",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwrBSearWliR0q8dKEkZ47EXruEoXqdw5BqjHUL_h8NaVIb2TUHw4afQnvui1Px30Nsv3J9n9ScBkCbAaBI6G8PtL3n9n_Q6mg18Va8EU1NJmPvzp-Tgb6nd9wWTKXODfIbvNHsYpt--w7uKgKqByAnRd_x6NFg_0ez_2TserWGtw23J3xwcw6Kssh4Pb1P24BzHBg3IxqqzRItdcHts7WYya3M-_WW6hhe99zeC7H69K3NP95JKbGCEnkFfvC3FjxP9OlmYG0cH6f"
    },
    {
      title: "AERO-LITE PRIME",
      subtitle: "Amorti Haute Performance Quotidien",
      desc: "Tissé avec des mailles légères 100% recyclées pour des transitions d'une fluidité absolue à chaque foulée.",
      action: "Visiter Chaussures",
      category: "Footwear",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3LRx8KhdgkuRLnbfPQMdTuWq-Rgaiz84L82totBfmGAkGqr4jB6KAwuAgDjNjbBA0HjPBoWttu-aWnukwaEmvseFGNEqcZDbxsLWIWp0KB4wN7amQj8uTY4QSX25sETvCG1RT7a9hVMhSQwXgrt3im83Uj0cr-_GqtqqKCfUqfOg8d75zmpTyj0PsIFwpZ6kby5Ky3Mpt3UUzrK2pgDpnl9r4fXB5bBc2aITS3SPRhi-7vnpn6bdNpqLax1gOMUWgXx68VUDiGNpD",
    }
  ]
};

const valueProps = {
  en: [
    { icon: Truck, title: "Carbon-Neutral Delivery", desc: "complimentary global shipping is carbon-offset" },
    { icon: ShieldCheck, title: "Two-Year Curated Warranty", desc: "full luxury alignment protection guarantee" },
    { icon: RefreshCw, title: "30-Day Aesthetic Returns", desc: "hassle-free prepaid return packaging included" }
  ],
  es: [
    { icon: Truck, title: "Envío Carbono Neutral", desc: "entrega gratuita internacional compensada al 100%" },
    { icon: ShieldCheck, title: "Garantía Extendida de 2 Años", desc: "cobertura completa de excelencia en curaduría" },
    { icon: RefreshCw, title: "30 Días de Devolución Estética", desc: "empaques pre-pagados incluidos sin preguntas" }
  ],
  fr: [
    { icon: Truck, title: "Livraison Neutre en Carbone", desc: "expédition internationale offerte et éco-responsable" },
    { icon: ShieldCheck, title: "Garantie Artisanale de 2 Ans", desc: "protection totale de nos finitions haut de gamme" },
    { icon: RefreshCw, title: "Retours Sous 30 Jours", desc: "bordereau de transport pré-payé pour votre confort" }
  ]
};

export default function HeroSection({ currentLanguage, onSelectCategory, selectedCategory }: HeroSectionProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const items = slides[currentLanguage];
  const props = valueProps[currentLanguage];

  // Auto-rotating slider effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, 8500);
    return () => clearInterval(interval);
  }, [items.length]);

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const current = items[activeSlide];

  return (
    <div className="w-full">
      {/* Immersive Slideshow Container */}
      <div id="hero-slider" className="relative w-full h-[36rem] md:h-[28rem] overflow-hidden bg-stone-900 text-stone-100 flex items-center">
        {/* Carousel Slide background */}
        <div className="absolute inset-0 z-0">
          <img referrerPolicy="no-referrer" src={current.image} alt={current.title} className="w-full h-full object-cover opacity-60 mix-blend-multiply transition-all duration-700 ease-out scale-102" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mr-auto py-12 md:py-0">
          <div className="max-w-xl space-y-6 animate-fade-in">
            <span className="text-amber-400 font-mono text-xs tracking-widest uppercase font-semibold block">
              {current.title}
            </span>
            <h1 className="font-sans text-3.5xl md:text-5xl font-semibold tracking-tight text-white uppercase leading-none">
              {current.subtitle}
            </h1>
            <p className="font-serif text-sm md:text-base leading-relaxed text-stone-300">
              {current.desc}
            </p>
            <div className="pt-2">
              <button
                id="hero-slide-action-btn"
                onClick={() => onSelectCategory(current.category)}
                className="group flex items-center space-x-2 px-6 py-3.5 rounded-lg bg-white hover:bg-amber-400 text-stone-900 hover:text-stone-950 font-semibold tracking-wider text-xs uppercase transition-all duration-300 transform shadow-md hover:-translate-y-0.5 pointer-events-auto cursor-pointer"
              >
                <span>{current.action}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Slide navigation controls */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center space-x-2">
          <button
            id="hero-slide-prev"
            onClick={handlePrev}
            className="p-2 rounded-full border border-stone-700/60 bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex space-x-1 px-2">
            {items.map((_, idx) => (
              <span
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${activeSlide === idx ? "w-6 bg-amber-400" : "w-1.5 bg-stone-600"}`}
              ></span>
            ))}
          </div>
          <button
            id="hero-slide-next"
            onClick={handleNext}
            className="p-2 rounded-full border border-stone-700/60 bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-b bg-white dark:bg-slate-950/60 transition-colors py-8 text-stone-700 dark:text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {props.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-slate-900 text-stone-950 dark:text-amber-400">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold uppercase tracking-wide text-stone-900 dark:text-slate-100">{p.title}</h4>
                  <p className="font-serif text-[11px] text-stone-500 dark:text-slate-400 leading-tight mt-0.5">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

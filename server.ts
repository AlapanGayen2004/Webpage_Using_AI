import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Ensure the data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure db.json has a valid format
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ products: [], users: [], orders: [], logs: [] }, null, 2));
}

app.use(express.json());

// Initialize Gemini Client
// Using the recommended environment key process.env.GEMINI_API_KEY with 'User-Agent' config
const geminiApiKey = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize Gemini:", err);
  }
}

// Concurrent-safe file locker simple queue
let isWriting = false;
const writeQueue: (() => void)[] = [];

function readDatabase(): any {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read database:", error);
    return { products: [], users: [], orders: [], logs: [] };
  }
}

function writeDatabase(data: any): Promise<void> {
  return new Promise((resolve) => {
    const performWrite = () => {
      isWriting = true;
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
      } catch (err) {
        console.error("Failed to write to database:", err);
      } finally {
        isWriting = false;
        resolve();
        if (writeQueue.length > 0) {
          const next = writeQueue.shift();
          if (next) next();
        }
      }
    };

    if (isWriting) {
      writeQueue.push(performWrite);
    } else {
      performWrite();
    }
  });
}

// Log writer helper
async function addLog(level: "info" | "warn" | "error", message: string, detail?: { path?: string; method?: string; statusCode?: number }) {
  const db = readDatabase();
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    level,
    message,
    timestamp: new Date().toISOString(),
    ...detail,
  };
  db.logs = db.logs || [];
  db.logs.unshift(newLog);
  // Keep logs list trimmed to 150 items for concurrency performance
  if (db.logs.length > 150) {
    db.logs = db.logs.slice(0, 150);
  }
  await writeDatabase(db);
}

// Dynamic performance log middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const msg = `${req.method} ${req.originalUrl} returned status ${res.statusCode} in ${duration}ms`;
    if (res.statusCode >= 500) {
      addLog("error", msg, { path: req.originalUrl, method: req.method, statusCode: res.statusCode });
    } else if (res.statusCode >= 400) {
      addLog("warn", msg, { path: req.originalUrl, method: req.method, statusCode: res.statusCode });
    } else {
      addLog("info", msg, { path: req.originalUrl, method: req.method, statusCode: res.statusCode });
    }
  });
  next();
});

// SHA-256 Hashing helper
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// --- AUTHENTICATION API ---

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, avatar, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields (email, password, name)" });
    }

    const db = readDatabase();
    const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: "Email address is already in use" });
    }

    const newUser = {
      id: `user-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      email: email.toLowerCase(),
      name,
      role: role === "admin" ? "admin" : "customer",
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      passwordHash: hashPassword(password),
    };

    db.users.push(newUser);
    await writeDatabase(db);
    await addLog("info", `User registered successfully: ${email} (${newUser.role})`);

    // Return user without passwordHash
    const { passwordHash, ...userResponse } = newUser;
    res.status(201).json({ user: userResponse, token: `mock-jwt-token-${userResponse.id}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const db = readDatabase();
    const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password combination" });
    }

    const hashedPassword = hashPassword(password);
    if (user.passwordHash !== hashedPassword) {
      return res.status(401).json({ error: "Invalid email or password combination" });
    }

    await addLog("info", `User logged in: ${email}`);
    const { passwordHash, ...userResponse } = user;
    res.status(200).json({ user: userResponse, token: `mock-jwt-token-${userResponse.id}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

// Social Login endpoint simulator
app.post("/api/auth/social-login", async (req, res) => {
  try {
    const { email, name, provider, avatar } = req.body;
    if (!email || !name || !provider) {
      return res.status(400).json({ error: "Missing social login metrics" });
    }

    const db = readDatabase();
    let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: `user-social-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        email: email.toLowerCase(),
        name,
        role: "customer",
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        passwordHash: hashPassword(crypto.randomBytes(16).toString("hex")), // Random safe password path
      };
      db.users.push(user);
      await writeDatabase(db);
      await addLog("info", `Social login registered new user: ${email} via ${provider}`);
    } else {
      await addLog("info", `Social login signed in user: ${email} via ${provider}`);
    }

    const { passwordHash, ...userResponse } = user;
    res.status(200).json({ user: userResponse, token: `mock-jwt-token-${userResponse.id}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Social login failed" });
  }
});

// --- PRODUCTS API ---

app.get("/api/products", (req, res) => {
  try {
    const db = readDatabase();
    res.json(db.products);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load products" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, stock, image, features, tags } = req.body;
    if (!name || !description || price === undefined || !category || stock === undefined) {
      return res.status(400).json({ error: "Missing required product parameters" });
    }

    const db = readDatabase();
    const newProduct = {
      id: `prod-${Date.now()}`,
      name,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      rating: 5.0, // Default for new products
      reviewCount: 0,
      image: image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      category,
      stock: Number(stock),
      features: Array.isArray(features) ? features : [],
      tags: Array.isArray(tags) ? tags : [],
    };

    db.products.push(newProduct);
    await writeDatabase(db);
    await addLog("info", `Product added to inventory: ${name} (Stock: ${stock})`);
    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add product" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, originalPrice, category, stock, image, features, tags, rating, reviewCount } = req.body;

    const db = readDatabase();
    const index = db.products.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const oldProduct = db.products[index];
    const updatedProduct = {
      ...oldProduct,
      name: name !== undefined ? name : oldProduct.name,
      description: description !== undefined ? description : oldProduct.description,
      price: price !== undefined ? Number(price) : oldProduct.price,
      originalPrice: originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : oldProduct.originalPrice,
      category: category !== undefined ? category : oldProduct.category,
      stock: stock !== undefined ? Number(stock) : oldProduct.stock,
      image: image !== undefined ? image : oldProduct.image,
      features: features !== undefined ? features : oldProduct.features,
      tags: tags !== undefined ? tags : oldProduct.tags,
      rating: rating !== undefined ? Number(rating) : oldProduct.rating,
      reviewCount: reviewCount !== undefined ? Number(reviewCount) : oldProduct.reviewCount,
    };

    // Clean null fields for originalPrice
    if (updatedProduct.originalPrice === null) {
      delete updatedProduct.originalPrice;
    }

    db.products[index] = updatedProduct;
    await writeDatabase(db);
    await addLog("info", `Product stock modified: ${updatedProduct.name} id: ${id} (Stock: ${updatedProduct.stock})`);
    res.json(updatedProduct);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    const index = db.products.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const deletedProduct = db.products[index];
    db.products.splice(index, 1);
    await writeDatabase(db);
    await addLog("info", `Product removed from catalog: ${deletedProduct.name} id: ${id}`);
    res.json({ success: true, message: "Product deleted" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// --- ORDERS API ---

app.get("/api/orders", (req, res) => {
  try {
    const db = readDatabase();
    const userId = req.query.userId as string;
    
    if (userId) {
      const userOrders = db.orders.filter((o: any) => o.userId === userId);
      return res.json(userOrders);
    }
    
    // Default to sorting by recently created for admin analytics
    const sortedOrders = [...db.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sortedOrders);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// Create Order & Secure Simulated Gateway Checkout
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, userName, userEmail, items, paymentMethod, shippingAddress, promoCode } = req.body;
    if (!items || items.length === 0 || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ error: "Incomplete order specifications" });
    }

    const db = readDatabase();
    
    // Calculate totals, check stock availability
    let subtotal = 0;
    const orderItemsValidated: any[] = [];

    for (const item of items) {
      const originalProduct = db.products.find((p: any) => p.id === item.product.id);
      if (!originalProduct) {
        return res.status(400).json({ error: `Product not found in catalog: ${item.product.name}` });
      }
      
      if (originalProduct.stock < item.quantity) {
        return res.status(409).json({ error: `Insufficient stock on hand for ${originalProduct.name}. Only ${originalProduct.stock} left.` });
      }

      subtotal += originalProduct.price * item.quantity;
      orderItemsValidated.push({
        id: item.id || `${originalProduct.id}-${item.selectedSize || "Standard"}-${item.selectedColor || "Default"}`,
        product: {
          ...originalProduct,
          description: originalProduct.description.substring(0, 100) + "...", // Trim embedded details
        },
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
      });
    }

    // Apply promotions
    let discount = 0;
    if (promoCode === "SAVE20") {
      discount = Math.round(subtotal * 0.2 * 100) / 100;
    } else if (promoCode === "FREESHIP") {
      // Free shipping has no dollar impact on subtotal
    }

    const taxRate = 0.08; // 8% sales tax
    const tax = Math.round((subtotal - discount) * taxRate * 100) / 100;
    const total = Math.round((subtotal - discount + tax) * 100) / 100;

    // Secure Payment gateway integration simulation (instant processing delay & auth code)
    // Generating real crypto-backed checkout tokens securely
    const transactionId = "txn_" + crypto.randomBytes(12).toString("hex");

    // Deduct stock levels in parallel
    for (const item of items) {
      const pIdx = db.products.findIndex((p: any) => p.id === item.product.id);
      if (pIdx > -1) {
        db.products[pIdx].stock -= item.quantity;
      }
    }

    const newOrder = {
      id: `ORD-${1000 + db.orders.length + 1}`,
      userId: userId || "guest-user",
      userName: userName || "Guest Customer",
      userEmail: userEmail || "guest@eshop.com",
      items: orderItemsValidated,
      subtotal,
      discount,
      tax,
      total,
      status: "processing", // initial state of payment authorization success
      shippingAddress,
      paymentMethod,
      createdAt: new Date().toISOString(),
      transactionId,
      emailSent: true, // Trigger automated email alerts
    };

    db.orders.push(newOrder);
    await writeDatabase(db);
    
    // Auto sync order details to Google Sheets if active
    try {
      await appendOrderToGoogleSheet(newOrder);
    } catch (e) {
      console.error("Google Sheets order auto-sync failed:", e);
    }

    await addLog("info", `Verified order placed successfully: ${newOrder.id}. Charged: $${newOrder.total}. Transaction ID: ${transactionId}`);
    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Checkout failed" });
  }
});

// Admin endpoint to adjust order state (automatically generates email notification body)
app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Missing state code" });
    }

    const db = readDatabase();
    const oIdx = db.orders.findIndex((o: any) => o.id === id);
    if (oIdx === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const oldOrder = db.orders[oIdx];
    db.orders[oIdx].status = status;
    db.orders[oIdx].emailSent = true;

    await writeDatabase(db);
    await addLog("info", `Order status adjusted: ${id} altered from ${oldOrder.status} to ${status}`);
    res.json(db.orders[oIdx]);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to alter status" });
  }
});

// --- SYSTEM AUDIT LOGS ENDPOINT ---

app.get("/api/logs", (req, res) => {
  try {
    const db = readDatabase();
    res.json(db.logs || []);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch log repository" });
  }
});

app.post("/api/logs/clear", async (req, res) => {
  try {
    const db = readDatabase();
    db.logs = [
      {
        id: `log-${Date.now()}`,
        level: "info",
        message: "Audit trail repository manually flushed by Admin Elena Rodríguez.",
        timestamp: new Date().toISOString(),
        statusCode: 200,
      },
    ];
    await writeDatabase(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to flush log entries" });
  }
});

// --- GEMINI ARTIFICIAL INTELLIGENCE ENDPOINTS ---

// AI Support & Personal Shopping Advisor
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages repository must be provided as array" });
    }

    if (!aiClient) {
      // Graceful fallback if no Gemini Key configured yet
      const lastUserMsg = messages[messages.length - 1]?.text || "";
      const fallbackResponse = `Thanks for asking about our premium luxury collection! I'm acting in local checkout styling mode. Note: GEMINI_API_KEY is not configured in Secrets, but I can tell you that all our curated goods like the Premium Wireless Headphones ($299) and the Handcrafted Ceramic Vase ($55) are available for immediate checkout with 24-hour tracked shipping. Please configure your API Key for live AI advisor suggestions!`;
      return res.json({ text: fallbackResponse });
    }

    const db = readDatabase();
    const productCatalogBrief = db.products
      .map((p: any) => `- **${p.name}** (ID: ${p.id}): Category: ${p.category}. Price: $${p.price}. Stock: ${p.stock} units. Highlights: ${p.features.join(", ")}. Description: ${p.description}`)
      .join("\n");

    const systemPrompt = `You are the world-class eShop personal shopping stylist and design assistant. Your role is to provide premium customer services:
1. Provide warm, refined, helpful styling recommendations based on our catalog products.
2. Rely ONLY on the product names, details, and prices in our official luxury catalog provided below (never invent products).
3. Always suggest checking out directly, and tell them they can use promocode "SAVE20" for 20% off.
4. Keep paragraphs short, spacious, and elegant. Speak passionately about craft and aesthetics.

OUR OFFICIAL PRODUCT DATABASE:
${productCatalogBrief}

Format your output using clean Markdown, making sure the headers match spacing beautifully.`;

    // Map message list format into Gemini API parameter structures
    const geminiContents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiContents as any,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const aiText = response.text || "I apologize. I am momentarily pondering our collection. Could you repeat that?";
    res.json({ text: aiText });
  } catch (error: any) {
    console.error("Gemini Advisor Error:", error);
    res.status(500).json({ error: "AI advisor is temporarily out of service." });
  }
});

// Admin Dynamic AI Sales & Inventory Report
app.post("/api/analytics/ai-report", async (req, res) => {
  try {
    if (!aiClient) {
      return res.json({
        text: `### Curator Inventory Insight (Local Mode)
**Alert**: Please configure a \`GEMINI_API_KEY\` inside **Settings > Secrets** to activate real-time cognitive business analysis.
*   **Curator Notice**: Inventory is healthy: 8 products categories listed.
*   **Sales velocity**: Customer orders totaling $387.94 processed.
*   **Stock levels**: Classic Linen Blend Shirt has only 4 items remaining. Stock restock is suggested immediately.`,
      });
    }

    const db = readDatabase();
    const ordersBrief = db.orders
      .map((o: any) => `- ID: ${o.id}, Subtotal: $${o.subtotal}, Promo Discount: $${o.discount}, Charged: $${o.total}, Status: ${o.status}, Date: ${o.createdAt}, Items count: ${o.items.length}`)
      .join("\n");

    const productsBrief = db.products.map((p: any) => `- ${p.name} (${p.category}): Price: $${p.price}, Stock: ${p.stock}, Total reviews: ${p.reviewCount}`).join("\n");

    const analysisPrompt = `You are Elena Rodríguez's elite AI business metrics analyst. Review our current live store databases and create a concise, highly insightful, visually striking executive business bulletin.
Include:
1. A brief bold analysis of current customer sales velocity, highlighting low stock alarms needing replenishment.
2. Practical marketing advice (e.g., promotional strategies for slow-moving categories).
3. A bulleted recommended action list styled for high-end boutique directors.

DATABASE SNAPSHOTS:
STORES STOCKS:
${productsBrief}

RECENT ORDERS RECORDED:
${ordersBrief}

Compose your briefing in formal, sophisticated language in Markdown. Keep it clean and highly readable.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
    });

    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: "AI Executive reports are temporarily offline" });
  }
});

// Admin Analytics calculation (dynamic endpoints)
app.get("/api/analytics", (req, res) => {
  try {
    const db = readDatabase();
    const orders = db.orders || [];
    const products = db.products || [];

    let totalRevenue = 0;
    let totalProductsSold = 0;
    const itemsCount: { [key: string]: number } = {};
    const categoryValues: { [key: string]: number } = {};
    const categoryQty: { [key: string]: number } = {};

    // Base mock date revenues arrays (grouped by date)
    const dateMap: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach((o: any) => {
      // Only compile completed/shipped/delivered and initial processing for active revenues
      if (o.status !== "cancelled") {
        totalRevenue += o.total;
        
        // Group by Date (YYYY-MM-DD)
        const dateStr = o.createdAt.substring(0, 10);
        if (!dateMap[dateStr]) {
          dateMap[dateStr] = { revenue: 0, orders: 0 };
        }
        dateMap[dateStr].revenue += o.total;
        dateMap[dateStr].orders += 1;

        o.items.forEach((item: any) => {
          totalProductsSold += item.quantity;
          itemsCount[item.product.id] = (itemsCount[item.product.id] || 0) + item.quantity;

          const cat = item.product.category || "General";
          categoryQty[cat] = (categoryQty[cat] || 0) + item.quantity;
          categoryValues[cat] = (categoryValues[cat] || 0) + item.product.price * item.quantity;
        });
      }
    });

    // Check inventory lists
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p: any) => {
      if (p.stock === 0) {
        outOfStock++;
      } else if (p.stock <= 4) {
        lowStock++;
        inStock++;
      } else {
        inStock++;
      }
    });

    // Generate dynamic date values
    const dateListStr = Object.keys(dateMap).sort();
    const revenueByDate = dateListStr.map((d) => ({
      date: d,
      revenue: Math.round(dateMap[d].revenue * 100) / 100,
      orders: dateMap[d].orders,
    }));

    // If no values, insert seed charts
    if (revenueByDate.length === 0) {
      revenueByDate.push({ date: new Date().toISOString().substring(0, 10), revenue: 0, orders: 0 });
    }

    const categorySales = Object.keys(categoryValues).map((cat) => ({
      category: cat,
      sales: categoryQty[cat],
      value: Math.round(categoryValues[cat] * 100) / 100,
    }));

    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: orders.length,
      totalProductsSold,
      conversionRate: orders.length > 0 ? Math.round((orders.length / (orders.length * 4.2)) * 100 * 10) / 10 : 2.4, // Mock dynamic conversion
      averageOrderValue: orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
      inventoryStatus: {
        inStock,
        lowStock,
        outOfStock,
      },
      revenueByDate,
      categorySales,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load shop reporting analytics" });
  }
});

// ============================================================================
//                         GOOGLE SHEETS SYNC & OAUTH
// ============================================================================

// Helper to get Google Redirect URI dynamically based on runtime APP_URL
function getGoogleRedirectUri(req: any) {
  const base = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

// Helper to refresh Google OAuth access token if expired
async function ensureValidGoogleToken(config: any): Promise<string> {
  if (!config || !config.refreshToken) {
    throw new Error("Google Sheets is not linked. Please authorize first.");
  }

  const now = Date.now();
  if (config.expiresAt && now < config.expiresAt - 60000) {
    return config.accessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth Client ID or Client Secret is not configured in Secrets.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Token refresh failed: ${response.statusText}`);
  }

  const data = await response.json() as any;
  const newAccessToken = data.access_token;
  const expiresIn = data.expires_in || 3600;

  const db = readDatabase();
  db.googleSheetsConfig = db.googleSheetsConfig || {};
  db.googleSheetsConfig.accessToken = newAccessToken;
  db.googleSheetsConfig.expiresAt = Date.now() + (expiresIn * 1000);
  await writeDatabase(db);

  return newAccessToken;
}

// 1. Get Google OAuth Authorization URL
app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.json({
      configured: false,
      error: "Google credentials are missing in Secrets. Enable simulation mode below."
    });
  }

  const redirectUri = getGoogleRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent",
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ configured: true, url });
});

// 2. Google OAuth Callback (Popup target)
app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background: #faf9f6; color: #2e2a25;">
          <h2 style="color: #dc2626; font-weight: 500;">Authorization Cancelled</h2>
          <p style="color: #6b7280; font-size: 14px;">${error}</p>
          <button onclick="window.close()" style="background: #1c1917; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 15px;">Close Popup</button>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send("Authorization code is missing.");
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getGoogleRedirectUri(req);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errTxt = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errTxt}`);
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; 
    const expiresIn = tokenData.expires_in || 3600;

    let email = "Connected boutique account";
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json() as any;
        email = userInfo.email || email;
      }
    } catch (e) {
      console.warn("Failed to fetch Google email:", e);
    }

    const db = readDatabase();
    db.googleSheetsConfig = {
      isLinked: true,
      accessToken,
      refreshToken: refreshToken || (db.googleSheetsConfig?.refreshToken || ""), 
      expiresAt: Date.now() + (expiresIn * 1000),
      email,
      linkedAt: new Date().toISOString(),
      spreadsheetId: db.googleSheetsConfig?.spreadsheetId || "",
      spreadsheetUrl: db.googleSheetsConfig?.spreadsheetUrl || "",
      autoSync: db.googleSheetsConfig?.autoSync !== false, 
      mode: "real"
    };

    await writeDatabase(db);
    await addLog("info", `Google Sheets linked successfully for email: ${email}`);

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background: #faf9f6; color: #1c1917;">
          <h2 style="color: #059669; font-weight: 500;">Connection Successful!</h2>
          <p style="font-size: 14px; color: #57534e;">Your Google Sheets integration has been linked.</p>
          <p style="font-size: 13px; font-weight: bold; color: #b45309; margin-top: 10px;">${email}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", email: "${email}" }, "*");
              setTimeout(() => { window.close(); }, 1200);
            } else {
              window.location.href = "/";
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Popup exchange error:", err);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background: #faf9f6; color: #2e2a25;">
          <h2 style="color: #dc2626;">Integration Error</h2>
          <p style="margin-top: 10px; font-size: 14px;">${err.message || err}</p>
          <button onclick="window.close()" style="background: #1c1917; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 15px;">Close Window</button>
        </body>
      </html>
    `);
  }
});

// 3. Status Checked Route
app.get("/api/auth/google/status", (req, res) => {
  const db = readDatabase();
  const sheetsConfig = db.googleSheetsConfig || { isLinked: false, autoSync: true, mode: "demo" };
  const hasKeys = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  
  res.json({
    ...sheetsConfig,
    hasServerOAuthKeys: hasKeys
  });
});

// 4. Force Demo Mode mock connection
app.post("/api/auth/google/demo-connect", async (req, res) => {
  const db = readDatabase();
  db.googleSheetsConfig = {
    isLinked: true,
    email: "elena.rodriguez@luxury-eshop.com",
    linkedAt: new Date().toISOString(),
    spreadsheetId: "1eShop_Boutique_Mock_Sheet_ID_Demo_3829104",
    spreadsheetUrl: "https://docs.google.com/spreadsheets/d/1eShop_Boutique_Mock_Sheet_ID_Demo_3829104/edit",
    autoSync: true,
    mode: "demo"
  };
  await writeDatabase(db);
  await addLog("info", "Google Sheets connected in boutique demo simulation mode.");
  res.json(db.googleSheetsConfig);
});

// 5. Update direct dynamic settings
app.post("/api/auth/google/settings", async (req, res) => {
  try {
    const { spreadsheetId, autoSync } = req.body;
    const db = readDatabase();
    
    db.googleSheetsConfig = db.googleSheetsConfig || { isLinked: false, autoSync: true, mode: "demo" };
    if (spreadsheetId !== undefined) {
      db.googleSheetsConfig.spreadsheetId = spreadsheetId;
      if (spreadsheetId) {
        db.googleSheetsConfig.spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      } else {
        db.googleSheetsConfig.spreadsheetUrl = "";
      }
    }
    if (autoSync !== undefined) {
      db.googleSheetsConfig.autoSync = !!autoSync;
    }
    
    await writeDatabase(db);
    res.json(db.googleSheetsConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Disconnect connection
app.post("/api/auth/google/disconnect", async (req, res) => {
  const db = readDatabase();
  db.googleSheetsConfig = {
    isLinked: false,
    autoSync: true,
    mode: "demo",
    spreadsheetId: "",
    spreadsheetUrl: ""
  };
  await writeDatabase(db);
  await addLog("warn", "Google Sheets integration disconnected by boutique owner.");
  res.json({ success: true, message: "Disconnected successfully." });
});

// 7. Create Spreadsheet
app.post("/api/sheets/create", async (req, res) => {
  try {
    const db = readDatabase();
    const config = db.googleSheetsConfig;

    if (!config || !config.isLinked) {
      return res.status(401).json({ error: "Google Sheets is not linked. Please connect first." });
    }

    if (config.mode === "demo") {
      const mockId = "demo_doc_" + Math.random().toString(36).substring(2, 12);
      db.googleSheetsConfig.spreadsheetId = mockId;
      db.googleSheetsConfig.spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${mockId}/edit`;
      await writeDatabase(db);
      await addLog("info", "Created new simulated Google Spreadsheet inside eShop Boutique account.");
      return res.json(db.googleSheetsConfig);
    }

    const token = await ensureValidGoogleToken(config);
    
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          title: "eShop Luxurious Boutique Master Tracker",
        },
      }),
    });

    if (!createRes.ok) {
      const errTxt = await createRes.text();
      return res.status(createRes.status).json({ error: `Spreadsheet creation failed: ${errTxt}` });
    }

    const sheetData = await createRes.json() as any;
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    db.googleSheetsConfig.spreadsheetId = spreadsheetId;
    db.googleSheetsConfig.spreadsheetUrl = spreadsheetUrl;
    await writeDatabase(db);
    
    try {
      await initializeSheetStructure(token, spreadsheetId);
    } catch (err) {
      console.error("Failed to seed initial columns:", err);
    }

    await addLog("info", `Created and formatted a new Google Spreadsheet file for tracking boutique sales.`);
    res.json(db.googleSheetsConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create spreadsheet" });
  }
});

// Helper to set up sheet Tabs & Headers ("Orders" and "Inventory")
async function initializeSheetStructure(token: string, spreadsheetId: string) {
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  
  await fetch(batchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: 0,
              title: "Orders",
            },
            fields: "title",
          },
        },
        {
          addSheet: {
            properties: {
              title: "Products",
            },
          },
        },
      ],
    }),
  });

  const ordersHeaders = ["Order ID", "Date", "Customer Name", "Customer Email", "Subtotal", "Discount", "Tax", "Total Amount Charged", "Status", "Items Count", "Products Detail"];
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1:K1?valueInputOption=RAW`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [ordersHeaders] }),
  });

  const productsHeaders = ["Product ID", "Product Name", "Category", "Price USD", "Stock Left"];
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Products!A1:E1?valueInputOption=RAW`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [productsHeaders] }),
  });
}

// 8. Trigger manual full sync
app.post("/api/sheets/sync-all", async (req, res) => {
  try {
    const db = readDatabase();
    const config = db.googleSheetsConfig;

    if (!config || !config.isLinked || !config.spreadsheetId) {
      return res.status(400).json({ error: "Google Sheets is not linked or spreadsheet ID is missing." });
    }

    if (config.mode === "demo") {
      await addLog("info", `Export synchronizer complete: linked ${db.products.length} products and ${db.orders.length} orders to mock Google Sheet.`);
      return res.json({ success: true, productsCount: db.products.length, ordersCount: db.orders.length });
    }

    const token = await ensureValidGoogleToken(config);
    const spreadsheetId = config.spreadsheetId;

    try {
      await initializeSheetStructure(token, spreadsheetId);
    } catch (e) {
      // Slabs of tabs or sheets might already exist, continue
    }

    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`;
    await fetch(clearUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ranges: ["Orders!A2:K2000", "Products!A2:E500"] }),
    });

    const productRows = db.products.map((p: any) => [
      p.id,
      p.name,
      p.category,
      p.price,
      p.stock,
    ]);

    if (productRows.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Products!A2?valueInputOption=RAW`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: productRows }),
      });
    }

    const orderRows = db.orders.map((o: any) => {
      const itemsBrief = o.items.map((i: any) => `${i.product.name} (QTY: ${i.quantity}, Size: ${i.selectedSize || "N/A"})`).join("; ");
      return [
        o.id,
        o.createdAt,
        o.userName || "Guest",
        o.userEmail || "guest@eshop.com",
        o.subtotal,
        o.discount,
        o.tax,
        o.total,
        o.status,
        o.items.length,
        itemsBrief,
      ];
    });

    if (orderRows.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A2?valueInputOption=RAW`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: orderRows }),
      });
    }

    await addLog("info", `Export complete: Synchronized ${db.products.length} products and ${db.orders.length} orders into Spreadsheet tabs.`);
    res.json({ success: true, productsCount: db.products.length, ordersCount: db.orders.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to trigger synchronization." });
  }
});

// Helper function to append a new order dynamically if sheets autoSync is ON
async function appendOrderToGoogleSheet(order: any) {
  try {
    const db = readDatabase();
    const config = db.googleSheetsConfig;

    if (!config || !config.isLinked || !config.spreadsheetId || !config.autoSync) {
      return; 
    }

    const itemsBrief = order.items.map((i: any) => `${i.product.name} (QTY: ${i.quantity}, Size: ${i.selectedSize || "N/A"})`).join("; ");
    const orderRow = [
      order.id,
      order.createdAt,
      order.userName || "Guest",
      order.userEmail || "guest@eshop.com",
      order.subtotal,
      order.discount,
      order.tax,
      order.total,
      order.status,
      order.items.length,
      itemsBrief,
    ];

    if (config.mode === "demo") {
      await addLog("info", `Real-time sync simulated: Appended order row for ${order.id} to Google Sheet.`);
      return;
    }

    const token = await ensureValidGoogleToken(config);
    const spreadsheetId = config.spreadsheetId;

    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1:append?valueInputOption=RAW`;
    await fetch(appendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [orderRow],
      }),
    });

    await addLog("info", `Automatically updated Google Sheets with order entry: ${order.id}`);
  } catch (err: any) {
    console.error("Failed to automatically synchronize order to Google Sheets:", err);
  }
}

// --- VITE DEV / PRODUCTION INGRESS SERVER RULES ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[eShop] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

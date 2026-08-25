import { db, firebaseReady } from "./firebase.js";
import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const WHATSAPP = "201286560161";
const ORANGE_CASH = "01286560161";

const demoData = {
  settings: {
    heroTitleAr: "أناقتك تبدأ من هنا ✨",
    heroTitleEn: "Your style starts here ✨",
    heroTextAr: "ملابس • إكسسوارات • SHEIN • قطع فورية",
    heroTextEn: "Clothing • Accessories • SHEIN • Instant Pieces",
    shippingTextAr: "شحن لجميع المحافظات",
    shippingTextEn: "Shipping to all governorates"
  },
  categories: {
    all: { nameAr: "الكل", nameEn: "All", image: "", visible: true, order: 0 },
    clothes: { nameAr: "ملابس", nameEn: "Clothing", image: "", visible: true, order: 1 },
    accessories: { nameAr: "إكسسوارات", nameEn: "Accessories", image: "", visible: true, order: 2 },
    shein: { nameAr: "SHEIN", nameEn: "SHEIN", image: "", visible: true, order: 3 },
    instant: { nameAr: "القطع الفورية", nameEn: "Instant Pieces", image: "", visible: true, order: 4 },
    offers: { nameAr: "العروض", nameEn: "Offers", image: "", visible: true, order: 5 }
  },
  shipping: {
    cairo: { name: "القاهرة", price: 60, active: true },
    giza: { name: "الجيزة", price: 60, active: true },
    alexandria: { name: "الإسكندرية", price: 65, active: true },
    minya: { name: "المنيا", price: 50, active: true },
    assiut: { name: "أسيوط", price: 55, active: true }
  },
  products: {
    demo1: {
      id: "demo1", nameAr: "فستان أنيق", nameEn: "Elegant Dress",
      descAr: "فستان أنيق بتصميم ناعم مناسب للإطلالات اليومية والمناسبات.",
      descEn: "Elegant soft-design dress for daily looks and occasions.",
      price: 450, oldPrice: 550, category: "clothes",
      images: [], sizes: ["S","M","L","XL"], colors: ["أسود","بيج"],
      variants: [], stock: 5, offer: true, shein: false, instant: true, active: true, order: 1
    },
    demo2: {
      id: "demo2", nameAr: "شنطة نسائية", nameEn: "Women's Bag",
      descAr: "شنطة أنيقة وخفيفة بتصميم عملي.",
      descEn: "Elegant lightweight bag with a practical design.",
      price: 350, oldPrice: 0, category: "accessories",
      images: [], sizes: ["مقاس موحد"], colors: ["بيج","أسود"],
      variants: [], stock: 8, offer: false, shein: false, instant: true, active: true, order: 2
    }
  }
};

let state = {
  lang: localStorage.getItem("bm_lang") || "ar",
  category: "all",
  query: "",
  products: {},
  categories: {},
  shipping: {},
  settings: {},
  cart: JSON.parse(localStorage.getItem("bm_cart") || "[]")
};

const $ = s => document.querySelector(s);
const money = n => `${Number(n || 0).toLocaleString("en-US")} جنيه`;

async function loadData() {
  if (!firebaseReady) {
    state.products = demoData.products;
    state.categories = demoData.categories;
    state.shipping = demoData.shipping;
    state.settings = demoData.settings;
    return;
  }
  try {
    const snap = await get(ref(db));
    const data = snap.val() || {};
    state.products = data.products || demoData.products;
    state.categories = data.categories || demoData.categories;
    state.shipping = data.shipping || demoData.shipping;
    state.settings = data.settings || demoData.settings;
  } catch (e) {
    console.warn("Firebase unavailable; using demo data.", e);
    state.products = demoData.products;
    state.categories = demoData.categories;
    state.shipping = demoData.shipping;
    state.settings = demoData.settings;
  }
}

function applyLanguage() {
  const ar = state.lang === "ar";
  document.documentElement.lang = ar ? "ar" : "en";
  document.documentElement.dir = ar ? "rtl" : "ltr";
  $("#langBtn").textContent = ar ? "EN" : "AR";
  const s = state.settings;
  $("#heroTitle").textContent = ar ? (s.heroTitleAr || demoData.settings.heroTitleAr) : (s.heroTitleEn || demoData.settings.heroTitleEn);
  $("#heroText").textContent = ar ? (s.heroTextAr || demoData.settings.heroTextAr) : (s.heroTextEn || demoData.settings.heroTextEn);
  $("#shippingText").textContent = ar ? (s.shippingTextAr || demoData.settings.shippingTextAr) : (s.shippingTextEn || demoData.settings.shippingTextEn);
  $("#shopBtn").textContent = ar ? "تسوقي الآن" : "Shop now";
  $("#searchInput").placeholder = ar ? "ابحثي عن منتج..." : "Search products...";
}

function renderCategories() {
  const ar = state.lang === "ar";
  const cats = Object.entries(state.categories || {})
    .filter(([id,c]) => c && c.visible !== false)
    .sort((a,b) => (a[1].order||0)-(b[1].order||0));
  $("#categories").innerHTML = cats.map(([id,c]) => {
    const active = state.category === id;
    return `<button class="cat-btn ${active ? "active":""}" data-cat="${id}">${ar ? c.nameAr : c.nameEn}</button>`;
  }).join("");
  if (!cats.some(([id]) => id === "all")) {
    $("#categories").insertAdjacentHTML("afterbegin", `<button class="cat-btn ${state.category==="all"?"active":""}" data-cat="all">${ar?"الكل":"All"}</button>`);
  }
}

function productImage(p) {
  return (p.images && p.images[0]) || "";
}

function renderProducts() {
  const ar = state.lang === "ar";
  const query = state.query.trim().toLowerCase();
  const all = Object.values(state.products || {}).filter(p => p && p.active !== false && Number(p.stock || 0) > 0);
  const list = all.filter(p => {
    const inCat = state.category === "all"
      || p.category === state.category
      || (state.category === "offers" && p.offer)
      || (state.category === "shein" && p.shein)
      || (state.category === "instant" && p.instant);
    const name = `${p.nameAr||""} ${p.nameEn||""}`.toLowerCase();
    return inCat && (!query || name.includes(query));
  }).sort((a,b)=>(a.order||0)-(b.order||0));

  $("#resultCount").textContent = `${list.length}`;
  $("#sectionTitle").textContent = state.category === "all"
    ? (ar ? "كل المنتجات" : "All Products")
    : (state.categories[state.category] ? (ar ? state.categories[state.category].nameAr : state.categories[state.category].nameEn) : (ar ? "المنتجات" : "Products"));

  $("#productsGrid").innerHTML = list.map(p => {
    const img = productImage(p);
    const name = ar ? p.nameAr : p.nameEn;
    const price = money(p.price);
    const old = p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : "";
    const badge = p.offer ? `<span class="badge">🔥 ${ar?"عرض":"Offer"}</span>` : (p.shein ? `<span class="badge">SHEIN</span>` : (p.instant ? `<span class="badge">⚡ ${ar?"فوري":"Instant"}</span>` : ""));
    return `<article class="product-card" data-id="${p.id}">
      <button class="heart" data-wish="${p.id}" aria-label="wishlist">♡</button>
      <div class="product-image">${img ? `<img src="${escapeHtml(img)}" loading="lazy" alt="${escapeHtml(name)}">` : `<div class="image-placeholder">MARVEL</div>`}${badge}</div>
      <div class="product-info">
        <h3>${escapeHtml(name)}</h3>
        <div class="price-row"><strong>${price}</strong>${old}</div>
        <button class="add-btn" data-add="${p.id}">${ar?"أضف للسلة 🛍️":"Add to cart 🛍️"}</button>
      </div>
    </article>`;
  }).join("");
  $("#emptyState").classList.toggle("hidden", list.length !== 0);
}

function renderCart() {
  const ar = state.lang === "ar";
  const total = state.cart.reduce((sum,i)=>sum + i.price*i.qty,0);
  $("#cartCount").textContent = state.cart.reduce((s,i)=>s+i.qty,0);
  $("#cartSubtotal").textContent = money(total);
  $("#cartItems").innerHTML = state.cart.length ? state.cart.map((i,idx)=>`
    <div class="cart-item">
      <div class="mini-img">${i.image ? `<img src="${escapeHtml(i.image)}" alt="">` : "MARVEL"}</div>
      <div class="cart-item-main">
        <strong>${escapeHtml(i.name)}</strong>
        <small>${i.size ? `${ar?"المقاس":"Size"}: ${escapeHtml(i.size)}` : ""} ${i.color ? ` · ${escapeHtml(i.color)}` : ""}</small>
        <div class="qty"><button data-qty="${idx}" data-delta="-1">−</button><b>${i.qty}</b><button data-qty="${idx}" data-delta="1">+</button><button class="remove" data-remove="${idx}">حذف</button></div>
        <strong>${money(i.price*i.qty)}</strong>
      </div>
    </div>`).join("") : `<div class="empty"><div>🛍️</div><h3>${ar?"السلة فارغة":"Your cart is empty"}</h3></div>`;
  localStorage.setItem("bm_cart", JSON.stringify(state.cart));
}

function openProduct(id) {
  const p = state.products[id];
  if (!p) return;
  const ar = state.lang === "ar";
  const sizes = (p.sizes||[]).map(s=>`<option>${escapeHtml(s)}</option>`).join("");
  const colors = (p.colors||[]).map(c=>`<option>${escapeHtml(c)}</option>`).join("");
  const img = productImage(p);
  $("#productModalBody").innerHTML = `
    <div class="product-detail">
      <div class="detail-image">${img ? `<img src="${escapeHtml(img)}" alt="">` : "BRAND MARVEL"}</div>
      <div>
        <span class="eyebrow">${p.offer?"🔥 OFFER":p.shein?"SHEIN":p.instant?"⚡ INSTANT":""}</span>
        <h2>${escapeHtml(ar?p.nameAr:p.nameEn)}</h2>
        <p>${escapeHtml(ar?p.descAr:p.descEn)}</p>
        <div class="price-row big"><strong>${money(p.price)}</strong>${p.oldPrice?`<del>${money(p.oldPrice)}</del>`:""}</div>
        ${p.sizes?.length?`<label>${ar?"المقاس":"Size"}<select id="detailSize">${sizes}</select></label>`:""}
        ${p.colors?.length?`<label>${ar?"اللون":"Color"}<select id="detailColor">${colors}</select></label>`:""}
        <label>${ar?"الكمية":"Quantity"}<input id="detailQty" type="number" min="1" max="${p.stock}" value="1"></label>
        <button class="primary-btn full" data-detail-add="${p.id}">${ar?"أضف للسلة":"Add to cart"}</button>
      </div>
    </div>`;
  showModal("productModal");
}

function addToCart(id, opts={}) {
  const p = state.products[id];
  if (!p || Number(p.stock||0) < 1) return;
  const name = state.lang === "ar" ? p.nameAr : p.nameEn;
  const key = `${id}|${opts.size||""}|${opts.color||""}`;
  const existing = state.cart.find(i=>i.key===key);
  const qty = Math.max(1, Number(opts.qty||1));
  if (existing) existing.qty = Math.min(existing.qty+qty, Number(p.stock));
  else state.cart.push({key,id,name,price:Number(p.price||0),image:productImage(p),size:opts.size||"",color:opts.color||"",qty:Math.min(qty,Number(p.stock))});
  renderCart();
  hideModal("productModal");
  openDrawer();
}

function shippingFor(governorate) {
  const found = Object.values(state.shipping||{}).find(s => s && s.active !== false && String(s.name).trim().toLowerCase() === String(governorate).trim().toLowerCase());
  return found ? Number(found.price||0) : 0;
}

async function submitOrder(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const subtotal = state.cart.reduce((sum,i)=>sum+i.price*i.qty,0);
  const shipping = shippingFor(data.governorate);
  const total = subtotal + shipping;
  const order = {
    customer: data, items: state.cart, subtotal, shipping, total,
    status: "جديد", createdAt: Date.now()
  };
  let orderId = "BM" + Math.floor(1000 + Math.random()*9000);
  if (firebaseReady) {
    try {
      const newRef = push(ref(db, "orders"));
      orderId = "BM" + newRef.key.slice(-6).toUpperCase();
      await set(newRef, {...order, orderNumber: orderId});
    } catch(e) { console.warn(e); }
  }

  const lines = state.cart.map((i,n)=>`${n+1}- ${i.name}\n${i.size?"المقاس: "+i.size+"\n":""}${i.color?"اللون: "+i.color+"\n":""}الكمية: ${i.qty}\nالسعر: ${money(i.price*i.qty)}`).join("\n\n");
  const message = `BRAND MARVEL 🛍️\n\nطلب جديد: ${orderId}\n\nالمنتجات:\n${lines}\n\nإجمالي المنتجات: ${money(subtotal)}\nالشحن: ${shipping ? money(shipping) : "سيتم تحديده"}\nالإجمالي: ${money(total)}\n\nالاسم: ${data.name}\nرقم الهاتف: ${data.phone}\nالمحافظة: ${data.governorate}\nالمنطقة: ${data.area||"-"}\nالعنوان: ${data.address}\nعلامة مميزة: ${data.landmark||"-"}\nطريقة الدفع: ${data.payment}\nملاحظات: ${data.notes||"-"}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
  state.cart = [];
  renderCart();
  hideModal("checkoutModal");
}

function showModal(id){ const el=$("#"+id); el.classList.remove("hidden"); el.setAttribute("aria-hidden","false"); }
function hideModal(id){ const el=$("#"+id); el.classList.add("hidden"); el.setAttribute("aria-hidden","true"); }
function openDrawer(){ $("#cartDrawer").classList.add("open"); $("#cartDrawer").setAttribute("aria-hidden","false"); }
function closeDrawer(){ $("#cartDrawer").classList.remove("open"); $("#cartDrawer").setAttribute("aria-hidden","true"); }
function escapeHtml(v){ return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }

document.addEventListener("click", e=>{
  const cat=e.target.closest("[data-cat]"); if(cat){state.category=cat.dataset.cat;renderCategories();renderProducts();return;}
  const add=e.target.closest("[data-add]"); if(add){openProduct(add.dataset.add);return;}
  const wish=e.target.closest("[data-wish]"); if(wish){const id=wish.dataset.wish;let w=JSON.parse(localStorage.getItem("bm_wishlist")||"[]");w=w.includes(id)?w.filter(x=>x!==id):[...w,id];localStorage.setItem("bm_wishlist",JSON.stringify(w));wish.textContent=w.includes(id)?"♥":"♡";return;}
  const qty=e.target.closest("[data-qty]"); if(qty){const i=Number(qty.dataset.qty);state.cart[i].qty=Math.max(1,Math.min(state.cart[i].qty+Number(qty.dataset.delta),Number(state.products[state.cart[i].id].stock||99)));renderCart();return;}
  const rem=e.target.closest("[data-remove]"); if(rem){state.cart.splice(Number(rem.dataset.remove),1);renderCart();return;}
  const da=e.target.closest("[data-detail-add]"); if(da){addToCart(da.dataset.detailAdd,{size:$("#detailSize")?.value,color:$("#detailColor")?.value,qty:$("#detailQty")?.value});return;}
  const close=e.target.closest("[data-close]"); if(close){close.dataset.close==="cartDrawer"?closeDrawer():hideModal(close.dataset.close);return;}
});
$("#langBtn").addEventListener("click",()=>{state.lang=state.lang==="ar"?"en":"ar";localStorage.setItem("bm_lang",state.lang);applyLanguage();renderCategories();renderProducts();renderCart();});
$("#searchInput").addEventListener("input",e=>{state.query=e.target.value;renderProducts();});
$("#cartBtn").addEventListener("click",openDrawer);
$("#checkoutBtn").addEventListener("click",()=>{if(!state.cart.length)return alert(state.lang==="ar"?"السلة فارغة":"Your cart is empty");showModal("checkoutModal");});
$("#checkoutForm").addEventListener("submit",e=>{e.preventDefault();submitOrder(e.target);});
$("#shopBtn").addEventListener("click",()=>$("#shop").scrollIntoView({behavior:"smooth"}));
$("#whatsappFloat").addEventListener("click",()=>window.open(`https://wa.me/${WHATSAPP}`,"_blank"));
document.addEventListener("input",e=>{if(e.target.name==="governorate"){const subtotal=state.cart.reduce((s,i)=>s+i.price*i.qty,0),sh=shippingFor(e.target.value);$("#shippingPreview").innerHTML=`إجمالي المنتجات: <b>${money(subtotal)}</b><br>الشحن: <b>${sh?money(sh):"سيتم تحديده"}</b><br>الإجمالي: <b>${money(subtotal+sh)}</b>`;}});

await loadData();
applyLanguage();
renderCategories();
renderProducts();
renderCart();

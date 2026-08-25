import { auth, db, storage, firebaseReady } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { ref, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const $=s=>document.querySelector(s);
let data={products:{},categories:{},shipping:{},orders:{},settings:{}};

function notice(msg){$("#loginError").textContent=msg;$("#loginError").classList.remove("hidden");}
async function load(){
 if(!firebaseReady){data={products:{},categories:{},shipping:{},orders:{},settings:{}};renderAll();return;}
 const snap=await get(ref(db)); const x=snap.val()||{};
 data.products=x.products||{};data.categories=x.categories||{};data.shipping=x.shipping||{};data.orders=x.orders||{};data.settings=x.settings||{};
 fillSettings();renderAll();
}
function fillSettings(){for(const [k,v] of Object.entries(data.settings)){const el=$(`[name="${k}"]`);if(el)el.value=v||""}}
function renderProducts(){
 const rows=Object.values(data.products).map(p=>`<tr><td>${esc(p.nameAr)}</td><td>${p.price} جنيه</td><td>${p.stock}</td><td>${p.offer?"🔥":""}${p.shein?" SHEIN":""}${p.instant?" ⚡":""}</td><td><button data-edit="${p.id}">تعديل</button> <button data-del="${p.id}" class="danger">حذف</button></td></tr>`).join("");
 $("#productsList").innerHTML=`<table class="admin-table"><tr><th>المنتج</th><th>السعر</th><th>المخزون</th><th>Flags</th><th>إجراء</th></tr>${rows||"<tr><td colspan=5>لا توجد منتجات</td></tr>"}</table>`;
}
function renderCats(){ $("#catsList").innerHTML=Object.entries(data.categories).map(([id,c])=>`<div class="notice"><b>${esc(c.nameAr)}</b> — ${esc(c.nameEn)} <button data-cat-del="${id}" class="danger">حذف</button></div>`).join("");}
function renderShip(){ $("#shipList").innerHTML=Object.entries(data.shipping).map(([id,s])=>`<div class="notice"><b>${esc(s.name)}</b> — ${s.price} جنيه ${s.active===false?"(متوقف)":""}</div>`).join("");}
function renderOrders(){
 const arr=Object.entries(data.orders).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));
 $("#ordersList").innerHTML=arr.length?arr.map(([id,o])=>`<div class="notice"><b>${esc(o.orderNumber||id)}</b><br>${esc(o.customer?.name||"")} — ${esc(o.customer?.phone||"")}<br>الإجمالي: ${o.total||0} جنيه<br>الحالة: <select data-status="${id}">${["جديد","تم التواصل","تم التأكيد","تم الشحن","تم التسليم","ملغي"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select></div>`).join(""):"لا توجد طلبات.";
}
function renderAll(){renderProducts();renderCats();renderShip();renderOrders();}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function productFromForm(f){
 const g=n=>f.elements[n];
 return {id:g("id").value||crypto.randomUUID(),nameAr:g("nameAr").value,nameEn:g("nameEn").value,descAr:g("descAr").value,descEn:g("descEn").value,
 price:Number(g("price").value||0),oldPrice:Number(g("oldPrice").value||0),category:g("category").value||"clothes",
 images:g("images").value.split(",").map(x=>x.trim()).filter(Boolean),sizes:g("sizes").value.split(",").map(x=>x.trim()).filter(Boolean),
 colors:g("colors").value.split(",").map(x=>x.trim()).filter(Boolean),variants:g("variants").value.split(",").map(x=>x.trim()).filter(Boolean),
 stock:Number(g("stock").value||0),offer:g("offer").checked,shein:g("shein").checked,instant:g("instant").checked,active:g("active").checked,order:Number(g("order").value||0)};
}
function fillProduct(p){
 const f=$("#productForm");f.classList.remove("hidden");
 for(const [k,v] of Object.entries(p)){const el=f.elements[k];if(!el)continue;if(el.type==="checkbox")el.checked=!!v;else if(Array.isArray(v))el.value=v.join(",");else el.value=v??""}
}
onAuthStateChanged(auth, async user=>{
 if(user){$("#loginPanel").classList.add("hidden");$("#dashboard").classList.remove("hidden");await load();}
 else{$("#loginPanel").classList.remove("hidden");$("#dashboard").classList.add("hidden");}
});
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!firebaseReady)return notice("أكمل بيانات Firebase في firebase.js أولًا.");try{await signInWithEmailAndPassword(auth,$("#email").value,$("#password").value)}catch(err){notice("فشل تسجيل الدخول: "+err.message)}});
$("#logoutBtn").addEventListener("click",()=>signOut(auth));
document.addEventListener("click",async e=>{
 const nav=e.target.closest("[data-panel]");if(nav){document.querySelectorAll("#dashboard .panel").forEach(x=>x.classList.add("hidden"));$("#"+nav.dataset.panel+"Panel").classList.remove("hidden");return;}
 if(e.target.id==="newProductBtn"){$("#productForm").reset();$("#productForm").classList.remove("hidden");return;}
 if(e.target.id==="cancelProduct"){$("#productForm").classList.add("hidden");return;}
 const edit=e.target.closest("[data-edit]");if(edit){fillProduct(data.products[edit.dataset.edit]);return;}
 const del=e.target.closest("[data-del]");if(del&&confirm("هل أنت متأكد من حذف المنتج؟")){await remove(ref(db,"products/"+del.dataset.del));await load();return;}
 const cd=e.target.closest("[data-cat-del]");if(cd&&confirm("حذف القسم؟")){await remove(ref(db,"categories/"+cd.dataset.catDel));await load();return;}
});
$("#productForm").addEventListener("submit",async e=>{e.preventDefault();if(!firebaseReady)return alert("أكمل Firebase أولًا.");const p=productFromForm(e.target);await set(ref(db,"products/"+p.id),p);e.target.classList.add("hidden");await load();});
$("#catForm").addEventListener("submit",async e=>{e.preventDefault();const f=e.target,id=f.id.value;await set(ref(db,"categories/"+id),{nameAr:f.nameAr.value,nameEn:f.nameEn.value,order:Number(f.order.value||0),visible:true});f.reset();await load();});
$("#shipForm").addEventListener("submit",async e=>{e.preventDefault();const f=e.target;await set(ref(db,"shipping/"+f.id.value),{name:f.name.value,price:Number(f.price.value),active:f.active.checked});f.reset();await load();});
$("#settingsForm").addEventListener("submit",async e=>{e.preventDefault();const o={};new FormData(e.target).forEach((v,k)=>o[k]=v);await update(ref(db,"settings"),o);await load();alert("تم حفظ الإعدادات");});
document.addEventListener("change",async e=>{if(e.target.dataset.status)await update(ref(db,"orders/"+e.target.dataset.status),{status:e.target.value});});

import { auth, db, firebaseReady } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { ref, get, set, update, remove } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const $=s=>document.querySelector(s);
const CLOUDINARY_CLOUD_NAME="sdshejpc";
const CLOUDINARY_UPLOAD_PRESET="brand_marvel_products";
const CLOUDINARY_UPLOAD_URL=`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
let data={products:{},categories:{},shipping:{},orders:{},settings:{}};
let editingProductId=null;
let pendingFile=null;
let savedImageUrl="";
let lastCategory="";

function notice(msg){const el=$("#loginError");el.textContent=msg;el.classList.remove("hidden")}
function firebaseError(err){
 const code=err?.code||"";
 const map={"auth/invalid-credential":"البريد أو كلمة المرور غير صحيحة.","auth/invalid-email":"البريد الإلكتروني غير صحيح.","auth/user-not-found":"لا يوجد مستخدم بهذا البريد في Firebase Authentication.","auth/wrong-password":"كلمة المرور غير صحيحة.","auth/too-many-requests":"تمت محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.","auth/operation-not-allowed":"فعّل Email/Password من Firebase Authentication > Sign-in method.","auth/network-request-failed":"تأكد من الإنترنت ثم حاول مرة أخرى."};
 return map[code]||"حدث خطأ أثناء تنفيذ العملية. حاول مرة أخرى.";
}
async function load(){
 if(!firebaseReady){data={products:{},categories:{},shipping:{},orders:{},settings:{}};renderAll();return}
 const snap=await get(ref(db));const x=snap.val()||{};
 data.products=x.products||{};data.categories=x.categories||{};data.shipping=x.shipping||{};data.orders=x.orders||{};data.settings=x.settings||{};
 fillSettings();renderAll();
}
function fillSettings(){for(const [k,v] of Object.entries(data.settings)){const el=$(`[name="${k}"]`);if(el)el.value=v||""}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function productImage(p){return p?.images?.[0]||""}
function renderStats(){
 const products=Object.values(data.products);const active=products.filter(p=>p.active!==false).length;const orders=Object.values(data.orders);
 $("#statProducts").textContent=products.length;$("#statActive").textContent=active;$("#statCategories").textContent=Object.keys(data.categories).filter(k=>k!=="all").length;$("#statOrders").textContent=orders.filter(o=>o.status!=="ملغي").length;
}
function renderProducts(){
 const q=$("#productSearch").value.trim().toLowerCase();
 const entries=Object.values(data.products).filter(p=>!q||String(p.nameAr||"").toLowerCase().includes(q)||String(p.nameEn||"").toLowerCase().includes(q));
 $("#productsList").innerHTML=entries.length?`<div class="product-cards">${entries.map(p=>{
   const c=data.categories[p.category];const img=productImage(p);const status=p.active===false?'<span class="status-off">غير متوفر</span>':'<span class="status-ok">متوفر</span>';
   return `<article class="product-admin-card"><div class="product-thumb">${img?`<img src="${esc(img)}" alt="">`:`<div class="thumb-empty">📷</div>`}</div><div><div class="product-card-top"><h3>${esc(p.nameAr||"بدون اسم")}</h3><span class="stock-pill">${Number(p.stock||0)} قطعة</span></div><div class="product-meta"><span>${Number(p.price||0).toLocaleString("en-US")} جنيه</span><span>${esc(c?.nameAr||p.category||"بدون قسم")}</span><span>${status}</span></div><div class="card-actions"><button class="edit-btn" data-edit="${esc(p.id)}">تعديل</button><button class="danger" data-del="${esc(p.id)}">حذف</button></div></div></article>`
 }).join("")}</div>`:`<div class="empty"><div>🛍️</div><b>لا توجد منتجات</b><p>ابدأ بإضافة أول منتج للمتجر.</p></div>`;
}
function renderCats(){$("#catsList").innerHTML=Object.entries(data.categories).filter(([id])=>id!=="all").map(([id,c])=>`<div class="list-row"><div><b>${esc(c.nameAr)}</b><small>${esc(c.nameEn||"")}</small></div><span class="soft-tag">${esc(id)}</span><button data-cat-del="${esc(id)}" class="danger small-btn">حذف</button></div>`).join("")||`<div class="empty compact">لا توجد أقسام.</div>`}
function renderShip(){$("#shipList").innerHTML=Object.entries(data.shipping).map(([id,s])=>`<div class="list-row"><div><b>${esc(s.name)}</b><small>${Number(s.price||0)} جنيه شحن ${s.active===false?"• متوقف":"• مفعل"}</small></div><span class="soft-tag">${esc(id)}</span></div>`).join("")||`<div class="empty compact">لا توجد بيانات شحن.</div>`}
function renderOrders(){const arr=Object.entries(data.orders).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));$("#ordersList").innerHTML=arr.length?arr.map(([id,o])=>`<div class="order-row"><div><b>${esc(o.orderNumber||id)}</b><small>${esc(o.customer?.name||"عميل")} • ${esc(o.customer?.phone||"")}</small><small>الإجمالي: ${Number(o.total||0).toLocaleString("en-US")} جنيه</small></div><select data-status="${esc(id)}">${["جديد","تم التواصل","تم التأكيد","تم الشحن","تم التسليم","ملغي"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select></div>`).join(""):`<div class="empty"><div>📦</div><b>لا توجد طلبات</b><p>الطلبات الجديدة ستظهر هنا.</p></div>`}
function renderAll(){renderStats();renderProducts();renderCats();renderShip();renderOrders();renderCategoryOptions()}
function renderCategoryOptions(selected=lastCategory){const cats=Object.entries(data.categories).filter(([id,c])=>id!=="all"&&c).sort((a,b)=>(a[1].order||0)-(b[1].order||0));$("#category").innerHTML='<option value="">اختر القسم</option>'+cats.map(([id,c])=>`<option value="${esc(id)}">${esc(c.nameAr||id)}</option>`).join("");if(selected&&data.categories[selected])$("#category").value=selected}
function splitList(v){return String(v||"").split(",").map(x=>x.trim()).filter(Boolean)}
function productFromForm(f){
 const g=n=>f.elements[n];const id=g("id").value||crypto.randomUUID();
 const previous=data.products[id]||{};
 return {...previous,id,nameAr:g("nameAr").value.trim(),price:Number(g("price").value),oldPrice:g("oldPrice").value?Number(g("oldPrice").value):0,category:g("category").value,stock:Number(g("stock").value),descAr:g("descAr").value.trim(),active:g("active").checked,offer:g("offer").checked,images:savedImageUrl?[savedImageUrl]:[],imagePaths:[]};
}
function validateProduct(f){const g=n=>f.elements[n];if(!g("nameAr").value.trim())return "من فضلك اكتب اسم المنتج.";if(g("price").value===""||Number(g("price").value)<0)return "من فضلك اكتب سعرًا صحيحًا.";if(!g("category").value)return "من فضلك اختر القسم.";if(g("stock").value===""||!Number.isInteger(Number(g("stock").value))||Number(g("stock").value)<0)return "من فضلك اكتب كمية صحيحة.";if(!editingProductId&&!savedImageUrl&&!pendingFile)return "من فضلك اختر صورة المنتج.";if(!savedImageUrl&&!pendingFile)return "من فضلك اختر صورة المنتج.";const old=Number(g("oldPrice").value||0),price=Number(g("price").value);if(old>0&&old<price)return "السعر القديم يجب أن يكون أكبر من السعر الحالي.";return ""}
function showProductMessage(msg,type="success"){const el=$("#productMessage");el.className=`form-message ${type}-msg`;el.textContent=msg;el.classList.remove("hidden");if(type!=="loading")setTimeout(()=>el.classList.add("hidden"),3500)}
function clearPreview(){pendingFile=null;savedImageUrl="";$("#imagePreview").innerHTML="";$("#clearImagesBtn").classList.add("hidden");$("#productImages").value=""}
function renderPreview(){const url=savedImageUrl||(pendingFile?URL.createObjectURL(pendingFile):"");$("#imagePreview").innerHTML=url?`<div class="preview-item"><img src="${esc(url)}" alt="معاينة الصورة"><button type="button" class="preview-remove" id="removeImageBtn">×</button></div>`:"";$("#clearImagesBtn").classList.toggle("hidden",!url)}
function resetProductForm(keepCategory=true){const f=$("#productForm");f.reset();f.elements.id.value="";editingProductId=null;savedImageUrl="";pendingFile=null;$("#imagePreview").innerHTML="";$("#clearImagesBtn").classList.add("hidden");$("#productImages").value="";$("#productForm").classList.remove("hidden");renderCategoryOptions(keepCategory?lastCategory:"");$("#formTitle").textContent="إضافة منتج";$("#formSubtitle").textContent="أدخل البيانات الأساسية وارفع صورة واحدة بسهولة."}
function fillProduct(p){editingProductId=p.id;savedImageUrl=productImage(p);pendingFile=null;const f=$("#productForm");f.reset();f.classList.remove("hidden");f.elements.id.value=p.id;f.elements.nameAr.value=p.nameAr||"";f.elements.price.value=p.price??"";f.elements.oldPrice.value=p.oldPrice||"";f.elements.stock.value=p.stock??"";f.elements.descAr.value=p.descAr||"";f.elements.active.checked=p.active!==false;f.elements.offer.checked=!!p.offer;renderCategoryOptions(p.category);renderPreview();$("#formTitle").textContent="تعديل المنتج";$("#formSubtitle").textContent="عدّل البيانات ثم احفظ التغييرات.";window.scrollTo({top:$("#productForm").offsetTop-80,behavior:"smooth"})}
function prepareFile(file){if(!file)return;if(!file.type.startsWith("image/")){showProductMessage("❌ اختر ملف صورة فقط.","error");return}if(file.size>10*1024*1024){showProductMessage("❌ الصورة أكبر من 10 ميجابايت.","error");return}pendingFile=file;savedImageUrl="";renderPreview()}
async function uploadToCloudinary(file){const blob=await compressImage(file);const form=new FormData();form.append("file",blob,"product.jpg");form.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);form.append("folder","brand_marvel_products");const res=await fetch(CLOUDINARY_UPLOAD_URL,{method:"POST",body:form});const json=await res.json();if(!res.ok||!json.secure_url)throw new Error(json.error?.message||"Cloudinary upload failed");return json.secure_url}
async function compressImage(file){const bitmap=await createImageBitmap(file);const max=1600;const ratio=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const w=Math.max(1,Math.round(bitmap.width*ratio)),h=Math.max(1,Math.round(bitmap.height*ratio));const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(bitmap,0,0,w,h);bitmap.close();return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("compress")),"image/jpeg",.84))}
async function saveProduct(keepAdding=false){
 const f=$("#productForm"),err=validateProduct(f);if(err){showProductMessage("❌ "+err,"error");return}
 const btns=f.querySelectorAll("button");btns.forEach(b=>b.disabled=true);f.classList.add("busy");const id=f.elements.id.value||crypto.randomUUID();f.elements.id.value=id;
 try{
  if(pendingFile){showProductMessage("جاري رفع الصورة...","loading");savedImageUrl=await uploadToCloudinary(pendingFile);pendingFile=null;renderPreview()}
  const p=productFromForm(f);await set(ref(db,"products/"+id),p);lastCategory=p.category;data.products[id]=p;showProductMessage("✅ تم حفظ المنتج بنجاح","success");
  if(keepAdding){resetProductForm(true);showProductMessage("✅ تم الحفظ. أضف المنتج التالي.","success")}else{$("#productForm").classList.add("hidden");clearPreview()};renderAll()
 }catch(err){console.error(err);showProductMessage("❌ تعذر حفظ المنتج أو رفع الصورة. تأكد من الإنترنت وإعدادات Cloudinary.","error")}finally{btns.forEach(b=>b.disabled=false);f.classList.remove("busy")}
}
setPersistence(auth,browserLocalPersistence).catch(()=>{});
onAuthStateChanged(auth,async user=>{if(user){$("#loginPanel").classList.add("hidden");$("#dashboard").classList.remove("hidden");document.querySelectorAll("#dashboard .panel").forEach(x=>x.classList.add("hidden"));$("#productsPanel").classList.remove("hidden");try{await load()}catch(err){console.error(err);notice("تم تسجيل الدخول لكن تعذر قراءة قاعدة البيانات.")}}else{$("#loginPanel").classList.remove("hidden");$("#dashboard").classList.add("hidden")}});
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!firebaseReady)return notice("الموقع غير مربوط بـFirebase بعد.");notice("");try{await signInWithEmailAndPassword(auth,$("#email").value.trim(),$("#password").value)}catch(err){notice(firebaseError(err))}});
$("#logoutBtn").addEventListener("click",()=>signOut(auth));
$("#productSearch").addEventListener("input",renderProducts);
$("#chooseImageBtn").addEventListener("click",()=>$("#productImages").click());
$("#productImages").addEventListener("change",e=>prepareFile(e.target.files[0]));
$("#clearImagesBtn").addEventListener("click",clearPreview);
$("#saveAndNewBtn").addEventListener("click",()=>saveProduct(true));
document.addEventListener("click",async e=>{
 const nav=e.target.closest("[data-panel]");if(nav){document.querySelectorAll("#dashboard .panel").forEach(x=>x.classList.add("hidden"));$("#"+nav.dataset.panel+"Panel").classList.remove("hidden");document.querySelectorAll(".admin-nav button").forEach(b=>b.classList.remove("active"));nav.classList.add("active");return}
 if(e.target.id==="newProductBtn"){resetProductForm(true);return}
 if(e.target.id==="cancelProduct"){$("#productForm").classList.add("hidden");return}
 if(e.target.id==="removeImageBtn"){clearPreview();return}
 const edit=e.target.closest("[data-edit]");if(edit&&data.products[edit.dataset.edit]){fillProduct(data.products[edit.dataset.edit]);return}
 const del=e.target.closest("[data-del]");if(del){if(!confirm("هل أنت متأكد من حذف المنتج؟"))return;try{await remove(ref(db,"products/"+del.dataset.del));delete data.products[del.dataset.del];renderAll()}catch(err){console.error(err);alert("تعذر حذف المنتج.")};return}
 const cd=e.target.closest("[data-cat-del]");if(cd&&confirm("هل أنت متأكد من حذف هذا القسم؟")){try{await remove(ref(db,"categories/"+cd.dataset.catDel));await load()}catch(err){console.error(err)}}
});
$("#productForm").addEventListener("submit",e=>{e.preventDefault();saveProduct(false)});
$("#catForm").addEventListener("submit",async e=>{e.preventDefault();const f=e.target,id=f.id.value.trim();try{await set(ref(db,"categories/"+id),{nameAr:f.nameAr.value.trim(),nameEn:f.nameEn.value.trim(),order:Number(f.order.value||0),visible:true});f.reset();await load()}catch(err){console.error(err);alert("تعذر حفظ القسم.")}});
$("#shipForm").addEventListener("submit",async e=>{e.preventDefault();const f=e.target;try{await set(ref(db,"shipping/"+f.id.value.trim()),{name:f.name.value.trim(),price:Number(f.price.value),active:f.active.checked});f.reset();await load()}catch(err){console.error(err);alert("تعذر حفظ الشحن.")}});
$("#settingsForm").addEventListener("submit",async e=>{e.preventDefault();const o={};new FormData(e.target).forEach((v,k)=>o[k]=v);try{await update(ref(db,"settings"),o);await load();alert("تم حفظ الإعدادات") }catch(err){console.error(err);alert("تعذر حفظ الإعدادات.")}});
document.addEventListener("change",async e=>{if(e.target.dataset.status){try{await update(ref(db,"orders/"+e.target.dataset.status),{status:e.target.value});renderOrders()}catch(err){console.error(err)}}});

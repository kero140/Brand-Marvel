const phone="201286560161";
const products=[
 {id:1,name:"فستان أنيق",cat:"clothes",price:450,old:550,tag:"عرض",sizes:["S","M","L","XL"],colors:["أسود","بيج"],img:""},
 {id:2,name:"شنطة نسائية",cat:"accessories",price:350,old:400,tag:"",sizes:["موحد"],colors:["أسود","بيج"],img:""},
 {id:3,name:"طقم SHEIN",cat:"shein",price:600,old:700,tag:"SHEIN",sizes:["S","M","L"],colors:["وردي","أسود"],img:""},
 {id:4,name:"قطعة فورية",cat:"instant",price:280,old:0,tag:"متاح الآن",sizes:["M","L"],colors:["أبيض","أسود"],img:""}
];
let cart=[];
function render(list=products){
 const grid=document.getElementById("productGrid");
 document.getElementById("productCount").textContent=list.length+" منتجات";
 grid.innerHTML=list.map(p=>`<article class="product">
 <div class="product-img">${p.img?`<img src="${p.img}" alt="${p.name}">`:"صورة المنتج"}</div>
 <div class="product-body">
 ${p.tag?`<span class="tag">${p.tag}</span>`:""}
 <h3>${p.name}</h3>
 <div class="price">${p.price} جنيه ${p.old?`<span class="old">${p.old}</span>`:""}</div>
 <div class="options">
 <select id="size-${p.id}">${p.sizes.map(x=>`<option>${x}</option>`).join("")}</select>
 <select id="color-${p.id}">${p.colors.map(x=>`<option>${x}</option>`).join("")}</select>
 <input id="qty-${p.id}" type="number" min="1" value="1">
 </div>
 <button class="add" onclick="addToCart(${p.id})">أضف للسلة 🛍️</button>
 </div></article>`).join("");
}
function filterProducts(cat,btn){
 document.querySelectorAll(".categories button").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 render(cat==="all"?products:products.filter(p=>cat==="offers"?p.old>p.price:p.cat===cat));
}
function addToCart(id){
 const p=products.find(x=>x.id===id),size=document.getElementById("size-"+id).value,color=document.getElementById("color-"+id).value,qty=+document.getElementById("qty-"+id).value;
 cart.push({...p,size,color,qty});updateCart();openCart();
}
function updateCart(){
 document.getElementById("cartCount").textContent=cart.reduce((a,x)=>a+x.qty,0);
 document.getElementById("cartItems").innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-row"><b>${x.name}</b><br><small>المقاس: ${x.size} — اللون: ${x.color} — العدد: ${x.qty}</small><br>${x.price*x.qty} جنيه <button onclick="cart.splice(${i},1);updateCart()">حذف</button></div>`).join(""):"السلة فارغة";
 document.getElementById("cartTotal").textContent=cart.reduce((a,x)=>a+x.price*x.qty,0);
}
function openCart(){document.getElementById("cartModal").style.display="block";updateCart()}
function closeCart(){document.getElementById("cartModal").style.display="none"}
function checkout(){
 if(!cart.length)return alert("السلة فارغة");
 const name=document.getElementById("customerName").value.trim(),phoneCustomer=document.getElementById("customerPhone").value.trim(),address=document.getElementById("customerAddress").value.trim(),notes=document.getElementById("customerNotes").value.trim();
 if(!name||!phoneCustomer||!address)return alert("من فضلك اكتب الاسم ورقم الهاتف والعنوان");
 let msg="طلب جديد من Brand Marvel 🛍️%0A%0A";
 cart.forEach((x,i)=>msg+=`${i+1}) ${x.name}%0Aالمقاس: ${x.size}%0Aالشكل/اللون: ${x.color}%0Aالعدد: ${x.qty}%0Aالسعر: ${x.price*x.qty} جنيه%0A%0A`);
 msg+=`الإجمالي: ${cart.reduce((a,x)=>a+x.price*x.qty,0)} جنيه%0Aالاسم: ${name}%0Aرقم الهاتف: ${phoneCustomer}%0Aالعنوان: ${address}%0A${notes?"ملاحظات: "+notes:""}`;
 window.open(`https://wa.me/${phone}?text=${msg}`,"_blank");
}
render();
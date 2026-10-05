
// ⚠️ Remplacez par l'URL de votre Web App (doit finir par /exec)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzut1b1ABNY9L9jkSlMfGcmxV0CfEvhHDVnd03LwZ-vzmlZSfEr4RUC8nsX6MNxILuzEg/exec";

const groups=[
 {title:"Installations",items:["G-DEG","G-IAM","RTC-DEG","RTC-IAM"]},
 {title:"Dérangements",items:["FIXE","ADSL-IAM","GPON-IAM","GPON-DEG"]}
];
let counts={};try{counts=JSON.parse(localStorage.getItem("sit_counts")||"{}")}catch(e){}
const save=()=>{try{localStorage.setItem("sit_counts",JSON.stringify(counts))}catch(e){}};
const get=k=>counts[k]||0;
document.getElementById("date").textContent=new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
function render(){const app=document.getElementById("app");app.innerHTML="";groups.forEach(g=>{const total=g.items.reduce((s,n)=>s+get(g.title+"|"+n),0);const card=document.createElement("div");card.className="card";card.innerHTML=`<div class="card-h"><h2>${g.title}</h2><span class="total">Total ${total}</span></div>`;g.items.forEach(n=>{const k=g.title+"|"+n,v=get(k);const row=document.createElement("div");row.className="row";row.innerHTML=`<span class="name">${n}</span><button class="rb minus" aria-label="Moins">−</button><span class="num${v?" on":""}">${v}</span><button class="rb plus" aria-label="Plus">+</button>`;row.querySelector(".plus").onclick=()=>{counts[k]=get(k)+1;save();render()};row.querySelector(".minus").onclick=()=>{counts[k]=Math.max(0,get(k)-1);save();render()};card.appendChild(row)});app.appendChild(card)})}
function buildData(){let data={};groups.forEach(g=>g.items.forEach(n=>data[n]=get(g.title+"|"+n)));return data}
function buildText(){return groups.map(g=>g.title+"\n"+g.items.map(n=>{const sep=(n==="G-DEG"||n==="G-IAM")?": ":" : ";return n+sep+get(g.title+"|"+n)}).join("\n")).join("\n")}
function toast(m,ok=false){const t=document.getElementById("toast");t.textContent=m;t.style.color=ok?"#17843b":"var(--red)";setTimeout(()=>{t.textContent=""},4000)}
document.getElementById("copyBtn").onclick=async()=>{const text=buildText();try{await navigator.clipboard.writeText(text);toast("✓ Copié",true)}catch(e){const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("✓ Copié",true)}catch(_){toast("Échec de la copie")}ta.remove()}};
const modal=document.getElementById("loginModal");
document.getElementById("sendBtn").onclick=()=>{document.getElementById("username").value="";document.getElementById("password").value="";modal.classList.add("show");setTimeout(()=>document.getElementById("username").focus(),100)};
document.getElementById("cancelLogin").onclick=()=>modal.classList.remove("show");modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("show")});
document.getElementById("loginBtn").onclick=async()=>{
 const username=document.getElementById("username").value.trim();
 const password=document.getElementById("password").value;
 if(!username||!password){toast("Veuillez remplir les deux champs.");return}
 if(!GOOGLE_SCRIPT_URL||GOOGLE_SCRIPT_URL.includes("COLLEZ_ICI")){toast("URL Google Apps Script non configurée.");return}

 const btn=document.getElementById("loginBtn");btn.disabled=true;btn.textContent="Envoi...";

 // ✅ Form-urlencoded => Apps Script remplit e.parameter correctement
 const formBody = new URLSearchParams({
   action: "saveSituation",
   username: username,
   password: password,
   situation: JSON.stringify(buildData()),
   clientDate: new Date().toISOString()
 }).toString();

 try{
   const response = await fetch(GOOGLE_SCRIPT_URL, {
     method: "POST",
     headers: {"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
     body: formBody,
     redirect: "follow"
   });

   const raw = await response.text();
   let result;
   try { result = JSON.parse(raw); }
   catch(_) {
     console.error("Réponse non-JSON:", raw);
     toast("✗ Réponse invalide du serveur.");
     return;
   }

   if(result.success){
     modal.classList.remove("show");
     toast("✓ Situation envoyée avec succès",true);
   } else {
     toast("✗ " + (result.message || "Nom ou password incorrect."));
   }
 }catch(e){
   console.error(e);
   toast("✗ Impossible de contacter Google Sheets. Vérifiez l'URL et le déploiement.");
 }finally{
   btn.disabled=false;btn.textContent="Envoyer";
 }
};
document.getElementById("password").addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("loginBtn").click()});
const resetBtn=document.getElementById("resetBtn");let armTimer=null;function disarm(){resetBtn.classList.remove("armed");resetBtn.textContent="Remettre tout à zéro";clearTimeout(armTimer);armTimer=null}function doReset(){counts={};try{localStorage.removeItem("sit_counts")}catch(e){}save();render();disarm();toast("✓ Remis à zéro",true)}resetBtn.addEventListener("click",()=>{if(armTimer){doReset();return}resetBtn.classList.add("armed");resetBtn.textContent="Appuyer à nouveau pour confirmer";armTimer=setTimeout(disarm,3500)});
render();

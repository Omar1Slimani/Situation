const groups=[
  {title:"Installations",items:["G-DEG","G-IAM","RTC-DEG","RTC-IAM"]},
  {title:"Dérangements",items:["FIXE","ADSL-IAM","RTC-DEG","GPON-IAM","GPON-DEG"]}
];
let counts={};
try{counts=JSON.parse(localStorage.getItem("sit_counts")||"{}")}catch(e){}
const save=()=>{try{localStorage.setItem("sit_counts",JSON.stringify(counts))}catch(e){}};
const get=k=>counts[k]||0;
document.getElementById("date").textContent=new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

function render(){
  const app=document.getElementById("app");
  app.innerHTML="";
  groups.forEach(g=>{
    const total=g.items.reduce((s,n)=>s+get(g.title+"|"+n),0);
    const card=document.createElement("div");card.className="card";
    card.innerHTML=`<div class="card-h"><h2>${g.title}</h2><span class="total">Total ${total}</span></div>`;
    g.items.forEach(n=>{
      const k=g.title+"|"+n,v=get(k);
      const row=document.createElement("div");row.className="row";
      row.innerHTML=`<span class="name">${n}</span><button class="rb minus" aria-label="Moins">−</button><span class="num${v?" on":""}">${v}</span><button class="rb plus" aria-label="Plus">+</button>`;
      row.querySelector(".plus").onclick=()=>{counts[k]=get(k)+1;save();render()};
      row.querySelector(".minus").onclick=()=>{counts[k]=Math.max(0,get(k)-1);save();render()};
      card.appendChild(row);
    });
    app.appendChild(card);
  });
}

function buildText(){
  return groups.map(g=>g.title+"\n"+g.items.map(n=>{
    const sep=(n==="G-DEG"||n==="G-IAM")?": ":" : ";
    return n+sep+get(g.title+"|"+n);
  }).join("\n")).join("\n");
}
function toast(m){const t=document.getElementById("toast");t.textContent=m;setTimeout(()=>t.textContent="",2000)}

document.getElementById("copyBtn").onclick=async()=>{
  const text=buildText();
  try{await navigator.clipboard.writeText(text);toast("✓ Copié")}
  catch(e){
    const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();
    try{document.execCommand("copy");toast("✓ Copié")}catch(_){toast("Échec de la copie")}
    ta.remove();
  }
};
const resetBtn=document.getElementById("resetBtn");
let armTimer=null;
function disarm(){resetBtn.classList.remove("armed");resetBtn.textContent="Remettre tout à zéro";clearTimeout(armTimer);armTimer=null}
function doReset(){
  counts={};
  try{localStorage.removeItem("sit_counts")}catch(e){}
  save();render();disarm();toast("✓ Remis à zéro");
}
/* Confirmation en deux appuis (confirm() est bloqué sur beaucoup de mobiles) */
resetBtn.addEventListener("click",()=>{
  if(armTimer){doReset();return}
  resetBtn.classList.add("armed");
  resetBtn.textContent="Appuyer à nouveau pour confirmer";
  armTimer=setTimeout(disarm,3500);
});
render();
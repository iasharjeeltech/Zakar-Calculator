const TOLA=11.664, OZ=31.1035;
let GR=0, SR=0;

function inr(n){return 'Rs. '+Math.round(n).toLocaleString('en-IN');}
function toG(v,u){return u==='tola'?v*TOLA:u==='oz'?v*OZ:parseFloat(v)||0;}
function getU(id){return document.getElementById(id).textContent.trim();}

function setU(uid, unit, btn){
  document.getElementById(uid).textContent=unit;
  btn.closest('.unit-row').querySelectorAll('.ubtn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const base=uid.replace('-u','');
  if(base==='b-gold'||base==='b-silver') calcBasic();
  else if(base==='m-gold'||base==='m-silver') calcMixed();
  else calcFull();
}

function switchTab(name, btn){
  ['basic','mixed','full','info'].forEach(t=>{
    document.getElementById('tab-'+t).classList.add('hidden');
  });
  document.getElementById('tab-'+name).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function setNisabStatus(elId, state, title, desc){
  const el=document.getElementById(elId);
  el.className='nisab-status '+state;
  el.innerHTML=`<div class="ns-dot ${state}"></div><div class="ns-body ${state}"><div class="nt">${title}</div><div class="nd">${desc}</div></div>`;
}

// ── BASIC ──
function calcBasic(){
  const gv=parseFloat(document.getElementById('b-gold').value)||0;
  const sv=parseFloat(document.getElementById('b-silver').value)||0;
  const gg=toG(gv,getU('b-gold-u')), sg=toG(sv,getU('b-silver-u'));
  const gVal=gg*GR, sVal=sg*SR;
  const gZ=gVal*0.025, sZ=sVal*0.025, total=gZ+sZ;
  const silverNisabVal=52.5*TOLA*SR;
  const meetsG=gg>=7.5*TOLA, meetsS=sg>=52.5*TOLA;
  const meetsCombined=(gVal+sVal)>=silverNisabVal;
  const meets=meetsG||meetsS||meetsCombined;

  if(gv===0&&sv===0){
    setNisabStatus('b-nisab-status','wait','Wajan dalein...','Nisab check hoga.');
    document.getElementById('b-result').classList.add('hidden');
    return;
  }
  if(meets){
    setNisabStatus('b-nisab-status','pass','✅ Nisab Poora! Zakat Farz Hai.',
      `Silver nisab value = ${inr(silverNisabVal)} | Aapki wealth = ${inr(gVal+sVal)}`);
    document.getElementById('b-result').classList.remove('hidden');
    document.getElementById('b-total').textContent=inr(total);
    document.getElementById('b-sub').textContent=`Gold ${inr(gZ)}  +  Silver ${inr(sZ)}`;
    document.getElementById('b-gg').textContent=gg.toFixed(2)+'g';
    document.getElementById('b-gv').textContent=inr(gVal);
    document.getElementById('b-gz').textContent=inr(gZ);
    document.getElementById('b-sg').textContent=sg.toFixed(2)+'g';
    document.getElementById('b-sv').textContent=inr(sVal);
    document.getElementById('b-sz').textContent=inr(sZ);
  } else {
    setNisabStatus('b-nisab-status','fail','❌ Nisab Poora Nahi — Zakat Farz Nahi',
      `Silver nisab = ${inr(silverNisabVal)} | Aapki wealth = ${inr(gVal+sVal)} | Farq = ${inr(silverNisabVal-(gVal+sVal))} aur chahiye`);
    document.getElementById('b-result').classList.add('hidden');
  }
}

// ── MIXED (HANAFI TAQWEEN) ──
function calcMixed(){
  const gv=parseFloat(document.getElementById('m-gold').value)||0;
  const sv=parseFloat(document.getElementById('m-silver').value)||0;
  if(gv===0&&sv===0){ document.getElementById('m-steps').classList.add('hidden'); return; }
  const gg=toG(gv,getU('m-gold-u')), sg=toG(sv,getU('m-silver-u'));
  const gVal=gg*GR, sVal=sg*SR;
  const silverNisab=52.5*TOLA;
  const silverNisabVal=silverNisab*SR;
  const goldConvG=GR>0?gVal/SR:0;
  const goldConvT=goldConvG/TOLA;
  const totalChandi=sg+goldConvG;
  const totalChandiT=totalChandi/TOLA;
  const totalVal=gVal+sVal;
  const meetsNisab=totalVal>=silverNisabVal;
  const zakat=meetsNisab?totalVal*0.025:0;

  document.getElementById('m-steps').classList.remove('hidden');

  const steps=[
    {n:1,t:'Sona ki Rupee Value Nikalo',
     d:`${gg.toFixed(3)}g × Rs.${GR.toLocaleString('en-IN')}/g`,
     v:`= ${inr(gVal)}`,
     f:`${gg.toFixed(3)} × ${GR} = ${Math.round(gVal).toLocaleString('en-IN')}`},
    {n:2,t:'Chandi ki Rupee Value Nikalo',
     d:`${sg.toFixed(3)}g × Rs.${SR.toLocaleString('en-IN')}/g`,
     v:`= ${inr(sVal)}`,
     f:`${sg.toFixed(3)} × ${SR} = ${Math.round(sVal).toLocaleString('en-IN')}`},
    {n:3,t:'Sone ki Value → Chandi mein Convert Karo',
     d:`Sone ki value ÷ Chandi ka rate = Kitni chandi aayegi`,
     v:`${inr(gVal)} ÷ Rs.${SR}/g = ${goldConvG.toFixed(2)}g = ${goldConvT.toFixed(2)} tola chandi`,
     f:`${Math.round(gVal)} ÷ ${SR} = ${goldConvG.toFixed(2)}g`},
    {n:4,t:'Dono Chandi Jodo (Asli + Converted)',
     d:`Asli chandi + Gold se converted chandi`,
     v:`${sg.toFixed(2)}g (${(sg/TOLA).toFixed(2)} tola) + ${goldConvG.toFixed(2)}g (${goldConvT.toFixed(2)} tola) = ${totalChandi.toFixed(2)}g = ${totalChandiT.toFixed(2)} tola`,
     f:`${sg.toFixed(2)} + ${goldConvG.toFixed(2)} = ${totalChandi.toFixed(2)}g`},
    {n:5,t:'Silver Nisab se Compare Karo',
     d:`Nisab = 52.5 tola = 612.36g | Aapke paas = ${totalChandiT.toFixed(2)} tola`,
     v:totalChandiT>=52.5?`✅ ${totalChandiT.toFixed(2)} tola > 52.5 tola — NISAB POORA!`:`❌ ${totalChandiT.toFixed(2)} tola < 52.5 tola — Nisab poora nahi`,
     f:''},
    {n:6,t:'Zakat 2.5% Nikalo — Sirf Chandi ke Rate Par',
     d:`Total Value × 2.5% (kyunki chandi ka nisab use kiya)`,
     v:meetsNisab?`${inr(totalVal)} × 2.5% = ${inr(zakat)}`:`Nisab poora nahi — Zakat nahi`,
     f:meetsNisab?`${Math.round(totalVal).toLocaleString('en-IN')} × 0.025 = ${Math.round(zakat).toLocaleString('en-IN')}`:''}
  ];

  let html='';
  steps.forEach(s=>{
    html+=`<div class="step-item">
      <div class="step-num">${s.n}</div>
      <div class="step-body">
        <div class="st">${s.t}</div>
        <div class="sd">${s.d}</div>
        <div class="sv">${s.v}</div>
        ${s.f?`<span class="formula">${s.f}</span>`:''}
      </div>
    </div>`;
  });
  document.getElementById('m-steps-body').innerHTML=html;

  if(meetsNisab){
    setNisabStatus('m-nisab-status','pass','✅ Nisab Poora! Zakat Farz Hai.',
      `Total ${totalChandiT.toFixed(2)} tola chandi (converted) > 52.5 tola nisab`);
    document.getElementById('m-result-box').classList.remove('hidden');
    document.getElementById('m-total').textContent=inr(zakat);
    document.getElementById('m-sub').textContent=`Total wealth ${inr(totalVal)} × 2.5% = ${inr(zakat)}`;
  } else {
    setNisabStatus('m-nisab-status','fail','❌ Nisab Poora Nahi — Zakat Farz Nahi',
      `Total ${totalChandiT.toFixed(2)} tola chandi < 52.5 tola nisab. Aur ${(52.5-totalChandiT).toFixed(2)} tola chahiye.`);
    document.getElementById('m-result-box').classList.add('hidden');
  }
}

// ── FULL ZAKAT ──
function calcFull(){
  const gg=toG(parseFloat(document.getElementById('f-gold').value)||0, getU('f-gold-u'));
  const purity=parseFloat(document.getElementById('f-gold-purity').value)||1;
  const sg=toG(parseFloat(document.getElementById('f-silver').value)||0, getU('f-silver-u'));
  const cash=parseFloat(document.getElementById('f-cash').value)||0;
  const bank=parseFloat(document.getElementById('f-bank').value)||0;
  const biz=parseFloat(document.getElementById('f-biz').value)||0;
  const inv=parseFloat(document.getElementById('f-inv').value)||0;
  const debt=parseFloat(document.getElementById('f-debt').value)||0;

  const gVal=gg*GR*purity, sVal=sg*SR;
  const cashTotal=cash+bank, bizTotal=biz+inv;
  const grossWealth=gVal+sVal+cashTotal+bizTotal;
  const netWealth=Math.max(0,grossWealth-debt);
  const silverNisabVal=52.5*TOLA*SR;
  const meetsNisab=netWealth>=silverNisabVal;
  const zakat=meetsNisab?netWealth*0.025:0;

  if(grossWealth===0){
    setNisabStatus('f-nisab-status','wait','Assets dalein...','Aapki poori wealth calculate hogi.');
    document.getElementById('f-result').classList.add('hidden');
    return;
  }
  if(meetsNisab){
    setNisabStatus('f-nisab-status','pass','✅ Nisab Poora! Zakat Farz Hai.',
      `Net Wealth ${inr(netWealth)} ≥ Silver Nisab ${inr(silverNisabVal)}`);
    document.getElementById('f-result').classList.remove('hidden');
    document.getElementById('f-total').textContent=inr(zakat);
    document.getElementById('f-sub').textContent=`Net Wealth ${inr(netWealth)} × 2.5%`;

    const rows=[
      ['Asset','Value','Zakat (2.5%)'],
      [`Sona (${purity===1?'24K':purity===0.9167?'22K':purity===0.75?'18K':'14K'})`, inr(gVal), inr(gVal*0.025)],
      ['Chandi', inr(sVal), inr(sVal*0.025)],
      ['Cash + Bank', inr(cashTotal), inr(cashTotal*0.025)],
      ['Business + Investments', inr(bizTotal), inr(bizTotal*0.025)],
      ['<span style="color:#C62828">Minus Qarz</span>', `<span style="color:#C62828">- ${inr(debt)}</span>`, '—'],
      ['<strong>Net Wealth</strong>', `<strong>${inr(netWealth)}</strong>', '<strong style="color:var(--g2)">${inr(zakat)}</strong>`]
    ];
    let html='';
    rows.forEach((r,i)=>{
      if(i===0){html+=`<tr><th>${r[0]}</th><th>${r[1]}</th><th>${r[2]}</th></tr>`;}
      else{html+=`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`;}
    });
    document.getElementById('f-breakdown-table').innerHTML=html;
  } else {
    setNisabStatus('f-nisab-status','fail','❌ Nisab Poora Nahi — Zakat Farz Nahi',
      `Net Wealth ${inr(netWealth)} < Silver Nisab ${inr(silverNisabVal)}`);
    document.getElementById('f-result').classList.add('hidden');
  }
}

// ── FETCH RATES ──
async function fetchRates(){
  const dot=document.getElementById('sdot');
  const st=document.getElementById('stext');
  dot.className='sdot loading'; st.textContent='Live rates fetch ho rahi hain...';
  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:200,
        tools:[{type:'web_search_20250305',name:'web_search'}],
        messages:[{role:'user',content:'Current gold 24K and silver price per gram in Mumbai India today. Reply ONLY with JSON: {"gold24k":NUMBER,"silver":NUMBER,"date":"DD Mon YYYY"}. No other text.'}]
      })
    });
    const data=await resp.json();
    let txt='';
    for(const b of data.content){if(b.type==='text'){txt=b.text;break;}}
    txt=txt.replace(/```json|```/g,'').trim();
    const s=txt.indexOf('{'),e=txt.lastIndexOf('}');
    const rates=JSON.parse(txt.slice(s,e+1));
    GR=rates.gold24k; SR=rates.silver;
    document.getElementById('goldDisp').textContent='Rs.'+GR.toLocaleString('en-IN')+'/g';
    document.getElementById('silverDisp').textContent='Rs.'+SR.toLocaleString('en-IN')+'/g';
    dot.className='sdot'; st.textContent='Live rates — '+(rates.date||'Aaj');
    // Update nisab info tab
    document.getElementById('info-gold-nisab').textContent=inr(87.48*GR);
    document.getElementById('info-silver-nisab').textContent=inr(612.36*SR);
    calcBasic(); calcMixed(); calcFull();
  }catch(e){
    GR=15966; SR=275;
    document.getElementById('goldDisp').textContent='Rs.15,966/g';
    document.getElementById('silverDisp').textContent='Rs.275/g';
    dot.className='sdot error'; st.textContent='Fallback rates (15 Mar 2026)';
    document.getElementById('info-gold-nisab').textContent=inr(87.48*GR);
    document.getElementById('info-silver-nisab').textContent=inr(612.36*SR);
  }
}
fetchRates();
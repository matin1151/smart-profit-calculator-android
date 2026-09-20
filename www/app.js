const $=id=>document.getElementById(id);

const ids=[
  'product','currency','units','purchase','shipping','packaging','labor','other',
  'fixedMonthly','selling','platformFee','paymentFee','fixedFee','ads','tax','discount','targetMargin'
];

function num(id){
  const el=$(id);
  return el?Math.max(0,parseFloat(el.value)||0):0;
}

function money(n){
  return Number(n||0).toLocaleString('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:2})+' تومان';
}

function pct(n){
  return Number(n||0).toLocaleString('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:2})+'٪';
}

function modelFor(price,targetMarginOverride=null){
  const discount=num('discount')/100;
  const unitCost=num('purchase')+num('shipping')+num('packaging')+num('labor')+num('other');
  const discounted=price*(1-discount);
  const platform=num('platformFee')/100;
  const payment=num('paymentFee')/100;
  const taxRate=num('tax')/100;
  const fixed=num('fixedFee');
  const ads=num('ads');
  const target=targetMarginOverride===null?num('targetMargin')/100:targetMarginOverride;
  const variableRate=platform+payment+taxRate;
  const fixedOrder=fixed+ads;
  const fees=discounted*variableRate+fixedOrder;
  const net=discounted-fees;
  const profit=net-unitCost;
  const margin=discounted>0?profit/discounted*100:0;
  const denominator=(1-discount)*(1-variableRate-target);
  const recommended=denominator>0?(unitCost+fixedOrder)/denominator:Infinity;
  return {unitCost,discounted,fees,net,profit,margin,variableRate,fixedOrder,recommended};
}

function calc(){
  const units=Math.max(1,Math.floor(num('units')));
  const selling=num('selling');
  const current=modelFor(selling);
  const fixedMonthly=num('fixedMonthly');
  const target=num('targetMargin')/100;

  const breakEven=(current.unitCost+current.fixedOrder)/
    Math.max(.0001,(1-num('discount')/100)*(1-current.variableRate));

  const breakUnits=fixedMonthly>0&&current.profit>0?Math.ceil(fixedMonthly/current.profit):0;
  const monthlyProfit=current.profit*units;
  const monthlyRevenue=current.discounted*units;

  const recommendedModel=Number.isFinite(current.recommended)?modelFor(current.recommended):null;
  const recommendedMonthlyProfit=recommendedModel?recommendedModel.profit*units:0;

  $('cost').textContent=money(current.unitCost);
  $('netRevenue').textContent=money(current.net);
  $('profit').textContent=money(current.profit);
  $('margin').textContent=pct(current.margin);
  $('markup').textContent=current.unitCost>0?pct(current.profit/current.unitCost*100):'—';
  $('roi').textContent=current.unitCost>0?pct(current.profit/current.unitCost*100):'—';
  $('breakEven').textContent=money(breakEven);
  $('breakEvenUnits').textContent=breakUnits?breakUnits.toLocaleString('fa-IR'):'—';
  $('recommended').textContent=Number.isFinite(current.recommended)?money(current.recommended):'قابل محاسبه نیست';
  $('totalProfit').textContent=Number.isFinite(current.recommended)?money(recommendedMonthlyProfit):'قابل محاسبه نیست';
  $('grossSales').textContent=money(monthlyRevenue);
  $('fees').textContent=money(current.fees*units);
  $('taxAmount').textContent=money(current.discounted*(num('tax')/100)*units);
  $('variableCosts').textContent=money((current.unitCost+current.fees)*units);

  $('barValue').textContent=pct(current.margin);
  $('profitBar').style.width=Math.max(0,Math.min(100,current.margin))+'%';

  const st=$('status');
  if(current.profit<0){
    st.textContent='زیان‌ده';st.className='status negative';
    $('message').textContent='در این قیمت ضرر می‌کنید. قیمت را افزایش دهید یا هزینه‌ها را کاهش دهید.';
  }else if(current.margin<target*100){
    st.textContent='پایین‌تر از هدف';st.className='status warning';
    $('message').textContent='حاشیه سود فعلی شما پایین‌تر از هدف است. قیمت پیشنهادی: '+
      (Number.isFinite(current.recommended)?money(current.recommended):'قابل محاسبه نیست')+' برای هر واحد.';
  }else{
    st.textContent='سودده';st.className='status positive';
    $('message').textContent='قیمت فعلی شما به هدف حاشیه سود رسیده یا از آن عبور کرده است.';
  }

  $('fUnits').textContent=units.toLocaleString('fa-IR');
  $('fRevenue').textContent=money(monthlyRevenue);
  $('fProfit').textContent=money(monthlyProfit);
  $('fAnnual').textContent=money(monthlyProfit*12);
  $('forecastFill').style.width=Math.max(0,Math.min(100,current.margin))+'%';

  renderScenarios(selling);
  drawChart(selling);

  return {
    product:$('product').value.trim()||'محصول بدون نام',
    currency:'تومان',
    price:selling,
    cost:current.unitCost,
    profit:current.profit,
    margin:current.margin,
    monthlyProfit,
    units,
    fixedMonthly,
    recommended:Number.isFinite(current.recommended)?current.recommended:null,
    breakEven,
    breakUnits,
    monthlyRevenue,
    fees:current.fees*units,
    tax:current.discounted*(num('tax')/100)*units
  };
}

ids.forEach(id=>{
  const el=$(id);
  if(el)el.addEventListener('input',calc);
});
$('currency').addEventListener('change',calc);

$('reset').addEventListener('click',()=>{
  const d={product:'',currency:'تومان',units:100,purchase:20,shipping:5,packaging:2,labor:3,other:1,fixedMonthly:0,selling:49,platformFee:8,paymentFee:3,fixedFee:.30,ads:2,tax:5,discount:0,targetMargin:30};
  Object.entries(d).forEach(([k,v])=>{if($(k))$(k).value=v;});
  calc();
});

$('copy').addEventListener('click',async()=>{
  const r=calc();
  const text=`محاسبه‌گر هوشمند سود حرفه‌ای
محصول: ${r.product}
قیمت فروش: ${money(r.price)}
هزینه واقعی هر واحد: ${money(r.cost)}
سود خالص هر واحد: ${money(r.profit)}
حاشیه سود: ${pct(r.margin)}
قیمت سربه‌سر: ${money(r.breakEven)}
تعداد سربه‌سر: ${r.breakUnits?r.breakUnits.toLocaleString('fa-IR'):'—'}
قیمت پیشنهادی: ${r.recommended===null?'قابل محاسبه نیست':money(r.recommended)}
سود ماهانه: ${money(r.monthlyProfit)}`;
  try{
    await navigator.clipboard.writeText(text);
    $('copied').textContent='کپی شد!';
  }catch(e){
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');$('copied').textContent='کپی شد!';}catch(_){$('copied').textContent='متن را دستی کپی کنید.'}
    ta.remove();
  }
  setTimeout(()=>{$('copied').textContent='';},1800);
});

function loadSaved(){
  try{
    const v=JSON.parse(localStorage.getItem('sp_saved')||'[]');
    return Array.isArray(v)?v:[];
  }catch(e){return [];}
}

function renderSaved(){
  const data=loadSaved();
  const tb=$('compareTable').querySelector('tbody');
  const empty=$('savedEmpty');
  tb.innerHTML='';
  empty.style.display=data.length?'none':'block';
  data.forEach((r,i)=>{
    const tr=document.createElement('tr');
    const cells=[
      escapeHtml(r.product),money(r.price),money(r.cost),money(r.profit),pct(r.margin),money(r.monthlyProfit)
    ];
    cells.forEach((v,j)=>{
      const td=document.createElement('td');
      if(j===0){const strong=document.createElement('strong');strong.innerHTML=v;td.appendChild(strong);}
      else td.textContent=v;
      tr.appendChild(td);
    });
    const td=document.createElement('td');
    const b=document.createElement('button');b.className='delete';b.textContent='حذف';b.dataset.i=i;
    td.appendChild(b);tr.appendChild(td);tb.appendChild(tr);
  });
  tb.querySelectorAll('.delete').forEach(b=>b.onclick=()=>{
    const d=loadSaved();d.splice(Number(b.dataset.i),1);localStorage.setItem('sp_saved',JSON.stringify(d));renderSaved();
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

$('save').addEventListener('click',()=>{
  const r=calc();const d=loadSaved();d.push(r);localStorage.setItem('sp_saved',JSON.stringify(d));renderSaved();
  $('copied').textContent='ذخیره شد!';setTimeout(()=>{$('copied').textContent='';},1800);
});

function renderScenarios(currentPrice){
  const targets=[.20,.30,.40,.50];
  const current=modelFor(currentPrice);
  const be=(current.unitCost+current.fixedOrder)/Math.max(.0001,(1-num('discount')/100)*(1-current.variableRate));
  const items=[
    {name:'سربه‌سر',price:be,cls:'break'},
    ...targets.map(t=>{const m=modelFor(currentPrice,t);return{name:`هدف ${Math.round(t*100)}٪`,price:m.recommended,cls:''};}),
    {name:'قیمت فعلی',price:currentPrice,cls:'current'}
  ];
  const grid=$('scenarioGrid');grid.innerHTML='';
  items.forEach(x=>{
    const m=modelFor(x.price);const div=document.createElement('div');div.className='scenario '+x.cls;
    const s=document.createElement('span');s.textContent=x.name;
    const b=document.createElement('b');b.textContent=Number.isFinite(x.price)?money(x.price):'—';
    const sm=document.createElement('small');sm.textContent='قیمت فروش هر واحد';
    const p=document.createElement('div');p.className='profit';
    const ps=document.createElement('span');ps.textContent='سود خالص';
    const pb=document.createElement('b');pb.textContent=money(m.profit);
    p.append(ps,pb);div.append(s,b,sm,p);grid.appendChild(div);
  });
}

function drawChart(currentPrice){
  const canvas=$('profitChart');if(!canvas)return;
  const ctx=canvas.getContext('2d');const rect=canvas.getBoundingClientRect();const dpr=window.devicePixelRatio||1;
  const w=Math.max(300,rect.width),h=360;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const min=Math.max(0,currentPrice*.45),max=Math.max(min+1,currentPrice*1.65),points=42,vals=[];
  for(let i=0;i<points;i++){const p=min+(max-min)*i/(points-1);vals.push({p,profit:modelFor(p).profit});}
  const ys=vals.map(v=>v.profit),ymin=Math.min(...ys),ymax=Math.max(...ys),range=Math.max(1,ymax-ymin);
  const pad={l:58,r:18,t:18,b:40},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  ctx.clearRect(0,0,w,h);ctx.font='10px VazirmatnLocal,system-ui,sans-serif';ctx.lineWidth=1;ctx.strokeStyle='#e9edf3';ctx.fillStyle='#7d8797';
  for(let i=0;i<5;i++){const y=pad.t+ch*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillText(money(ymax-range*i/4),5,y+3);}
  ctx.strokeStyle='#bfc7d4';ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,pad.t+ch);ctx.lineTo(w-pad.r,pad.t+ch);ctx.stroke();
  const xy=v=>({x:pad.l+(v.p-min)/(max-min)*cw,y:pad.t+(ymax-v.profit)/range*ch});const pts=vals.map(xy);
  const grad=ctx.createLinearGradient(0,0,w,0);grad.addColorStop(0,'#15a9c7');grad.addColorStop(.55,'#356ae6');grad.addColorStop(1,'#7657e8');
  ctx.strokeStyle=grad;ctx.lineWidth=3;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();
  const zeroY=pad.t+(ymax-0)/range*ch;
  if(zeroY>=pad.t&&zeroY<=pad.t+ch){ctx.setLineDash([5,5]);ctx.strokeStyle='#d7dde7';ctx.beginPath();ctx.moveTo(pad.l,zeroY);ctx.lineTo(w-pad.r,zeroY);ctx.stroke();ctx.setLineDash([]);}
  const cur=xy({p:currentPrice,profit:modelFor(currentPrice).profit});ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cur.x,cur.y,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#356ae6';ctx.beginPath();ctx.arc(cur.x,cur.y,3.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#697486';ctx.fillText(money(min),pad.l,pad.t+ch+25);ctx.fillText(money(max),Math.max(pad.l,w-pad.r-100),pad.t+ch+25);
  $('chartRange').textContent=`${money(min)} ← ${money(max)}`;
}

function safeFileName(name){
  return String(name||'محصول').replace(/[\\/:*?"<>|]/g,'-').trim()||'محصول';
}

function base64ToUint8Array(base64){
  const binary=atob(base64),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}

async function saveNativeFile(filename,base64){
  const plugins=window.Capacitor?.Plugins;
  const fs=plugins?.Filesystem,share=plugins?.Share;
  if(!fs||!share)return false;
  try{
    const path=`smart-profit/${filename}`;
    await fs.writeFile({path,data:base64,directory:'CACHE',recursive:true});
    const uri=await fs.getUri({path,directory:'CACHE'});
    await share.share({title:filename,text:'فایل خروجی محاسبه‌گر سود هوشمند',files:[uri.uri],dialogTitle:'اشتراک‌گذاری فایل'});
    return true;
  }catch(e){console.warn('Native export failed; browser fallback used.',e);return false;}
}

function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function downloadExcel(){
  const r=calc();
  if(!window.XLSX){$('copied').textContent='کتابخانه اکسل در دسترس نیست.';setTimeout(()=>{$('copied').textContent='';},2000);return;}
  const rows=[
    ['محاسبه‌گر هوشمند سود حرفه‌ای',''],
    ['محصول',r.product],['واحد پول','تومان'],['قیمت فروش هر واحد',r.price],
    ['هزینه واقعی هر واحد',r.cost],['درآمد خالص هر واحد',r.price-r.fees/r.units],
    ['سود خالص هر واحد',r.profit],['حاشیه سود',r.margin/100],['قیمت سربه‌سر',r.breakEven],
    ['تعداد سربه‌سر',r.breakUnits],['قیمت فروش پیشنهادی',r.recommended??''],['تعداد فروش ماهانه',r.units],
    ['هزینه ثابت ماهانه',r.fixedMonthly],['سود ماهانه',r.monthlyProfit],['سود سالانه',r.monthlyProfit*12]
  ];
  const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=[{wch:34},{wch:25}];
  if(ws.B8)ws.B8.z='0.00%';
  ['B4','B5','B6','B7','B9','B10','B11','B13','B14','B15'].forEach(ref=>{if(ws[ref]&&typeof ws[ref].v==='number')ws[ref].z='#,##0.00';});
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'گزارش سود');
  const filename=`smart-profit-${safeFileName(r.product)}.xlsx`;
  try{
    const base64=XLSX.write(wb,{bookType:'xlsx',type:'base64',compression:true});
    const handled=await saveNativeFile(filename,base64);
    if(!handled)downloadBlob(new Blob([base64ToUint8Array(base64)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),filename);
    $('copied').textContent=handled?'فایل اکسل آماده و قابل اشتراک‌گذاری است!':'فایل اکسل آماده شد!';
  }catch(e){console.error(e);$('copied').textContent='ساخت فایل اکسل انجام نشد.';}
  setTimeout(()=>{$('copied').textContent='';},2200);
}

async function downloadImage(){
  const r=calc();
  if(document.fonts){try{await document.fonts.ready;}catch(e){}}
  const canvas=document.createElement('canvas'),width=1200,height=850;canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f8f5ef';ctx.fillRect(0,0,width,height);
  const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,'#172a53');gradient.addColorStop(1,'#493c9b');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,220);
  ctx.direction='rtl';ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font='800 38px VazirmatnLocal,Arial,sans-serif';ctx.fillText('محاسبه‌گر هوشمند سود حرفه‌ای',width-60,75);
  ctx.font='500 20px VazirmatnLocal,Arial,sans-serif';ctx.fillStyle='#d8def5';ctx.fillText(r.product,width-60,118);
  ctx.font='700 18px VazirmatnLocal,Arial,sans-serif';ctx.fillStyle='#cbd3ed';ctx.fillText('گزارش خلاصه قیمت‌گذاری',width-60,165);

  function roundedRect(x,y,w,h,radius){ctx.beginPath();ctx.moveTo(x+radius,y);ctx.lineTo(x+w-radius,y);ctx.quadraticCurveTo(x+w,y,x+w,y+radius);ctx.lineTo(x+w,y+h-radius);ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);ctx.lineTo(x+radius,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-radius);ctx.lineTo(x,y+radius);ctx.quadraticCurveTo(x,y,x+radius,y);ctx.closePath();}

  const cards=[
    ['قیمت فروش',money(r.price)],['هزینه واقعی',money(r.cost)],['سود هر واحد',money(r.profit)],
    ['حاشیه سود',pct(r.margin)],['قیمت پیشنهادی',r.recommended===null?'قابل محاسبه نیست':money(r.recommended)],['قیمت سربه‌سر',money(r.breakEven)]
  ];
  const cardWidth=345,cardHeight=145,gap=25,startX=60,startY=270;
  cards.forEach((card,index)=>{
    const col=index%3,row=Math.floor(index/3),x=startX+col*(cardWidth+gap),y=startY+row*(cardHeight+gap);
    roundedRect(x,y,cardWidth,cardHeight,18);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#e1e5ec';ctx.lineWidth=1;ctx.stroke();
    ctx.textAlign='right';ctx.direction='rtl';ctx.font='500 17px VazirmatnLocal,Arial,sans-serif';ctx.fillStyle='#7a8595';ctx.fillText(card[0],x+cardWidth-24,y+40);
    ctx.font='800 25px VazirmatnLocal,Arial,sans-serif';ctx.fillStyle='#162238';ctx.fillText(card[1],x+cardWidth-24,y+88);
  });
  roundedRect(60,655,1080,105,18);ctx.fillStyle='#eef3ff';ctx.fill();ctx.textAlign='right';ctx.direction='rtl';ctx.font='700 18px VazirmatnLocal,Arial,sans-serif';ctx.fillStyle='#46536a';ctx.fillText(`فروش ماهانه: ${r.units.toLocaleString('fa-IR')} واحد`,width-90,700);
  ctx.font='800 24px VazirmatnLocal,Arial,sans-serif';ctx.fillStyle='#176f53';ctx.fillText(`سود ماهانه: ${money(r.monthlyProfit)}`,width-90,738);

  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('خطا در ساخت تصویر');
  const reader=new FileReader(),base64=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.onerror=reject;reader.readAsDataURL(blob);});
  const filename=`smart-profit-${safeFileName(r.product)}.png`,handled=await saveNativeFile(filename,base64);
  if(!handled)downloadBlob(blob,filename);
  $('copied').textContent=handled?'تصویر آماده و قابل اشتراک‌گذاری است!':'تصویر آماده شد!';setTimeout(()=>{$('copied').textContent='';},2200);
}

$('excel').addEventListener('click',downloadExcel);
$('image').addEventListener('click',downloadImage);
window.addEventListener('resize',()=>drawChart(num('selling')));
calc();
renderSaved();

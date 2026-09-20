const $=id=>document.getElementById(id);
const ids=['product','currency','units','purchase','shipping','packaging','labor','other','selling','platformFee','paymentFee','fixedFee','ads','tax','discount','targetMargin'];
function num(id){return Math.max(0,parseFloat($(id).value)||0)}
function money(n){return Number(n).toLocaleString('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:2})+' تومان'}
function modelFor(price,targetMarginOverride=null){
 const units=Math.max(1,Math.floor(num('units'))),discount=num('discount')/100;
 const unitCost=num('purchase')+num('shipping')+num('packaging')+num('labor')+num('other');
 const discounted=price*(1-discount),platform=num('platformFee')/100,payment=num('paymentFee')/100,taxRate=num('tax')/100;
 const fixed=num('fixedFee'),ads=num('ads'),target=targetMarginOverride===null?num('targetMargin')/100:targetMarginOverride;
 const fees=discounted*(platform+payment+taxRate)+fixed+ads;
 const profit=discounted-fees-unitCost;
 const margin=discounted>0?profit/discounted*100:0;
 const variableRate=platform+payment+taxRate,fixedOrder=fixed+ads;
 const denominator=(1-variableRate)*(1-discount)-target;
 const recommended=denominator>0?(unitCost+fixedOrder)/denominator:Infinity;
 return {units,unitCost,discounted,fees,profit,margin,variableRate,fixedOrder,recommended};
}
function calc(){
 const units=Math.max(1,Math.floor(num('units'))),selling=num('selling'),discount=num('discount')/100;
 const unitCost=num('purchase')+num('shipping')+num('packaging')+num('labor')+num('other');
 const discounted=selling*(1-discount),platform=num('platformFee')/100,payment=num('paymentFee')/100,taxRate=num('tax')/100,target=num('targetMargin')/100;
 const fixed=num('fixedFee'),ads=num('ads'),platformFee=discounted*platform,paymentFee=discounted*payment+fixed,tax=discounted*taxRate;
 const fees=platformFee+paymentFee+ads+tax,net=discounted-fees,profit=net-unitCost,margin=discounted>0?profit/discounted*100:0,markup=unitCost>0?profit/unitCost*100:0;
 const variableRate=platform+payment+taxRate,fixedOrder=fixed+ads,be=(unitCost+fixedOrder)/Math.max(.0001,(1-variableRate)*(1-discount));
 const targetDen=(1-variableRate)*(1-discount)-target,recommended=targetDen>0?(unitCost+fixedOrder)/targetDen:Infinity;
 const breakUnits=profit>0?Math.ceil(fixedOrder/Math.max(profit,0.0001)):0,monthlyProfit=profit*units,monthlyRevenue=discounted*units;
 const recommendedModel=Number.isFinite(recommended)?modelFor(recommended):null;const recommendedProfit=recommendedModel?recommendedModel.profit:0;const recommendedMarkup=unitCost>0?recommendedProfit/unitCost*100:0;const recommendedMonthlyProfit=recommendedProfit*units;$('cost').textContent=money(unitCost);$('netRevenue').textContent=money(net);$('profit').textContent=money(profit);$('margin').textContent=margin.toLocaleString('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:2})+'٪';$('markup').textContent=Number.isFinite(recommended)?recommendedMarkup.toLocaleString('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:2})+'٪':'—';$('roi').textContent=Number.isFinite(recommended)?recommendedMarkup.toLocaleString('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:2})+'٪':'—';
 $('breakEven').textContent=money(be);$('breakEvenUnits').textContent=breakUnits?breakUnits.toLocaleString('fa-IR'):'—';$('recommended').textContent=Number.isFinite(recommended)?money(recommended):'قابل محاسبه نیست';
 $('totalProfit').textContent=Number.isFinite(recommended)?money(recommendedMonthlyProfit):'قابل محاسبه نیست';$('grossSales').textContent=money(monthlyRevenue);$('fees').textContent=money(fees*units);$('taxAmount').textContent=money(tax*units);$('variableCosts').textContent=money((unitCost+fees)*units);
 $('barValue').textContent=margin.toLocaleString('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:2})+'٪';$('profitBar').style.width=Math.max(0,Math.min(100,margin))+'%';
 const st=$('status');
 if(profit<0){st.textContent='زیان‌ده';st.className='status negative';$('message').textContent='در این قیمت ضرر می‌کنید. قیمت را افزایش دهید یا هزینه‌ها را کاهش دهید.'}
 else if(margin<target*100){st.textContent='پایین‌تر از هدف';st.className='status warning';$('message').textContent='حاشیه سود فعلی شما پایین‌تر از هدف است. قیمت پیشنهادی: '+(Number.isFinite(recommended)?money(recommended):'قابل محاسبه نیست')+' برای هر واحد.'}
 else{st.textContent='سودده';st.className='status positive';$('message').textContent='قیمت فعلی شما به هدف حاشیه سود رسیده یا از آن عبور کرده است.'}
 $('fUnits').textContent=units.toLocaleString('fa-IR');$('fRevenue').textContent=money(monthlyRevenue);$('fProfit').textContent=money(monthlyProfit);$('fAnnual').textContent=money(monthlyProfit*12);$('forecastFill').style.width=Math.max(0,Math.min(100,margin))+'%';
 renderScenarios(selling,unitCost,fixedOrder,variableRate,discount);drawChart(selling);
 return {product:$('product').value||'محصول بدون نام',currency:'تومان',price:selling,cost:unitCost,profit,margin,monthlyProfit,units};
}
ids.forEach(id=>$(id).addEventListener('input',calc));$('currency').addEventListener('change',calc);
$('reset').addEventListener('click',()=>{const d={product:'',currency:'تومان',units:100,purchase:20,shipping:5,packaging:2,labor:3,other:1,selling:49,platformFee:8,paymentFee:3,fixedFee:.30,ads:2,tax:5,discount:0,targetMargin:30};Object.entries(d).forEach(([k,v])=>$(k).value=v);calc()});
$('copy').addEventListener('click',async()=>{const r=calc();const text=`محاسبه‌گر هوشمند سود حرفه‌ای\nمحصول: ${r.product}\nقیمت فروش: ${money(r.price)}\nهزینه واقعی هر واحد: ${money(r.cost)}\nسود خالص هر واحد: ${money(r.profit)}\nحاشیه سود: ${r.margin.toLocaleString('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:2})}٪\nقیمت سربه‌سر: ${$('breakEven').textContent}\nقیمت پیشنهادی: ${$('recommended').textContent}\nسود ماهانه: ${money(r.monthlyProfit)}`;try{await navigator.clipboard.writeText(text);$('copied').textContent='کپی شد!';setTimeout(()=>$('copied').textContent='',1800)}catch(e){$('copied').textContent='متن را دستی کپی کنید.'}});
$('pdf').addEventListener('click',()=>{calc();window.print()});
function loadSaved(){return JSON.parse(localStorage.getItem('sp_saved')||'[]')}
function renderSaved(){const data=loadSaved(),tb=$('compareTable').querySelector('tbody'),empty=$('savedEmpty');tb.innerHTML='';empty.style.display=data.length?'none':'block';data.forEach((r,i)=>{const tr=document.createElement('tr');tr.innerHTML=`<td><strong>${escapeHtml(r.product)}</strong></td><td>${money(r.price)}</td><td>${money(r.cost)}</td><td>${money(r.profit)}</td><td>${Number(r.margin).toLocaleString('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:2})}٪</td><td>${money(r.monthlyProfit)}</td><td><button class="delete" data-i="${i}">حذف</button></td>`;tb.appendChild(tr)});tb.querySelectorAll('.delete').forEach(b=>b.onclick=()=>{const d=loadSaved();d.splice(Number(b.dataset.i),1);localStorage.setItem('sp_saved',JSON.stringify(d));renderSaved()})}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
$('save').addEventListener('click',()=>{const r=calc(),d=loadSaved();d.push(r);localStorage.setItem('sp_saved',JSON.stringify(d));renderSaved();$('copied').textContent='ذخیره شد!';setTimeout(()=>$('copied').textContent='',1800)});
function renderScenarios(currentPrice,unitCost,fixedOrder,variableRate,discount){
 const targets=[0.20,0.30,0.40,0.50],current=modelFor(currentPrice),be=(unitCost+fixedOrder)/Math.max(.0001,(1-variableRate)*(1-discount));
 const items=[{name:'سربه‌سر',price:be,cls:'break'},...targets.map(t=>{const m=modelFor(currentPrice,t);return {name:`هدف ${Math.round(t*100)}٪`,price:m.recommended,cls:''}})];items.push({name:'قیمت فعلی',price:currentPrice,cls:'current'});
 const grid=$('scenarioGrid');grid.innerHTML='';items.forEach(x=>{const m=modelFor(x.price),div=document.createElement('div');div.className='scenario '+x.cls;div.innerHTML=`<span>${x.name}</span><b>${Number.isFinite(x.price)?money(x.price):'—'}</b><small>قیمت فروش هر واحد</small><div class="profit"><span>سود خالص</span><b>${money(m.profit)}</b></div>`;grid.appendChild(div)});
}
function drawChart(currentPrice){
 const canvas=$('profitChart');if(!canvas)return;const ctx=canvas.getContext('2d'),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(300,rect.width),h=360;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const min=Math.max(0,currentPrice*.45),max=Math.max(min+1,currentPrice*1.65),points=42,vals=[];for(let i=0;i<points;i++){const p=min+(max-min)*i/(points-1);vals.push({p,profit:modelFor(p).profit})}
 const ys=vals.map(v=>v.profit),ymin=Math.min(...ys),ymax=Math.max(...ys),range=Math.max(1,ymax-ymin),pad={l:58,r:18,t:18,b:40},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
 ctx.clearRect(0,0,w,h);ctx.font='10px Vazirmatn, system-ui, sans-serif';ctx.lineWidth=1;ctx.strokeStyle='#e9edf3';ctx.fillStyle='#7d8797';
 for(let i=0;i<5;i++){const y=pad.t+ch*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();const val=ymax-range*i/4;ctx.fillText(money(val),5,y+3)}
 ctx.strokeStyle='#bfc7d4';ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,pad.t+ch);ctx.lineTo(w-pad.r,pad.t+ch);ctx.stroke();
 const xy=v=>({x:pad.l+(v.p-min)/(max-min)*cw,y:pad.t+(ymax-v.profit)/range*ch}),pts=vals.map(xy);const grad=ctx.createLinearGradient(0,0,w,0);grad.addColorStop(0,'#15a9c7');grad.addColorStop(.55,'#356ae6');grad.addColorStop(1,'#7657e8');ctx.strokeStyle=grad;ctx.lineWidth=3;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();
 const zeroY=pad.t+(ymax-0)/range*ch;if(zeroY>=pad.t&&zeroY<=pad.t+ch){ctx.setLineDash([5,5]);ctx.strokeStyle='#d7dde7';ctx.beginPath();ctx.moveTo(pad.l,zeroY);ctx.lineTo(w-pad.r,zeroY);ctx.stroke();ctx.setLineDash([])}
 const cur=xy({p:currentPrice,profit:modelFor(currentPrice).profit});ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cur.x,cur.y,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#356ae6';ctx.beginPath();ctx.arc(cur.x,cur.y,3.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#697486';ctx.fillText(money(min),pad.l,pad.t+ch+25);ctx.fillText(money(max),Math.max(pad.l,w-pad.r-100),pad.t+ch+25);$('chartRange').textContent=`${money(min)} ← ${money(max)}`;
}
window.addEventListener('resize',()=>drawChart(num('selling')));calc();renderSaved();

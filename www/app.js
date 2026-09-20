const $=id=>document.getElementById(id);

const ids=[
  'product',
  'currency',
  'units',
  'purchase',
  'shipping',
  'packaging',
  'labor',
  'other',
  'selling',
  'platformFee',
  'paymentFee',
  'fixedFee',
  'ads',
  'tax',
  'discount',
  'targetMargin'
];

function num(id){
  return Math.max(0,parseFloat($(id).value)||0);
}

function money(n){
  return Number(n).toLocaleString('fa-IR',{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  })+' تومان';
}

function modelFor(price,targetMarginOverride=null){

  const units=Math.max(1,Math.floor(num('units')));
  const discount=num('discount')/100;

  const unitCost=
    num('purchase')+
    num('shipping')+
    num('packaging')+
    num('labor')+
    num('other');

  const discounted=price*(1-discount);

  const platform=num('platformFee')/100;
  const payment=num('paymentFee')/100;
  const taxRate=num('tax')/100;

  const fixed=num('fixedFee');
  const ads=num('ads');

  const target=
    targetMarginOverride===null
      ? num('targetMargin')/100
      : targetMarginOverride;

  const fees=
    discounted*(platform+payment+taxRate)+
    fixed+
    ads;

  const profit=discounted-fees-unitCost;

  const margin=
    discounted>0
      ? profit/discounted*100
      : 0;

  const variableRate=
    platform+
    payment+
    taxRate;

  const fixedOrder=
    fixed+
    ads;

  const denominator=
    (1-variableRate)*(1-discount)-target;

  const recommended=
    denominator>0
      ? (unitCost+fixedOrder)/denominator
      : Infinity;

  return {
    units,
    unitCost,
    discounted,
    fees,
    profit,
    margin,
    variableRate,
    fixedOrder,
    recommended
  };
}


function calc(){

  const units=Math.max(1,Math.floor(num('units')));
  const selling=num('selling');
  const discount=num('discount')/100;

  const unitCost=
    num('purchase')+
    num('shipping')+
    num('packaging')+
    num('labor')+
    num('other');

  const discounted=selling*(1-discount);

  const platform=num('platformFee')/100;
  const payment=num('paymentFee')/100;
  const taxRate=num('tax')/100;
  const target=num('targetMargin')/100;

  const fixed=num('fixedFee');
  const ads=num('ads');

  const platformFee=discounted*platform;
  const paymentFee=discounted*payment+fixed;
  const tax=discounted*taxRate;

  const fees=
    platformFee+
    paymentFee+
    ads+
    tax;

  const net=discounted-fees;

  const profit=net-unitCost;

  const margin=
    discounted>0
      ? profit/discounted*100
      : 0;

  const markup=
    unitCost>0
      ? profit/unitCost*100
      : 0;

  const variableRate=
    platform+
    payment+
    taxRate;

  const fixedOrder=
    fixed+
    ads;

  const be=
    (unitCost+fixedOrder)/
    Math.max(
      .0001,
      (1-variableRate)*(1-discount)
    );

  const targetDen=
    (1-variableRate)*(1-discount)-target;

  const recommended=
    targetDen>0
      ? (unitCost+fixedOrder)/targetDen
      : Infinity;

  const breakUnits=
    profit>0
      ? Math.ceil(
          fixedOrder/
          Math.max(profit,0.0001)
        )
      : 0;

  const monthlyProfit=
    profit*units;

  const monthlyRevenue=
    discounted*units;


  const recommendedModel=
    Number.isFinite(recommended)
      ? modelFor(recommended)
      : null;

  const recommendedProfit=
    recommendedModel
      ? recommendedModel.profit
      : 0;

  const recommendedMarkup=
    unitCost>0
      ? recommendedProfit/unitCost*100
      : 0;

  const recommendedMonthlyProfit=
    recommendedProfit*units;


  $('cost').textContent=money(unitCost);

  $('netRevenue').textContent=money(net);

  $('profit').textContent=money(profit);

  $('margin').textContent=
    margin.toLocaleString('fa-IR',{
      minimumFractionDigits:2,
      maximumFractionDigits:2
    })+'٪';

  $('markup').textContent=
    Number.isFinite(recommended)
      ? recommendedMarkup.toLocaleString('fa-IR',{
          minimumFractionDigits:2,
          maximumFractionDigits:2
        })+'٪'
      : '—';

  $('roi').textContent=
    Number.isFinite(recommended)
      ? recommendedMarkup.toLocaleString('fa-IR',{
          minimumFractionDigits:2,
          maximumFractionDigits:2
        })+'٪'
      : '—';

  $('breakEven').textContent=money(be);

  $('breakEvenUnits').textContent=
    breakUnits
      ? breakUnits.toLocaleString('fa-IR')
      : '—';

  $('recommended').textContent=
    Number.isFinite(recommended)
      ? money(recommended)
      : 'قابل محاسبه نیست';

  $('totalProfit').textContent=
    Number.isFinite(recommended)
      ? money(recommendedMonthlyProfit)
      : 'قابل محاسبه نیست';

  $('grossSales').textContent=
    money(monthlyRevenue);

  $('fees').textContent=
    money(fees*units);

  $('taxAmount').textContent=
    money(tax*units);

  $('variableCosts').textContent=
    money((unitCost+fees)*units);


  $('barValue').textContent=
    margin.toLocaleString('fa-IR',{
      minimumFractionDigits:2,
      maximumFractionDigits:2
    })+'٪';

  $('profitBar').style.width=
    Math.max(
      0,
      Math.min(100,margin)
    )+'%';


  const st=$('status');

  if(profit<0){

    st.textContent='زیان‌ده';
    st.className='status negative';

    $('message').textContent=
      'در این قیمت ضرر می‌کنید. قیمت را افزایش دهید یا هزینه‌ها را کاهش دهید.';

  }else if(margin<target*100){

    st.textContent='پایین‌تر از هدف';
    st.className='status warning';

    $('message').textContent=
      'حاشیه سود فعلی شما پایین‌تر از هدف است. قیمت پیشنهادی: '+
      (
        Number.isFinite(recommended)
          ? money(recommended)
          : 'قابل محاسبه نیست'
      )+
      ' برای هر واحد.';

  }else{

    st.textContent='سودده';
    st.className='status positive';

    $('message').textContent=
      'قیمت فعلی شما به هدف حاشیه سود رسیده یا از آن عبور کرده است.';

  }


  $('fUnits').textContent=
    units.toLocaleString('fa-IR');

  $('fRevenue').textContent=
    money(monthlyRevenue);

  $('fProfit').textContent=
    money(monthlyProfit);

  $('fAnnual').textContent=
    money(monthlyProfit*12);

  $('forecastFill').style.width=
    Math.max(
      0,
      Math.min(100,margin)
    )+'%';


  renderScenarios(
    selling,
    unitCost,
    fixedOrder,
    variableRate,
    discount
  );

  drawChart(selling);


  return {
    product:$('product').value||'محصول بدون نام',
    currency:'تومان',
    price:selling,
    cost:unitCost,
    profit,
    margin,
    monthlyProfit,
    units
  };
}


ids.forEach(id=>{
  $(id).addEventListener('input',calc);
});

$('currency').addEventListener('change',calc);


$('reset').addEventListener('click',()=>{

  const d={
    product:'',
    currency:'تومان',
    units:100,
    purchase:20,
    shipping:5,
    packaging:2,
    labor:3,
    other:1,
    selling:49,
    platformFee:8,
    paymentFee:3,
    fixedFee:.30,
    ads:2,
    tax:5,
    discount:0,
    targetMargin:30
  };

  Object.entries(d).forEach(([k,v])=>{
    $(k).value=v;
  });

  calc();
});


$('copy').addEventListener('click',async()=>{

  const r=calc();

  const text=
`محاسبه‌گر هوشمند سود حرفه‌ای
محصول: ${r.product}
قیمت فروش: ${money(r.price)}
هزینه واقعی هر واحد: ${money(r.cost)}
سود خالص هر واحد: ${money(r.profit)}
حاشیه سود: ${r.margin.toLocaleString('fa-IR',{
  minimumFractionDigits:2,
  maximumFractionDigits:2
})}٪
قیمت سربه‌سر: ${$('breakEven').textContent}
قیمت پیشنهادی: ${$('recommended').textContent}
سود ماهانه: ${money(r.monthlyProfit)}`;

  try{

    await navigator.clipboard.writeText(text);

    $('copied').textContent='کپی شد!';

    setTimeout(()=>{
      $('copied').textContent='';
    },1800);

  }catch(e){

    $('copied').textContent='متن را دستی کپی کنید.';

  }

});


function loadSaved(){

  return JSON.parse(
    localStorage.getItem('sp_saved')||'[]'
  );

}


function renderSaved(){

  const data=loadSaved();

  const tb=
    $('compareTable').querySelector('tbody');

  const empty=$('savedEmpty');

  tb.innerHTML='';

  empty.style.display=
    data.length
      ? 'none'
      : 'block';


  data.forEach((r,i)=>{

    const tr=document.createElement('tr');

    tr.innerHTML=
      `<td><strong>${escapeHtml(r.product)}</strong></td>
       <td>${money(r.price)}</td>
       <td>${money(r.cost)}</td>
       <td>${money(r.profit)}</td>
       <td>${Number(r.margin).toLocaleString('fa-IR',{
         minimumFractionDigits:2,
         maximumFractionDigits:2
       })}٪</td>
       <td>${money(r.monthlyProfit)}</td>
       <td>
         <button class="delete" data-i="${i}">
           حذف
         </button>
       </td>`;

    tb.appendChild(tr);

  });


  tb.querySelectorAll('.delete').forEach(b=>{

    b.onclick=()=>{

      const d=loadSaved();

      d.splice(
        Number(b.dataset.i),
        1
      );

      localStorage.setItem(
        'sp_saved',
        JSON.stringify(d)
      );

      renderSaved();

    };

  });

}


function escapeHtml(s){

  return String(s).replace(
    /[&<>"']/g,
    m=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m])
  );

}


$('save').addEventListener('click',()=>{

  const r=calc();

  const d=loadSaved();

  d.push(r);

  localStorage.setItem(
    'sp_saved',
    JSON.stringify(d)
  );

  renderSaved();

  $('copied').textContent='ذخیره شد!';

  setTimeout(()=>{
    $('copied').textContent='';
  },1800);

});


function renderScenarios(
  currentPrice,
  unitCost,
  fixedOrder,
  variableRate,
  discount
){

  const targets=[
    0.20,
    0.30,
    0.40,
    0.50
  ];

  const current=
    modelFor(currentPrice);

  const be=
    (unitCost+fixedOrder)/
    Math.max(
      .0001,
      (1-variableRate)*(1-discount)
    );


  const items=[
    {
      name:'سربه‌سر',
      price:be,
      cls:'break'
    },

    ...targets.map(t=>{

      const m=
        modelFor(
          currentPrice,
          t
        );

      return {
        name:`هدف ${Math.round(t*100)}٪`,
        price:m.recommended,
        cls:''
      };

    }),

    {
      name:'قیمت فعلی',
      price:currentPrice,
      cls:'current'
    }
  ];


  const grid=$('scenarioGrid');

  grid.innerHTML='';


  items.forEach(x=>{

    const m=
      modelFor(x.price);

    const div=
      document.createElement('div');

    div.className=
      'scenario '+x.cls;

    div.innerHTML=
      `<span>${x.name}</span>
       <b>${Number.isFinite(x.price)?money(x.price):'—'}</b>
       <small>قیمت فروش هر واحد</small>
       <div class="profit">
         <span>سود خالص</span>
         <b>${money(m.profit)}</b>
       </div>`;

    grid.appendChild(div);

  });

}


function drawChart(currentPrice){

  const canvas=$('profitChart');

  if(!canvas)return;

  const ctx=
    canvas.getContext('2d');

  const rect=
    canvas.getBoundingClientRect();

  const dpr=
    window.devicePixelRatio||1;

  const w=
    Math.max(300,rect.width);

  const h=360;

  canvas.width=w*dpr;
  canvas.height=h*dpr;

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  const min=
    Math.max(
      0,
      currentPrice*.45
    );

  const max=
    Math.max(
      min+1,
      currentPrice*1.65
    );

  const points=42;

  const vals=[];


  for(let i=0;i<points;i++){

    const p=
      min+
      (max-min)*i/(points-1);

    vals.push({
      p,
      profit:modelFor(p).profit
    });

  }


  const ys=
    vals.map(v=>v.profit);

  const ymin=
    Math.min(...ys);

  const ymax=
    Math.max(...ys);

  const range=
    Math.max(
      1,
      ymax-ymin
    );


  const pad={
    l:58,
    r:18,
    t:18,
    b:40
  };

  const cw=
    w-pad.l-pad.r;

  const ch=
    h-pad.t-pad.b;


  ctx.clearRect(
    0,
    0,
    w,
    h
  );


  ctx.font=
    '10px VazirmatnLocal, system-ui, sans-serif';

  ctx.lineWidth=1;

  ctx.strokeStyle='#e9edf3';

  ctx.fillStyle='#7d8797';


  for(let i=0;i<5;i++){

    const y=
      pad.t+
      ch*i/4;

    ctx.beginPath();

    ctx.moveTo(
      pad.l,
      y
    );

    ctx.lineTo(
      w-pad.r,
      y
    );

    ctx.stroke();


    const val=
      ymax-
      range*i/4;

    ctx.fillText(
      money(val),
      5,
      y+3
    );

  }


  ctx.strokeStyle='#bfc7d4';

  ctx.beginPath();

  ctx.moveTo(
    pad.l,
    pad.t
  );

  ctx.lineTo(
    pad.l,
    pad.t+ch
  );

  ctx.lineTo(
    w-pad.r,
    pad.t+ch
  );

  ctx.stroke();


  const xy=v=>({

    x:
      pad.l+
      (v.p-min)/(max-min)*cw,

    y:
      pad.t+
      (ymax-v.profit)/range*ch

  });


  const pts=
    vals.map(xy);


  const grad=
    ctx.createLinearGradient(
      0,
      0,
      w,
      0
    );

  grad.addColorStop(
    0,
    '#15a9c7'
  );

  grad.addColorStop(
    .55,
    '#356ae6'
  );

  grad.addColorStop(
    1,
    '#7657e8'
  );


  ctx.strokeStyle=grad;

  ctx.lineWidth=3;

  ctx.beginPath();


  pts.forEach((q,i)=>{

    if(i){
      ctx.lineTo(
        q.x,
        q.y
      );
    }else{
      ctx.moveTo(
        q.x,
        q.y
      );
    }

  });


  ctx.stroke();


  const zeroY=
    pad.t+
    (ymax-0)/range*ch;


  if(
    zeroY>=pad.t &&
    zeroY<=pad.t+ch
  ){

    ctx.setLineDash([
      5,
      5
    ]);

    ctx.strokeStyle='#d7dde7';

    ctx.beginPath();

    ctx.moveTo(
      pad.l,
      zeroY
    );

    ctx.lineTo(
      w-pad.r,
      zeroY
    );

    ctx.stroke();

    ctx.setLineDash([]);

  }


  const cur=
    xy({
      p:currentPrice,
      profit:modelFor(currentPrice).profit
    });


  ctx.fillStyle='#fff';

  ctx.beginPath();

  ctx.arc(
    cur.x,
    cur.y,
    6,
    0,
    Math.PI*2
  );

  ctx.fill();


  ctx.fillStyle='#356ae6';

  ctx.beginPath();

  ctx.arc(
    cur.x,
    cur.y,
    3.5,
    0,
    Math.PI*2
  );

  ctx.fill();


  ctx.fillStyle='#697486';

  ctx.fillText(
    money(min),
    pad.l,
    pad.t+ch+25
  );

  ctx.fillText(
    money(max),
    Math.max(
      pad.l,
      w-pad.r-100
    ),
    pad.t+ch+25
  );


  $('chartRange').textContent=
    `${money(min)} ← ${money(max)}`;

}


function downloadBlob(
  blob,
  filename
){

  const url=
    URL.createObjectURL(blob);

  const a=
    document.createElement('a');

  a.href=url;

  a.download=filename;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(()=>{
    URL.revokeObjectURL(url);
  },1000);

}


function safeFileName(name){

  return String(name||'محصول')
    .replace(/[\\/:*?"<>|]/g,'-')
    .trim()||'محصول';

}


function downloadExcel(){

  const r=calc();

  const product=
    escapeHtml(r.product);

  const rows=[
    ['محاسبه‌گر هوشمند سود حرفه‌ای',''],
    ['محصول',product],
    ['قیمت فروش هر واحد',r.price],
    ['هزینه واقعی هر واحد',r.cost],
    ['سود خالص هر واحد',r.profit],
    ['حاشیه سود',r.margin.toFixed(2)+'%'],
    ['قیمت سربه‌سر',$('breakEven').textContent],
    ['قیمت فروش پیشنهادی',$('recommended').textContent],
    ['تعداد فروش ماهانه',r.units],
    ['سود ماهانه',r.monthlyProfit],
    ['سود سالانه',r.monthlyProfit*12]
  ];


  const table=
    `<table border="1" dir="rtl">
      <tr>
        <th>عنوان</th>
        <th>مقدار</th>
      </tr>
      ${
        rows.map(row=>
          `<tr>
            <td>${row[0]}</td>
            <td>${row[1]}</td>
          </tr>`
        ).join('')
      }
    </table>`;


  const html=
    `<!doctype html>
     <html lang="fa" dir="rtl">
     <head>
       <meta charset="utf-8">
       <style>
         body{
           font-family:Arial,sans-serif;
           direction:rtl;
         }
         table{
           border-collapse:collapse;
           width:100%;
         }
         th,td{
           padding:8px;
           border:1px solid #ccc;
         }
         th{
           background:#eef2ff;
         }
       </style>
     </head>
     <body>${table}</body>
     </html>`;


  const blob=
    new Blob(
      ['\ufeff',html],
      {
        type:'application/vnd.ms-excel;charset=utf-8'
      }
    );


  downloadBlob(
    blob,
    `smart-profit-${safeFileName(r.product)}.xls`
  );


  $('copied').textContent=
    'فایل اکسل آماده شد!';

  setTimeout(()=>{
    $('copied').textContent='';
  },1800);

}


async function downloadImage(){

  const r=calc();

  try{

    if(document.fonts){
      await document.fonts.ready;
    }

  }catch(e){}


  const canvas=
    document.createElement('canvas');

  const width=1200;
  const height=850;

  canvas.width=width;
  canvas.height=height;


  const ctx=
    canvas.getContext('2d');


  ctx.fillStyle='#f8f5ef';

  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  const gradient=
    ctx.createLinearGradient(
      0,
      0,
      width,
      height
    );

  gradient.addColorStop(
    0,
    '#172a53'
  );

  gradient.addColorStop(
    1,
    '#493c9b'
  );


  ctx.fillStyle=gradient;

  ctx.fillRect(
    0,
    0,
    width,
    220
  );


  ctx.direction='rtl';

  ctx.textAlign='right';

  ctx.font=
    '800 38px VazirmatnLocal, Arial, sans-serif';

  ctx.fillStyle='#ffffff';

  ctx.fillText(
    'محاسبه‌گر هوشمند سود حرفه‌ای',
    width-60,
    75
  );


  ctx.font=
    '500 20px VazirmatnLocal, Arial, sans-serif';

  ctx.fillStyle='#d8def5';

  ctx.fillText(
    r.product,
    width-60,
    118
  );


  ctx.font=
    '700 18px VazirmatnLocal, Arial, sans-serif';

  ctx.fillStyle='#cbd3ed';

  ctx.fillText(
    'گزارش خلاصه قیمت‌گذاری',
    width-60,
    165
  );


  function roundedRect(
    x,
    y,
    w,
    h,
    radius
  ){

    ctx.beginPath();

    ctx.moveTo(
      x+radius,
      y
    );

    ctx.lineTo(
      x+w-radius,
      y
    );

    ctx.quadraticCurveTo(
      x+w,
      y,
      x+w,
      y+radius
    );

    ctx.lineTo(
      x+w,
      y+h-radius
    );

    ctx.quadraticCurveTo(
      x+w,
      y+h,
      x+w-radius,
      y+h
    );

    ctx.lineTo(
      x+radius,
      y+h
    );

    ctx.quadraticCurveTo(
      x,
      y+h,
      x,
      y+h-radius
    );

    ctx.lineTo(
      x,
      y+radius
    );

    ctx.quadraticCurveTo(
      x,
      y,
      x+radius,
      y
    );

    ctx.closePath();

  }


  const cards=[
    {
      title:'قیمت فروش',
      value:money(r.price)
    },
    {
      title:'هزینه واقعی',
      value:money(r.cost)
    },
    {
      title:'سود هر واحد',
      value:money(r.profit)
    },
    {
      title:'حاشیه سود',
      value:r.margin.toLocaleString(
        'fa-IR',
        {
          minimumFractionDigits:2,
          maximumFractionDigits:2
        }
      )+'٪'
    },
    {
      title:'قیمت پیشنهادی',
      value:$('recommended').textContent
    },
    {
      title:'قیمت سربه‌سر',
      value:$('breakEven').textContent
    }
  ];


  const cardWidth=345;
  const cardHeight=145;
  const gap=25;
  const startX=60;
  const startY=270;


  cards.forEach((card,index)=>{

    const col=index%3;
    const row=Math.floor(index/3);

    const x=
      startX+
      col*(cardWidth+gap);

    const y=
      startY+
      row*(cardHeight+gap);


    roundedRect(
      x,
      y,
      cardWidth,
      cardHeight,
      18
    );

    ctx.fillStyle='#ffffff';

    ctx.fill();


    ctx.strokeStyle='#e1e5ec';

    ctx.lineWidth=1;

    ctx.stroke();


    ctx.textAlign='right';

    ctx.direction='rtl';

    ctx.font=
      '500 17px VazirmatnLocal, Arial, sans-serif';

    ctx.fillStyle='#7a8595';

    ctx.fillText(
      card.title,
      x+cardWidth-24,
      y+40
    );


    ctx.font=
      '800 25px VazirmatnLocal, Arial, sans-serif';

    ctx.fillStyle='#162238';

    ctx.fillText(
      card.value,
      x+cardWidth-24,
      y+88
    );

  });


  roundedRect(
    60,
    655,
    1080,
    105,
    18
  );

  ctx.fillStyle='#eef3ff';

  ctx.fill();


  ctx.textAlign='right';

  ctx.direction='rtl';

  ctx.font=
    '700 18px VazirmatnLocal, Arial, sans-serif';

  ctx.fillStyle='#46536a';

  ctx.fillText(
    `فروش ماهانه: ${r.units.toLocaleString('fa-IR')} واحد`,
    width-90,
    700
  );


  ctx.font=
    '800 24px VazirmatnLocal, Arial, sans-serif';

  ctx.fillStyle='#176f53';

  ctx.fillText(
    `سود ماهانه: ${money(r.monthlyProfit)}`,
    width-90,
    738
  );


  const blob=
    await new Promise(resolve=>
      canvas.toBlob(
        resolve,
        'image/png'
      )
    );


  if(!blob){
    throw new Error('خطا در ساخت تصویر');
  }


  downloadBlob(
    blob,
    `smart-profit-${safeFileName(r.product)}.png`
  );


  $('copied').textContent=
    'تصویر آماده شد!';

  setTimeout(()=>{
    $('copied').textContent='';
  },1800);

}


$('excel').addEventListener(
  'click',
  downloadExcel
);


$('image').addEventListener(
  'click',
  downloadImage
);


window.addEventListener(
  'resize',
  ()=>{
    drawChart(
      num('selling')
    );
  }
);


calc();

renderSaved();

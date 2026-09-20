import assert from 'node:assert/strict';

function calculate({
  price,
  unitCost,
  discount=0,
  platform=0,
  payment=0,
  tax=0,
  fixedOrder=0,
  target=0.30,
  fixedMonthly=0,
  units=100
}) {
  const discounted=price*(1-discount);
  const variableRate=platform+payment+tax;
  const fees=discounted*variableRate+fixedOrder;
  const profit=discounted-fees-unitCost;
  const margin=discounted>0?profit/discounted:0;
  const denominator=(1-discount)*(1-variableRate-target);
  const recommended=denominator>0?(unitCost+fixedOrder)/denominator:Infinity;
  const breakEven=(unitCost+fixedOrder)/Math.max(.0001,(1-discount)*(1-variableRate));
  const breakUnits=fixedMonthly>0&&profit>0?Math.ceil(fixedMonthly/profit):0;
  return {discounted,fees,profit,margin,recommended,breakEven,breakUnits,monthlyProfit:profit*units};
}

{
  const r=calculate({price:49,unitCost:31,platform:.08,payment:.03,tax:.05,fixedOrder:2.3,target:.30});
  assert(Math.abs(r.profit-(49*.84-33.3))<1e-9);
  assert(Math.abs(r.margin-(r.profit/49))<1e-9);
  assert(Math.abs(r.recommended-(33.3/.54))<1e-9);
}

{
  const r=calculate({price:100,unitCost:50,discount:.10,platform:.05,payment:.02,tax:.03,fixedOrder:3,target:.25});
  const expected=(53)/(.9*(1-.10-.25));
  assert(Math.abs(r.recommended-expected)<1e-9);
}

{
  const r=calculate({price:100,unitCost:50,platform:.05,payment:.02,tax:.03,fixedOrder:3,fixedMonthly:1000});
  assert.equal(r.breakUnits,28);
}

{
  const r=calculate({price:40,unitCost:50,platform:.05,payment:.02,tax:.03,fixedOrder:3,fixedMonthly:1000});
  assert.equal(r.breakUnits,0);
}

{
  const r=calculate({price:100,unitCost:50,platform:.60,payment:.20,tax:.10,target:.20});
  assert.equal(r.recommended,Infinity);
}

console.log('All calculation tests passed.');

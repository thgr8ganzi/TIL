// 2.80
const isZero = (x) => applyGeneric('isZero', x);

put('isZero', 'schemeNumber', (x) => x === 0);
put('isZero', 'rational', (x) => numer(x) === 0);
put('isZero', 'complex', (x) => realPart(x) === 0 && imagPart(x) === 0);
function pair(x, y) {
    function dispatch(m) {
        return m === 0 ? x : m === 1 ? y : new Error(m + 'Argument not 0 or 1 -- pair');
    }
    return dispatch;
}
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}
function make_rat(n, d) {
    const g = gcd(n, d);
    return pair(Math.abs(n) / g, Math.abs(d) / g);
}

console.log(make_rat(1, 6));
function make_rat(n, d) {
    const posN = Math.abs(n);
    const posD = Math.abs(d);
    const posG = gcd(posN, posD);
    const sign = (n / posN) * (d / posD);

    return pair(sign * (posN / posG), posD / posG);
}
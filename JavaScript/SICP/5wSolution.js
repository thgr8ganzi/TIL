function pair(x, y) {
    return m => m(x, y);
}
function head(z) {
    return z((p, q) => p);
}
function tail(z) {
    return z((p, q) => q);
}
function list(...args) {
    return args.length === 0 ? null : pair(args[0], list(...args.slice(1)));
}
// 2.17
function lastPair(list) {
    return list;
}

console.log(lastPair(list(23, 72, 149, 34)));
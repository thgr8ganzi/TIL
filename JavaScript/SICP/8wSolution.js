function make_accumulator (n) {
    return function (x) {
        return n = n + x;
    };
}
const a = make_accumulator(5);
console.log(a(10))
console.log(a(10))
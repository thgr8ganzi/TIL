// 1.30
function sum1(term, a, next, b) {
    return a > b
            ? 0
            : term(a) + sum1(term, next(a), next, b);
} // sum1 함수는 재귀적 호출을 사용하며, 호출 스택에 많은 프레임을 쌓을 수 있어 메모리 사용량이 증가한다.
function sum(term, a, next, b) {
    function iter(a, result) {
        return a > b
                ? result
                : iter(next(a), result + term(a));
    }
    return iter(a, 0);
} // 함수는 반복문을 사용하여 합을 계산하고, 함수 호출 스택의 깊이를 늘리지 않아 메모리를 덜 사용한다.
function square(x) {
    return x * x;
}
function increment(x) {
    return x + 1;
}
console.log(sum(square, 1, increment, 10)); // 385
// 1.31
function product(term, a, next, b) {
    if (a > b) return 1;
    return term(a) * product(term, next(a), next, b);
}
function factorial(n) {
    return product(x => x, 1, x => x + 1, n);
}
console.log(factorial(5)); // 120

// 1.8
function cube(guess){
    function is_good_enough(guess, x){
        return Math.abs(guess * guess * guess - x) < 0.001; // 세제곱근의 초기값을 빼가면서 오차범위가 0.001보다 작아지면 true
    }
    function improve(guess, x){
        return (x / (guess * guess) + 2 * guess) / 3; // 공식
    }
    function cube_iter(guess, x){
        return is_good_enough(guess, x) ? guess : cube_iter(improve(guess, x), x); // 오차범위 안이면 guess 반환, 아니면 guess 를 improve 한 값으로 재귀
    }
    return cube_iter(1, guess);
}
console.log(cube(27)); // 세제곱근을 구하는 함수

/*===========*/
// 1.9
function inc(n){
    return n + 1;
}
function dec(n){
    return n - 1;
}
// function plus(a, b){
//     return a === 0 ? b : inc(plus(dec(a), b));
// }
function plus(a, b){
    return a === 0 ? b : plus(dec(a), inc(b));
}
console.log(plus(4, 5));

function count_change(amount){
    return cc(amount, 5);
}
function cc(amount, kinds_of_coins){
    return amount === 0
        ? 1
        : amount < 0 || kinds_of_coins === 0
        ? 0
        : cc(amount, kinds_of_coins - 1)
            +
            cc(amount - first_denomination(kinds_of_coins),
                kinds_of_coins);
}
function first_denomination(kinds_of_coins){
    return kinds_of_coins === 1 ? 1
        : kinds_of_coins === 2 ? 5
        : kinds_of_coins === 3 ? 10
        : kinds_of_coins === 4 ? 25
        : kinds_of_coins === 5 ? 50
        : 0;
}
console.log(count_change(100));
/*===========*/
// 1.11
function fn(n){
    return n < 3 ? n : fn(n - 1) + (2 * fn(n - 2)) + (3 * fn(n - 3));
}
console.log(fn(5));
/*===========*/
// 1.16
function isEven(n) {
    return n % 2 === 0;
}

function square(x) {
    return x * x;
}

function fastExpt(b, n) {
    function iter(result, base, exp) {
        if (exp === 0) {
            return result;
        } else if (isEven(exp)) {
            return iter(result, square(base), exp / 2);
        } else {
            return iter(result * base, base, exp - 1);
        }
    }

    return iter(1, b, n);
}

console.log(fastExpt(3, 4)); // 81

/*===========*/
function gdc(a, b){
    return b === 0 ? a : gdc(b, a % b);
}

console.log(gdc(16, 28));

/*===========*/
function smallest_divisor(n){
    return find_divisor(n, 2);
}
function find_divisor(n, test_divisor){
    return square(test_divisor) > n
        ? n
        : divides(test_divisor, n)
        ? test_divisor
        : find_divisor(n, test_divisor + 1);
}
function divides(a, b){
    return b % a === 0;
}
console.log(smallest_divisor(199));
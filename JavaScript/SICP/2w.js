function cube(n){
    return n * n * n;
}
function inc(n){
    return n + 1;
}
function sum_cube(a, b){
    return sum(identity, a, inc, b);
}
function sum(term, a, next, b){
    return a > b ? 0 : term(a) + sum(term, next(a), next, b);
}
function identity(x){
    return x;
}
console.log(sum_cube(1, 10));
/*========================*/
function pi_sum(a, b){
    function pi_term(x){
        return 1 / (x * (x + 2));
    }
    function pi_next(x){
        return x + 4;
    }
    return sum(pi_term, a, pi_next, b);
}
console.log(8 * pi_sum(1, 1000));
/*========================*/
function integral(f, a, b, dx){
    function add_dx(x){
        return x + dx;
    }
    return sum(f, a + dx / 2, add_dx, b) * dx;
}
console.log(integral(cube, 0, 1, 0.01));
/*========================*/
function square(x) {
    return x * x;
}
function f(x, y){
    function f_helper(a, b){
        return x * square(a) + y * b + a * b;
    }
    return f_helper(1 + (x * y), 1 - y);
}
function f_2(x, y){
    return ((a, b) => x * square(a) + y * b + a * b)(1 + (x * y), 1 - y);
}
function f_3(x, y){
    const a = 1 + (x * y);
    const b = 1 - y;
    return x * square(a) + y * b + a * b;
}

console.log(f_3(3, 4));
/*========================*/
const dx = 0.00001;
function deriv(g){
    return x => (g(x + dx) - g(x)) / dx;
}

console.log(deriv(cube)(5))
function newton_transform(g){
    return x => x - g(x) / deriv(g)(x);
}
function newtons_method(g, guess){
    return fixed_point(newton_transform(g), guess);
}
function fixed_point(f, first_guess){
    function close_enough(x, y){
        return Math.abs(x - y) < 0.00001;
    }
    function try_(guess){
        const next = f(guess);
        return close_enough(guess, next) ? next : try_(next);
    }
    return try_(first_guess);
}
function sqrt(x){
    return newtons_method(y => square(y) - x, 1);
}
/*========================*/
// 1.14
function countChange(amount, coinTypes) {
    if (amount === 0) {
        return 1;
    } else if (amount < 0 || coinTypes.length === 0) {
        return 0;
    } else {
        return (
            countChange(amount - coinTypes[0], coinTypes) +
            countChange(amount, coinTypes.slice(1))
        );
    }
}
const amount = 11;
const coinTypes = [1, 5, 10];
const ways = countChange(amount, coinTypes);
console.log(ways);
/*========================*/
// 1.17
function isEven(n) {
    return n % 2 === 0;
}
function fastMultiply(a, b) {
    function double(x) {
        return x * 2;
    }
    function halve(x) {
        return x / 2;
    }
    function fastMultiplyIter(a, b, total) {
        if (a === 0) {
            return total;
        } else if (isEven(a)) {
            return fastMultiplyIter(halve(a), double(b), total);
        } else {
            return fastMultiplyIter(a - 1, b, total + b);
        }
    }
    return fastMultiplyIter(a, b, 0);
}
console.log(fastMultiply(3, 4));
/*========================*/
function double(n) {
    return n + n;
}
function halve(n) {
    return n / 2;
}
function times(a, b) {
    return b === 0
        ? 0
        : halve(b) === 0
            ? times(double(a), halve(b))
            : a + times(a, b - 1);
}
/*========================*/
console.log('================')
// 1.22
function display(n) {
    console.log(n);
}

function get_time() {
    return performance.now()
}

function is_prime(n) {
    if (n < 2) {
        return false;
    } else if (n === 2) {
        return true;
    } else if (n % 2 === 0) {
        return false;
    } else {
        for (let i = 3; i <= Math.sqrt(n); i += 2) {
            if (n % i === 0) {
                return false;
            }
        }
        return true;
    }
}

function timed_prime_test(n) {
    display(n);
    return start_prime_test(n, get_time());
}

function start_prime_test(n, start_time) {
    return is_prime(n) ? report_prime(get_time() - start_time) : true;
}

function report_prime(elapsed_time) {
    display(" *** ");
    display(elapsed_time);
    display(" *** ");
}

timed_prime_test(199);
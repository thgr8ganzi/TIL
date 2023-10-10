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
// 1.32
function accumulate(combiner, nullValue, term, a, next, b) {
    if (a > b) {
        return nullValue;
    } else {
        return combiner(
            term(a),
            accumulate(combiner, nullValue, term, next(a), next, b)
        );
    }
}
function sum3(term, a, next, b) {
    return accumulate((x, y) => x + y, 0, term, a, next, b);
}
// 1.34
function f(g) {
    return g(2);
}
console.log(f(z => z * (z + 1))); // 6
// 1.35
function fixed_point(f, first_guess) {
    const tolerance = 0.00001;
    function close_enough(x, y) {
        return Math.abs(x - y) < tolerance;
    }
    function try_with(guess) {
        let next = f(guess);
        return close_enough(guess, next) ? next : try_with(next);
    }
    return try_with(first_guess);
}
function golden_ratio(x) {
    return 1 + 1 / x;
}
function golden() {
    return fixed_point(golden_ratio, 1.0);
}
console.log(golden()); // 1.6180327868852458
// 1.37
function cont_frac(numer, denom, k) {
    function iter(i) {
        if (i === k) {
            return numer(i) / denom(i);
        } else {
            return numer(i) / (denom(i) + iter(i + 1));
        }
    }
    return iter(1);
}
function golden_ratio_approximation(k) {
    return cont_frac(i => 1, i => 1, k);
}
const k = 1000;
const approximation = golden_ratio_approximation(k);
console.log(1 + approximation);
// 1.40
function deriv(g) {
    const dx = 0.00001;
    return x => (g(x + dx) - g(x)) / dx;
}
function newton_transform(g) {
    return x => x - g(x) / deriv(g)(x);
}
function newtons_method(g, guess) {
    return fixed_point(newton_transform(g), guess);
}
function cubic(a, b, c) {
    return x =>  (x * x * x) + a * (x * x) + (b * x) + c;
}
console.log(newtons_method(cubic(1, 2, 3), 1))
// 1.41
function double(f) {
    return x => f(f(x));
}
function inc(x) {return x + 1;}
console.log(double(inc)(5));
console.log(double(double)(inc)(5));
console.log(double(double(double))(inc)(5));
// 1.42
function compose(f, g) {
    return x => f(g(x));
}
console.log(compose(square, inc)(6)); // 49
// 1.43
function repeated(f, n) {
    return n === 1 ? f : compose(f, repeated(f, n - 1));
}
console.log(repeated(square, 2)(5)); // 625

// 1.44
function smooth(f) {
    return (x) => f(x - dx) + f(x) + f(x + dx) / 3;
}
function n_smooth(f, n) {
    return repeated(smooth, n);
}
// add
function add(a){
    function iter(sum, b) {
        return b === undefined ? sum : (c) => iter(sum + b, c);
    };
    return iter(a, 0);
};
console.log(add(1)(2));
console.log(add()());
console.log(add(1)(2)(0)())
console.log(add(1)(2)())
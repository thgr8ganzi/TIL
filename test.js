function abs(x) {
    return x > 0 ? x : x === 0 ? 0 : - x
}

function square(x) {
    return x * x
}

function is_good_enough(guess, x) {
    return Math.abs(square(guess) - x) < 0.001;
}

function average(x, y) {
    return (x + y) / 2;
}

function improve(guess, x) {
    return average(guess, x / guess);
}

function sqrt_iter(guess, x) {
    return is_good_enough(guess, x) ? guess : sqrt_iter(improve(guess, x), x);
}

function sqrt(x) {
    return sqrt_iter(1, x);
}

console.log(sqrt(9));

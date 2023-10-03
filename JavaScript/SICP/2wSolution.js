function gcd(a, b) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

function isRelativelyPrime(a, b) {
    return gcd(a, b) === 1;
}

function sum(a, b, n) {
    function iter(a) {
        if (a > b) {
            return 0;
        } else if (isRelativelyPrime(a, n)) {
            return a + iter(a + 1);
        } else {
            return iter(a + 1);
        }
    }

    return iter(a);
}

// Example usage
const a = 1;
const b = 10;
const n = 3;
console.log(`Sum of integers from ${a} to ${b} relatively prime to ${n}: ${sum(a, b, n)}`);

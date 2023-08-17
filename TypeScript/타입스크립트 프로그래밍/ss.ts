import * as R from 'ramda'

const array = [1, 2, 3]
R.pipe(
    R.chain(n => [n, n]),
    R.tap(n => console.log(n)) // [ 1, 1, 2, 2, 3, 3 ]
)(array)
R.pipe(
    R.chain(R.append, R.head),
    R.tap(n => console.log(n)) // [ 1, 2, 3, 1 ]
)(array)

const flayMap = (f) => R.pipe(
    R.map(f),
    R.flatten
)
R.pipe(
    flayMap(n => [n, n]),
    R.tap(n => console.log(n)) // [ 1, 1, 2, 2, 3, 3 ]
)(array)

const chainTwoFunc = (firstFn, secondFn) => (x) => firstFn(secondFn(x), x)
R.pipe(
    chainTwoFunc(R.append, R.head),
    R.tap(n => console.log(n)) // [ 1, 2, 3, 1 ]
)(array)

const flip = cb => a => b => cb(b)(a)
const reversSubtract =flip(R.subtract)
const newArray = R.pipe(
    R.map(reversSubtract(10)), // value - 10
    R.tap(n => console.log(n)) // [-9, -8, -7, -6, -5, -4, -3, -2, -1]
)(R.range(1, 9 + 1))

const unnest = flayMap(R.identity)
const array2 = [[1], [2], [3]]
R.pipe(
    unnest,
    R.tap(n => console.log(n)) // [ 1, 2, 3 ]
)(array2)

const always = a => b => a
const first = <T>(a: T) => (b: T): T => always(a)(b)
const second = <T>(a: T) => (b: T): T => flip(always)(a)(b)
console.log(
    first(1)(2), // 1
    second(1)(2) // 2
)

const T = value => R.pipe(
    R.applyTo(value),
    R.tap(value => console.log(value))
)
const value100 = T(100)
const sameValue = value100(R.identity) // 100

const repeat = (N, cb) => R.range(1, N + 1).map(n => cb)
const callAndAppend = R.pipe(
    R.ap(repeat(3, R.identity)),
    R.tap(a => console.log(a))
)
const input2 = [1, 2, 3]
const result2 = callAndAppend(input2) // [1, 2, 3, 1, 2, 3, 1, 2, 3]
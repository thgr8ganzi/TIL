const pipe = <T>(...functions: readonly Function[]): Function =>
    (x:T): T => {
        return functions.reduce((value, func) => func(value), x)
    };
const map = <T, R>(f: (T) => R) => (a: T[]): R[] => a.map(f)
const square = value => value * value
const squaredMap = map(square)
const fourSquare = pipe(
    squaredMap,
    squaredMap
)
console.log(
    fourSquare([3, 4]) // [81, 256] => [(3*3)*(3*3), (4*4)*(4*4)]
)
const reduce = <T>(f:(sum: T, value: T) => T, initValue: T) => (a:T[]): T => a.reduce(f, initValue)
const sum = (result, value) => result + value
const sumArray = reduce(sum, 0)
const pitagoras = pipe(
    squaredMap,
    sumArray,
    Math.sqrt
)
console.log(
    pitagoras([3, 4]) // 5
)
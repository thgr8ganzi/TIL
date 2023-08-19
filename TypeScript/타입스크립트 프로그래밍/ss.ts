interface IValuable<T> {
    getOrElse(defaultValue: T)
}
interface IFunctor<T> {
    map<U>(fn: (value:T) => U)
}
type nullable = undefined | null
class Some<T> implements IValuable<T>, IFunctor<T> {
    constructor(private value: T) {}
    getOrElse(defaultValue: T) {
        return this.value || defaultValue
    }
    map<U>(fn: (value:T) => U) {
        return new Some<U>(fn(this.value))
    }
}
class None implements IValuable<nullable>, IFunctor<nullable>{
    getOrElse<T>(defaultValue: T | nullable) {
        return defaultValue
    }
    map<U>(fn: (T) => U) {
        return new None
    }
}
class Options{
    private constructor() {}
    static some<T>(value: T) {return new Some<T>(value)}
    static none<T>() {return new None}
}
let m = Options.some(1)
let value = m.map(v => v + 1).getOrElse(1)
console.log(value) // 2
let n  = Options.none()
let value2 = n.map(v => v + 1).getOrElse(0)
console.log(value2) // 0

const parseNumber = (n: string): IFunctor<number> & IValuable<number> => {
    const value = parseInt(n)
    return isNaN(value) ? Options.none() : Options.some(value)
}
let v = parseNumber('1')
    .map(v => v + 1) // 2
    .map(v => v * 2) // 4
    .getOrElse(0)
console.log(v) // 4
v = parseNumber('hello world')
    .map(v => v + 1) // 콜백함수 호출 x
    .map(v => v * 2) // 콜백함수 호출 x
    .getOrElse(0)
console.log(v) // 0

const parseJson = <T>(json: string): IFunctor<T> & IValuable<T> => {
    try {
        return Options.some(JSON.parse(json))
    } catch (e) {
        return Options.none()
    }
}
const json = JSON.stringify({name: 'Jack', age: 32})
let value3 = parseJson(json).getOrElse({})
console.log(value3) // {name: 'Jack', age: 32}
value3 = parseJson('hello world').getOrElse({})
console.log(value3) // {}
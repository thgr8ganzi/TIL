const callMap = <T, U>(fn: () => U) => <T extends {map(fn)}>(b: T) => b.map(fn)
callMap(a => a + 1)([1])
const cllMap2 = <T, U>(fn: () => U) => <T>(map: (fn: () => U) => T) => map(fn)
let re1 = new RegExp("eighteen+")
let re2 = /abc/
let eighteenPlus = /eighteen\+/
console.log(/abc/.test("abcde")) // true
console.log(/abc/.test("abxde")) // false
console.log(/[0123456789]/.test("in 1992")) // true
console.log(/[0-9]/.test("in 1992")) // true
let dateTime = /\d\d-\d\d-\d\d\d\d \d\d:\d\d/;
console.log(dateTime.test("01-30-2003 15:20")) // true
console.log(dateTime.test("30-jan-2003 15:20")) // false
let notBinary = /[^01]/;
console.log(notBinary.test("1100100010100110")) // false
console.log(notBinary.test("1100100010200110")) // true

console.log(/'\d+'/.test("'123'")) // true
console.log(/'\d+'/.test("''")) // false
console.log(/'\d*'/.test("'123'")) // true
console.log(/'\d*'/.test("''")) // true

let neighbor = /neighbou?r/;
console.log(neighbor.test("neighbour")) // true
console.log(neighbor.test("neighbor")) // true

let dateTime2 = /\d{1,2}-\d{1,2}-\d{4} \d{1,2}:\d{1,2}/;
console.log(dateTime2.test("1-30-2003 8:45")) // true
function pair(x, y) {
    return [x, y];
}
// 2.17
function list(...elements) {
    if (elements.length === 1) {
        return pair(elements[0], null);
    }
    const [x, ...y] = elements;
    return pair(x, list(...y));
}
let myList = list(23, 72, 149, 34);
// console.log(myList);
// 2.18
function reverse(list) {
    function reverseIter(list, reversed) {
        if (list === null) {
            return reversed;
        } else {
            const [x, y] = list;
            return reverseIter(y, pair(x, reversed));
        }
    }
    return reverseIter(list, null);
}
// console.log(reverse(list(1, 4, 9, 16, 25)));
// 2.20


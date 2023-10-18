function pair(x, y) {
    return [x, y];
}
function list(...elements) {
    if (elements.length === 1) {
        return pair(elements[0], null);
    }else if (elements.length === 0) {
        return null;
    }
    const [x, ...y] = elements;
    console.log(y);
    return pair(x, list(...y));
}
// 2.17
let myList = list(23, 72, 149, 34);
console.log(myList);
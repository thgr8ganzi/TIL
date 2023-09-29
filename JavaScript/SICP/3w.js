const x = pair(1, 2);
head(x);
tail(x);
function numer(x) {
    return head(x);
}
function denom(x) {
    return tail(x);
}
function print_rat(x) {
    return display(JSON.stringify(numer(x)) + '/' + JSON.stringify(denom(x)));
}
function display(n) {
    console.log(n);
}
function make_rat(n, d) {
    const g = gcd(n, d);
    return pair(n / g, d / g);
}
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}
function pair(x, y) {
    function dispatch(m) {
        return m === 0 ? x : m === 1 ? y : new Error(m + 'Argument not 0 or 1 -- pair');
    }
    return dispatch;
}
function head(z) {return z(0);}
function tail(z) {return z(1);}
/*=========================*/
function add_interval(x, y) {
    return make_interval(lower_bound(x) + lower_bound(y),
                         upper_bound(x) + upper_bound(y));
}
function mul_interval(x, y) {
    const p1 = lower_bound(x) * lower_bound(y);
    const p2 = lower_bound(x) * upper_bound(y);
    const p3 = upper_bound(x) * lower_bound(y);
    const p4 = upper_bound(x) * upper_bound(y);
    return make_interval(math_min(p1, p2, p3, p4),
                         math_max(p1, p2, p3, p4));
}
function div_interval(x, y) {
    return mul_interval(x, make_interval(1 / upper_bound(y), 1 / lower_bound(y)));
}
function make_interval(a, b) {return pair(a, b);}
function lower_bound(x) {return head(x);}
function upper_bound(x) {return tail(x);}
/*====================*/
pair(1, pair(2, pair(3, pair(4, null))));
const one_through_four = list(1, 2, 3, 4);
function list(...args) {
    return args.length === 0 ? null : pair(args[0], list(...args.slice(1)));
}
function list_ref(items, n) {
    return n === 0 ? head(items) : list_ref(tail(items), n - 1);
}
const squares = list(1, 4, 9, 16, 25);
console.log(list_ref(squares, 3));
function length(items) {
    function length_iter(items, count) {
        return items === null ? count : length_iter(tail(items), count + 1);
    }
    return length_iter(items, 0);
}
const odds = list(1, 3, 5, 7);
console.log(length(odds));
function append(list1, list2) {
    return list1 === null ? list2 : pair(head(list1), append(tail(list1), list2));
}
const odds2 = list(9, 11, 13, 15);
console.log(append(odds, odds2));
/*================================*/
function scale_list(items, factor) {
    return items === null ? null : pair(head(items) * factor, scale_list(tail(items), factor));
}
function map(fun, items) {
    return items === null ? null : pair(fun(head(items)), map(fun, tail(items)));
}
function scale_list_map(items, factor) {
    return map(x => x * factor, items);
}

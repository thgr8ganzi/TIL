// 2.1
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}
function make_rat(n, d) {
    const posN = Math.abs(n);
    const posD = Math.abs(d);
    const posG = gcd(posN, posD);
    const sign = (n / posN) * (d / posD);

    return pair(sign * (posN / posG), posD / posG);
}
function pair(a, b) {
    return `${a}/${b}`
}
console.log(make_rat(-1, 6));
// 2.2
function print_point(p) {
    return display("(" + x_point(p) + ", " + y_point(p) + ")");
}
function display(n) {
    console.log(n)
}
function make_point(x, y) {
    return [x, y];
}
function x_point(point) {
    return point[0];
}
function y_point(point) {
    return point[1];
}
function make_segment(start_point, end_point) {
    return [start_point, end_point];
}
function start_segment(segment) {
    return segment[0];
}
function end_segment(segment) {
    return segment[1];
}
function midpoint_segment(segment) {
    const start_x = x_point(start_segment(segment));
    const end_x = x_point(end_segment(segment));
    const start_y = y_point(start_segment(segment));
    const end_y = y_point(end_segment(segment));

    const mid_x = (start_x + end_x) / 2;
    const mid_y = (start_y + end_y) / 2;

    return make_point(mid_x, mid_y);
}
const segment = make_segment(make_point(1, 2), make_point(4, 6));
print_point(midpoint_segment(segment));
// 2.4
function pair2(x, y) {
    return m => m(x, y);
}
function head(z) {
    return z((p, q) => p);
}
function tail(z) {
    return z((p, q) => q);
}
console.log(head(pair2(1, 2)));
console.log(tail(pair2(1, 2)));
// 2.5
// pair
function pairCons(a, b) {
    return Math.pow(2, a) * Math.pow(3, b);
}
// head
function headCar(x) {
    function headCarIter(x, count) {
        if (x % 2 === 0) {
            return headCarIter(x / 2, count + 1);
        } else {
            return count;
        }
    }
    return headCarIter(x, 0);
}
// tail
function tailCdr(x) {
    function tailCdrIter(x, count) {
        if (x % 3 === 0) {
            return tailCdrIter(x / 3, count + 1);
        } else {
            return count;
        }
    }
    return tailCdrIter(x, 0);
}
console.log(pairCons(2, 3));
console.log(headCar(pairCons(2, 3)));
console.log(tailCdr(pairCons(2, 3)));
// 2.7
function make_interval(a, b) {
    return [a, b];
}
function lower_bound(x) {
    return x[0];
}
function upper_bound(x) {
    return x[1];
}
console.log(lower_bound(make_interval(1, 2)));
console.log(upper_bound(make_interval(1, 2)));
// 2.8
function sub_interval(x, y) {
    const p1 = lower_bound(x) - lower_bound(y);
    const p2 = lower_bound(x) - upper_bound(y);
    const p3 = upper_bound(x) - lower_bound(y);
    const p4 = upper_bound(x) - upper_bound(y);
    return make_interval(Math.min(p1, p2, p3, p4), Math.max(p1, p2, p3, p4));
}
console.log(sub_interval(make_interval(1, 2), make_interval(3, 4)));


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
// 2.3

// 2.30
function squareTree(tree) {
    return tree.map(subtree => Array.isArray(subtree) ? squareTree(subtree) : Math.pow(subtree, 2));
}
// 2.35
function count_leaves(t) {
    return accumulate((x, y) => x + y, 0, map(subtree => Array.isArray(subtree) ? count_leaves(subtree) : 1, t));
}

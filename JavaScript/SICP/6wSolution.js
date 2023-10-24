// 2.30
function squareTree(tree) {
    return tree.map(subtree => Array.isArray(subtree) ? squareTree(subtree) : Math.pow(subtree, 2));
}
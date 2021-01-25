import * as parser from "@babel/parser"
import traverse from "@babel/traverse"

const code = `function square(n) {
  return n * n
}`;

export const parseExample = () => {
  const ast = parser.parse(code)
  return ast
}

// traverse(ast, {
//   enter(path) {
//     if (path.isIdentifier({ name: "n" })) {
//       path.node.name = "x";
//     }
//   }
// });
import generate from "@babel/generator";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export const generateMock = (code: string) => {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
  traverse(ast, {
    //Traversal number 1

    // Remove all imports
    ImportDeclaration(path) {
      path.getStatementParent()?.remove();
    },

    // Transform all non hof to jest.fn()
    BlockStatement(path) {
      const parentNode = path.getFunctionParent()?.node;
      const functionName = (path.findParent((path) =>
        path.isVariableDeclarator()
      )?.node as any)?.id.name;

      if (t.isType(parentNode?.type, "ArrowFunctionExpression")) {
        path.replaceWith(
          t.blockStatement([
            t.returnStatement(
              t.callExpression(t.identifier("React.createElement"), [
                t.stringLiteral(functionName),
                ...(parentNode?.params as any[]),
              ])
            ),
          ])
        );
        path.skip();
      }
      if (
        t.isType(path.getFunctionParent()?.node.type, "FunctionDeclaration")
      ) {
        path.replaceWith(
          t.blockStatement([
            t.returnStatement(t.callExpression(t.identifier("jest.fn"), [])),
          ])
        );
        path.skip();
      }
    },

    // BlockStatement(path) {
    //   console.log(path.getFunctionParent()?.node.type)
    //   // eslint-disable-next-line no-console

    //   // path?.node?.id?.name && (path.node.id.name = `${path.node.id.name}x`)
    // },
  });

  const output = generate(
    ast,
    {
      /* options */
    },
    code
  );
  console.log(output.code);
  return output;
};

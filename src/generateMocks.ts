import generate from "@babel/generator";
import * as parser from "@babel/parser";
import template from "@babel/template";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export const generateMock = (code: string) => {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  const importDeclarationHelper = (identifier: string, source: string) =>
    t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier("React"))],
      t.stringLiteral("react")
    );

  const mockFunctionBlockHelper = (functionName: string, params: any[]) =>
    t.blockStatement([
      t.returnStatement(
        t.callExpression(t.identifier("React.createElement"), [
          t.identifier(functionName),
          ...params,
        ])
      ),
    ]);

  const hasExportDeclaration = (path: any) =>
    Boolean(path.findParent((path: any) => path.isExportDeclaration()));

  const arrowFunctionVisitior = {
    JSXElement(path: any) {
      const params = path.getFunctionParent()?.node?.params;

      const functionName = (path.findParent((path: any) =>
        path.isVariableDeclarator()
      )?.node as any)?.id.name;

      const mockedElement = t.callExpression(
        t.identifier("React.createElement"),
        [t.identifier(functionName), ...params]
      );

      if (path.node?.extra?.parenthesized) {
        path.replaceWith(t.parenthesizedExpression(mockedElement));
      } else {
        path.replaceWith(mockedElement);
      }

      path.skip();
    },
    BlockStatement(path: any) {
      const params = path.getFunctionParent()?.node?.params;
      const functionName = (path.findParent(
        (path: { isVariableDeclarator: () => any }) =>
          path.isVariableDeclarator()
      )?.node as any)?.id.name;
      path.replaceWith(mockFunctionBlockHelper(functionName, params));
      path.skip();
    },
  };

  traverse(ast, {
    // Remove all imports
    ImportDeclaration(path) {
      path.remove();
    },

    // Transform arrow function components
    ArrowFunctionExpression(path) {
      const declaratorPath = path.findParent((path: any) =>
        path.isVariableDeclaration()
      );
      const isExportDeclaration = Boolean(
        path.findParent((path: any) => path.isExportDeclaration())
      );
      if (!isExportDeclaration) {
        declaratorPath?.remove();
      } else {
        path.traverse(arrowFunctionVisitior);
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

  output.code = `import React from 'react'\n${output.code}`;
  return output;
};

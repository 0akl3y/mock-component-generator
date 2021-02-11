/* eslint-disable @typescript-eslint/no-explicit-any */
import generate from "@babel/generator";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export const generateMock = (code: string) => {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  // const importDeclarationHelper = (identifier: string, source: string) =>
  //   t.importDeclaration(
  //     [t.importDefaultSpecifier(t.identifier("React"))],
  //     t.stringLiteral("react")
  //   );

  const mockFunctionBlockHelper = (functionName: string, params: any[]) =>
    t.functionDeclaration(
      t.identifier(functionName),
      params,
      t.blockStatement([
        t.returnStatement(
          t.callExpression(t.identifier("React.createElement"), [
            t.identifier(functionName),
            ...params,
          ])
        ),
      ]),
      false,
      false
    );

  const hasExportDeclaration = (path: any) =>
    Boolean(path.findParent((path: any) => path.isExportDeclaration()));

  const fnComponentVisitor = {
    //handle functional components
    JSXElement(path: any) {
      const params = path.getFunctionParent()?.node?.params;
      const functionName = (path.findParent(
        (path: any) =>
          path.isVariableDeclarator() ||
          path.isFunctionDeclaration() ||
          path.isClassDeclaration()
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
    //handle all other types of functions
    Expression(path: any) {
      const params = path.getFunctionParent()?.node?.params;
      const jestMock = t.callExpression(t.identifier("jest.fn"), [...params]);
      path.replaceWith(jestMock);
      path.skip();
    },
  };

  const classComponentVisitor = {
    //handle functional components
    JSXElement(path: any) {
      const classParent = path.findParent((path: any) => path.isClass());
      const classDeclaration = path.findParent((path: any) =>
        path.isClassDeclaration()
      );
      const className = (classDeclaration?.node as any)?.id.name;
      const mockedFunction = mockFunctionBlockHelper(className, []);
      classParent.replaceWith(mockedFunction);

      path.skip();
    },
    //handle all other types of functions
    Expression(path: any) {
      const params = path.getFunctionParent()?.node?.params;
      const jestMock = t.callExpression(t.identifier("jest.fn"), [...params]);
      path.replaceWith(jestMock);
      path.skip();
    },
  };

  traverse(ast, {
    // remove all imports

    ImportDeclaration(path) {
      path.remove();
    },

    // transform arrow function components
    Function(path) {
      const declaratorPath = path.findParent((path: any) =>
        path.isVariableDeclaration()
      );
      if (!hasExportDeclaration(path)) {
        declaratorPath?.remove();
      } else {
        path.traverse(fnComponentVisitor);
      }
      path.skip();
    },
    Class(path) {
      const declaratorPath = path.findParent((path: any) =>
        path.isVariableDeclaration()
      );
      if (!hasExportDeclaration(path)) {
        declaratorPath?.remove();
      } else {
        path.traverse(classComponentVisitor);
      }
      path.skip();
    },
  });

  const output = generate(
    ast,
    {
      comments: false,
    },
    code
  );

  output.code = `import React from 'react'\n${output.code}`;
  return output.code;
};

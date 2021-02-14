/* eslint-disable @typescript-eslint/no-explicit-any */
import { transform } from "@babel/core";
import generate from "@babel/generator";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export const generateMock = (code: string) => {
  //strip typescript

  const transformedCode = transform(code, {
    plugins: [["@babel/plugin-transform-typescript", { isTSX: true }]],
    parserOpts: {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    },
  })?.code;

  if (!transformedCode) {
    return;
  }

  const ast = parser.parse(transformedCode, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  // const importDeclarationHelper = (identifier: string, source: string) =>
  //   t.importDeclaration(
  //     [t.importDefaultSpecifier(t.identifier("React"))],
  //     t.stringLiteral("react")
  //   );

  const mockFunctionBlockHelper = (functionName: string, params: any[]) =>
    t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier(functionName),
        t.arrowFunctionExpression(
          params,
          t.blockStatement([
            t.returnStatement(
              t.callExpression(t.identifier("React.createElement"), [
                t.stringLiteral(functionName),
                ...params,
              ])
            ),
          ]),
          false
        )
      ),
    ]);

  const hasExportDeclaration = (path: any) =>
    Boolean(path.findParent((path: any) => path.isExportDeclaration()));

  const fnComponentVisitor = {
    //handle functional components
    JSXElement(path: any) {
      const params = path.getFunctionParent()?.node?.params;
      const functionName = (path.findParent(
        (path: any) =>
          path.isVariableDeclarator() || path.isFunctionDeclaration()
      )?.node as any)?.id.name;

      const mockedElement = t.callExpression(
        t.identifier("React.createElement"),
        [t.stringLiteral(functionName), ...params]
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
      const mockedFunction = mockFunctionBlockHelper(className, [
        t.identifier("props"),
      ]);
      classParent.replaceWith(mockedFunction);

      path.skip();
    },
  };

  traverse(ast, {
    // remove all imports
    ImportDeclaration(path) {
      path.remove();
    },

    //transform functions to mock
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

    //transform classes to mock
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

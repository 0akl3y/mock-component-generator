/* eslint-disable @typescript-eslint/no-explicit-any */
import { transform } from '@babel/core'
import generate from '@babel/generator'
import * as parser from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { pathsToModuleNameMapper } from 'ts-jest'
import { ArrowFunction } from 'typescript'

export interface MockGeneratorOptions {
  keepImports?: boolean
  keepTSTypes?: boolean
}

export const generateMock = (code: string, options?: MockGeneratorOptions) => {
  //strip typescript

  const transformedCode = options?.keepTSTypes
    ? code
    : transform(code, {
        plugins: [['@babel/plugin-transform-typescript', { isTSX: true }]],
        parserOpts: {
          sourceType: 'module',
          plugins: ['typescript', 'jsx'],
        },
      })?.code

  if (!transformedCode) {
    return
  }

  const ast = parser.parse(transformedCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })

  const mockFunctionBlockHelper = (functionName: string, params: any[]) =>
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(functionName),
        t.arrowFunctionExpression(
          params,
          t.blockStatement([
            t.returnStatement(
              t.callExpression(t.identifier('React.createElement'), [
                t.stringLiteral(functionName),
                ...params,
              ])
            ),
          ]),
          false
        )
      ),
    ])

  const exportDefaultFunctionHelper = (functionName: string, params: any[]) =>
    t.exportDefaultDeclaration(
      t.arrowFunctionExpression(
        params,
        t.blockStatement([
          t.returnStatement(
            t.callExpression(t.identifier('React.createElement'), [
              t.stringLiteral(functionName),
              ...params,
            ])
          ),
        ]),
        false
      )
    )

  const hasExportDeclaration = (path: NodePath<any>) =>
    Boolean(path.findParent((path) => path.isExportDeclaration()))

  const fnComponentVisitor = {
    //handle functional components
    ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
      path.skip()
    },
    FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
      path.skip()
    },

    JSXElement(path: NodePath<t.JSXElement>) {
      const params = path.getFunctionParent()?.node?.params ?? ([] as any[])
      const functionName = (path.findParent(
        (path: NodePath) =>
          path.isVariableDeclarator() || path.isFunctionDeclaration()
      )?.node as any)?.id.name

      const mockedElement = t.callExpression(
        t.identifier('React.createElement'),
        [t.stringLiteral(functionName), ...params]
      )

      if (path.node?.extra?.parenthesized) {
        path.replaceWith(t.parenthesizedExpression(mockedElement))
      } else {
        path.replaceWith(mockedElement)
      }
      path.skip()
    },
    //handle all other types of functions
    Expression(path: NodePath<t.Expression>) {
      const params = path.getFunctionParent()?.node?.params ?? ([] as any)
      const jestMock = t.callExpression(t.identifier('jest.fn'), [...params])
      path.replaceWith(jestMock)
      path.skip()
    },
  }

  const classComponentVisitor = {
    //handle functional components
    JSXElement(path: NodePath<t.JSXElement>) {
      const classParent = path.findParent((path: any) => path.isClass())
      const classDeclaration = path.findParent((path: NodePath) =>
        path.isClassDeclaration()
      ) as NodePath<t.ClassDeclaration> | null
      const className = classDeclaration?.node?.id.name ?? ''
      const mockedFunction = mockFunctionBlockHelper(className, [
        t.identifier('props'),
      ])
      classParent?.replaceWith(mockedFunction)

      path.skip()
    },
  }

  const namedFnComponentVisitor = (args: { defaultExportName: string }) => ({
    //handle functional components
    JSXElement(path: NodePath<t.JSXElement>) {
      const params = path.getFunctionParent()?.node?.params as any[]
      const functionPath = path.findParent(
        (path) => path.isVariableDeclarator() || path.isFunctionDeclaration()
      ) as
        | NodePath<t.VariableDeclarator>
        | NodePath<t.FunctionDeclaration>
        | null

      const functionName = (functionPath?.node as any)?.id?.name
      if (functionName === args.defaultExportName) {
        const exportDefaultFunction = exportDefaultFunctionHelper(
          functionName,
          params
        )
        if (functionPath?.isVariableDeclarator()) {
          const arrowFunctionVariableDeclaration = functionPath.findParent(
            (path) => path.isVariableDeclaration()
          )
          arrowFunctionVariableDeclaration?.replaceWith(exportDefaultFunction)
        } else {
          functionPath?.replaceWith(exportDefaultFunction)
        }
      }
    },
  })

  traverse(ast, {
    ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
      const defaultExportName = (path.node.declaration as any)?.name
      const parentPath = path.findParent((path) => {
        return path.isProgram()
      }) as NodePath<t.Program>
      parentPath?.traverse(namedFnComponentVisitor({ defaultExportName }))
    },
  })

  traverse(ast, {
    // remove all imports
    ImportDeclaration(path) {
      if (!options?.keepImports) {
        path.remove()
      }
    },

    Function(path) {
      const declaratorPath = path.findParent((path: any) =>
        path.isVariableDeclaration()
      )
      declaratorPath?.remove()
      path.skip()
    },

    Expression(path: NodePath<t.Expression>) {
      if (!path.isArrowFunctionExpression()) {
        const parentPath = path.findParent((path) => {
          return path.isExportDefaultDeclaration()
        }) as NodePath<t.ExportDefaultDeclaration>
        parentPath?.remove()
      }
    },

    JSXElement(path) {
      let parent: NodePath<t.Function> | NodePath<t.Class> | null

      parent = path.findParent(
        (path) => path.isFunction() || path.isClass()
      ) as typeof parent

      if (parent?.isFunction()) {
        const params = parent.node?.params as any[]
        const functionName = (path.findParent(
          (path: NodePath) =>
            path.isVariableDeclarator() || path.isFunctionDeclaration()
        )?.node as any)?.id.name
        const mockedElement = t.callExpression(
          t.identifier('React.createElement'),
          [t.stringLiteral(functionName), ...params]
        )
        path.replaceWith(mockedElement)
      }

      path.skip()
    },

    //transform classes to mock
    Class(path) {
      const declaratorPath = path.findParent((path: any) =>
        path.isVariableDeclaration()
      )
      if (!hasExportDeclaration(path)) {
        declaratorPath?.remove()
      } else {
        path.traverse(classComponentVisitor)
      }
      path.skip()
    },
  })

  const output = generate(
    ast,
    {
      comments: false,
    },
    code
  )

  output.code = `import React from 'react'\n${output.code}`
  return output.code
}

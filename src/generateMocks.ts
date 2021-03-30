/* eslint-disable @typescript-eslint/no-explicit-any */
import { transform } from '@babel/core'
import generate from '@babel/generator'
import * as parser from '@babel/parser'
import traverse, { NodePath, Visitor } from '@babel/traverse'
import * as t from '@babel/types'

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
              t.callExpression(
                t.memberExpression(
                  t.identifier('React'),
                  t.identifier('createElement')
                ),
                [t.stringLiteral(functionName), ...params]
              )
            ),
          ]),
          false
        )
      ),
    ])

  const exportDefaultFunctionHelper = (functionName = '', params: any[]) =>
    t.exportDefaultDeclaration(
      t.arrowFunctionExpression(
        params,
        t.blockStatement([
          t.returnStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier('React'),
                t.identifier('createElement')
              ),
              [t.stringLiteral(functionName), ...params]
            )
          ),
        ]),
        false
      )
    )

  const jestFn = t.callExpression(
    t.memberExpression(t.identifier('jest'), t.identifier('fn')),
    []
  )

  const jestFunctionBlockHelper = (functionName: string, params: any[]) =>
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(functionName),
        t.arrowFunctionExpression(params, jestFn)
      ),
    ])

  const hasExportDeclaration = (path: NodePath<any>) =>
    Boolean(
      path.findParent(
        (path) => path.isExportDeclaration() || path.isExportDefaultSpecifier()
      )
    )

  const isReactElementCreator = (expression: unknown) => {
    const callee = (expression as t.CallExpression)
      ?.callee as t.MemberExpression

    if (((callee as unknown) as t.Identifier)?.name === 'React.createElement') {
      return true
    }

    return (
      (callee?.object as t.Identifier)?.name === 'React' &&
      (callee?.property as t.Identifier)?.name === 'createElement'
    )
  }

  const isReactComponentClass = (node: unknown) => {
    const classNode = node as t.ClassDeclaration
    const className = classNode?.id?.name
    const superClass = classNode?.superClass as t.MemberExpression
    return (
      (superClass?.object as t.Identifier)?.name === 'React' &&
      ((superClass?.property as t.Identifier)?.name === 'PureComponent' ||
        (superClass?.property as t.Identifier)?.name === 'Component')
    )
  }

  const replaceDefaultExportReference = (args: {
    defaultExportName: string
  }): Visitor => ({
    //handle functional components

    ClassDeclaration(path: NodePath<t.ClassDeclaration>) {
      if (isReactComponentClass(path.node)) {
        const className = (path.node as t.ClassDeclaration)?.id?.name
        const mock = exportDefaultFunctionHelper(className ?? '', [
          t.identifier('props'),
        ])
        path?.replaceWith(mock)
      }
    },
    JSXElement(path: NodePath<t.JSXElement>) {
      const functionParent = path.getFunctionParent()

      if (functionParent) {
        const params = functionParent?.node?.params as any[]
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
          path.skip()
        }
      }
    },
  })

  const handleCallExpressionAsDeclarationVistor: Visitor = {
    CallExpression(path: NodePath<t.CallExpression>) {
      const identifiers = path?.node?.arguments.filter((arg) =>
        t.isIdentifier(arg)
      ) as t.Identifier[]

      identifiers.forEach((identifier) => {
        const parentPath = path.findParent((path) => {
          return path.isProgram()
        }) as NodePath<t.Program>
        parentPath?.traverse(
          replaceDefaultExportReference({
            defaultExportName: identifier?.name ?? '',
          })
        )
      })
    },
  }

  traverse(ast, {
    ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
      const defaultExportName = (path.node.declaration as t.Identifier)?.name
      const defaultCallExpression = path.node.declaration as t.CallExpression

      if (defaultExportName) {
        const parentPath = path.findParent((path) => {
          return path.isProgram()
        }) as NodePath<t.Program>
        parentPath?.traverse(
          replaceDefaultExportReference({ defaultExportName })
        )
      }

      if (defaultCallExpression) {
        path?.traverse(handleCallExpressionAsDeclarationVistor)
      }
    },
  })

  traverse(ast, {
    // remove all imports

    ImportDeclaration(path) {
      if (!options?.keepImports) {
        path.remove()
      }
    },

    VariableDeclaration(path: NodePath<t.VariableDeclaration>) {
      if (!hasExportDeclaration(path)) {
        path.remove()
      }
    },

    FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
      if (!hasExportDeclaration(path)) {
        path.remove()
      }
    },

    TaggedTemplateExpression(path: NodePath<t.TaggedTemplateExpression>) {
      const parent = path.findParent((p) => t.isVariableDeclaration(p))
      parent?.remove()
    },

    ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
      const declaration = path.node.declaration
      if (!t.isClass(declaration) && !t.isFunction(declaration)) {
        path.remove()
      }
      if (isReactComponentClass(declaration)) {
        const className = (declaration as t.ClassDeclaration)?.id?.name
        const mock = exportDefaultFunctionHelper(className ?? '', [
          t.identifier('props'),
        ])
        path?.replaceWith(mock)
      }
    },

    ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>) {
      const classDeclaration = path.node.declaration as t.ClassDeclaration
      const className = classDeclaration?.id?.name
      if (isReactComponentClass(classDeclaration)) {
        const mockedFunction = mockFunctionBlockHelper(className ?? '', [
          t.identifier('props'),
        ])
        path?.replaceWith(t.exportNamedDeclaration(mockedFunction))
      }
    },

    JSXElement(path) {
      let parent: NodePath<t.Function> | NodePath<t.Class> | null
      // eslint-disable-next-line prefer-const
      parent = path.findParent((path) => path.isFunction()) as typeof parent
      if (parent?.isFunction()) {
        const params = parent.node?.params as any[]
        const functionName = (path.findParent(
          (path: NodePath) =>
            path.isVariableDeclarator() || path.isFunctionDeclaration()
        )?.node as any)?.id.name
        const mockedElement = t.callExpression(
          t.memberExpression(
            t.identifier('React'),
            t.identifier('createElement')
          ),
          [t.stringLiteral(functionName ?? ''), ...params]
        )
        path.replaceWith(mockedElement)
      }
    },
    BlockStatement(path: NodePath<t.BlockStatement>) {
      if (
        !path.node.body.some((elm) => {
          const argument = (elm as t.ReturnStatement)?.argument
          return t.isJSXElement(argument) || isReactElementCreator(argument)
        })
      ) {
        const functionParent = path.getFunctionParent()
        if (t.isArrowFunctionExpression(functionParent)) {
          path.replaceInline(jestFn)
        } else if (t.isFunctionDeclaration(functionParent)) {
          const name =
            (functionParent.node as t.FunctionDeclaration)?.id?.name ?? ''
          functionParent.replaceWith(jestFunctionBlockHelper(name, []))
        }
        path.skip()
      }
    },
    ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
      const body = path.node.body

      if (
        t.isExpression(body) &&
        !t.isJSXElement(body) &&
        !isReactElementCreator(body)
      ) {
        path.replaceInline(jestFn)
      }
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

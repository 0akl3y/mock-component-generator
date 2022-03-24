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
  // eslint-disable-next-line no-undef
  const referencedSpecifiers: Set<string> = new Set([])

  const transformedCode = options?.keepTSTypes
    ? code
    : transform(code, {
        // Set a placeholder filename to avoid babel core error
        filename: '_temp.js',
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
      t.variableDeclarator(t.identifier(functionName), jestFn),
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

    if ((callee as unknown as t.Identifier)?.name === 'React.createElement') {
      return true
    }

    return (
      (callee?.object as t.Identifier)?.name === 'React' &&
      (callee?.property as t.Identifier)?.name === 'createElement'
    )
  }

  const isReactComponentClass = (node: unknown) => {
    const classNode = node as t.ClassDeclaration
    const superClass = classNode?.superClass as t.MemberExpression
    return (
      (superClass?.object as t.Identifier)?.name === 'React' &&
      ((superClass?.property as t.Identifier)?.name === 'PureComponent' ||
        (superClass?.property as t.Identifier)?.name === 'Component')
    )
  }

  const handleCallExpressionAsDeclarationVistor: Visitor = {
    CallExpression(path: NodePath<t.CallExpression>) {
      const identifiers = path?.node?.arguments.filter((arg) =>
        t.isIdentifier(arg)
      ) as t.Identifier[]
      identifiers.forEach(({ name }) => {
        if (name) {
          referencedSpecifiers.add(name)
        }
      })
    },
  }

  traverse(ast, {
    ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>) {
      const { specifiers } = path.node
      specifiers.forEach((elm) => {
        referencedSpecifiers.add(
          (elm.exported as t.StringLiteral)?.value ??
            (elm.exported as t.Identifier)?.name
        )
      })
    },
    ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
      const defaultExportName = (path.node.declaration as t.Identifier)?.name
      const defaultCallExpression = path.node.declaration as t.CallExpression

      if (defaultExportName) {
        referencedSpecifiers.add(defaultExportName)
      }

      if (defaultCallExpression) {
        referencedSpecifiers.add(defaultExportName)
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

    VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
      const name = (path.node?.id as any)?.name
      if (!hasExportDeclaration(path) && !referencedSpecifiers.has(name)) {
        path.remove()
      }
    },

    FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
      const name = path.node?.id?.name
      if (
        !hasExportDeclaration(path) &&
        !referencedSpecifiers.has(name ?? '')
      ) {
        path.remove()
      }
    },

    TaggedTemplateExpression(path: NodePath<t.TaggedTemplateExpression>) {
      const parent = path.findParent((p) => t.isVariableDeclaration(p))
      parent?.remove()
    },

    ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
      const declaration = path.node.declaration
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
        const functionName = (
          path.findParent(
            (path: NodePath) =>
              path.isVariableDeclarator() || path.isFunctionDeclaration()
          )?.node as any
        )?.id.name
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
          functionParent.replaceWith(jestFn)
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
        path.replaceWith(jestFn)
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

import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from '../'

const projectRoot = path.join(__dirname, '../../')

expect.addSnapshotSerializer({
  print(val) {
    return val.split(projectRoot).join('<PROJECT_ROOT>/')
  },
  test(val) {
    return typeof val === 'string'
  },
})

pluginTester({
  plugin,
  snapshot: true,
  babelOptions: {filename: __filename},
  tests: [
    {
      snapshot: false,
      code: 'const x = notCodegen`module.exports = "nothing"`;',
    },
    'const x = codegen`module.exports = "1"`',
    'codegen`module.exports = "var x = \'some directive\'"`',
    `
      const y = codegen\`
        module.exports = '({booyah: () => "booyah"})'
      \`
    `,
    {
      code: 'const y = codegen`module.exports = {}`',
      error: true,
    },
    `
      // @codegen
      const array = ['apple', 'orange', 'pear']
      module.exports = array
        .map(fruit => \`export const \${fruit} = "\${fruit}";\`)
        .join('')
    `,
    {
      code: `const x = codegen\`module.exports = "\${dynamic}"\``,
      error: true,
    },
    'import /* codegen */ "./fixtures/assign-one.js"',
    'import /* codegen */ /* this is extra stuff */ "./fixtures/assign-one.js"',
    'import /* this is extra stuff */ /* codegen */ "./fixtures/assign-one.js"',
    {
      code: 'import /* this is extra stuff */"./fixtures/assign-one.js";',
      snapshot: false,
    },
    'import /* codegen(3) */ "./fixtures/assign-identity"',
    'import /* codegen(3) */ "./fixtures/es6-assign-identity"',
    'import /* codegen("string") */ "./fixtures/assign-identity"',
    'import /* codegen(({object: "argument"})) */ "./fixtures/assign-identity"',
    'import /* codegen(Number(require("./fixtures/return-one"))) */ "./fixtures/assign-identity"',
    'const x = codegen.require("./fixtures/return-one")',
    'const x = codegen.require("./fixtures/identity", 3)',
    'const x = codegen.require("./fixtures/es6-identity", 3)',
    {
      code:
        'const x = codegen.require("./fixtures/identity", SOME_UNKNOWN_VARIABLE)',
      error: true,
    },
    {
      code:
        'const x = codegen.require("./fixtures/return-one", "should not be here...")',
      error: true,
    },
    `
      // @codegen
      module.exports = "export default " + String(1 + 2 - 1 - 1)
    `,
    // eslint-disable-next-line
    'codegen`module.exports = ["one", "two"].map((x, i) => \\`var \\${x} = "\\${i + 1}";\\`).join("\\\\n")`',
    {
      code: 'const x = not.codegen();',
      snapshot: false,
    },
    {
      snapshot: false,
      code: '// @codegen',
    },
    {
      snapshot: false,
      code: `
        // @codegen
        /* comment */`,
    },
    'codegen`module.exports = "var ALLCAPS = \'ALLCAPS\'"`',
  ],
})

// This is for any of the exta tests. We give these a name.
pluginTester({
  plugin,
  snapshot: true,
  babelOptions: {filename: __filename},
  tests: {
    'handles some dynamic values': `
      const three = 3
      const x = codegen\`module.exports = "\${three}"\`
    `,
    'removes the node if nothing is returned': `
      codegen\`module.exports = ''\`
    `,
    'removes the node if nothing is returned in require': `
      codegen.require('./fixtures/nothing-exported')
    `,
    'handles multipe nodes': `
      codegen.require('./fixtures/multiple-nodes')
    `,
    'includes code comments': `
      codegen\`
        module.exports = \\\`
          // before
          var x = 'hi'
          /*
           * after
           */

          // call foo
          console.log(foo())

           /**
            * jsdoc
            * @return {string} cool I guess
            */
           function foo() {
             return 'foo'
           }
        \\\`
      \`
    `,
    'accepts babels parser options for generated code': {
      babelOptions: {
        filename: __filename,
        parserOpts: {plugins: ['flow', 'doExpressions']},
      },
      code: `
        // @codegen
        module.exports = "var fNum: number = do { if(true) {100} else {200} };"
      `,
    },
  },
})

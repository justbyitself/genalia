import { compareSync } from "npm:dir-compare"

export default () => ({
  run: ({ tempDir, path }) => ({
    command: 'deno',
    args: ['task', 'genalia', path('./input'), '--out', tempDir],
  }),
  post: [{
    description: 'Compare output file content',
    check: ({ tempDir, path }) => compareSync(tempDir, path('./expected')).same
  }],
  success: true
})

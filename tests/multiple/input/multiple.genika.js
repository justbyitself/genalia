const names = [
  'foo',
  'bar',
  'baz'
]

export default () => names.map((name, index) => ({
  path: `./${name[0]}/${name}.txt`,
  content: name.toUpperCase()
}))

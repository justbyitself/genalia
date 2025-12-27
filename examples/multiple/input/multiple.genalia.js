const names = [
  'foo',
  'bar',
  'baz'
]

export default () => names.map(name => ({
  path: `./${name[0]}/${name}.txt`,
  content: name.toUpperCase()
}))

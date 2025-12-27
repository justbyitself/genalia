const resolve = path => new URL(path, import.meta.url).pathname

export default {
  title: "genalia",
  author: "justbyitself",
  year: (new Date()).getFullYear(),
  random: Math.floor(Math.random() * 1000),
  content: Deno.readTextFileSync(resolve("./content.md")),
}

import { join } from "jsr:@std/path@^1"

export default {
  run: ({ tempDir, path }) => ({
    command: "deno",
    args: ["task", "genalia", path("./input"), "--out", tempDir],
  }),
  post: [
    {
      description: "Check generated JSON output file content",
      check: ({ tempDir }) => {
        try {
          const outputFile = join(tempDir, "sample.json")
          const content = Deno.readTextFileSync(outputFile)

          const data = JSON.parse(content)

          if (data.title !== "genalia") return false
          if (data.author !== "justbyitself") return false

          const currentYear = new Date().getFullYear()
          if (typeof data.year !== "number" || data.year !== currentYear) return false

          if (typeof data.random !== "number") return false

          if (typeof data.content !== "string" || data.content.length === 0) return false

          return true
        } catch {
          return false
        }
      },
    },
    {
      description: "Check generated Markdown output file content",
      check: ({ tempDir }) => {
        const outputFile = join(tempDir, "sample.md")
        const content = Deno.readTextFileSync(outputFile)

        if (!content.includes("# Genalia")) return false
        if (!content.includes("genalia by justbyitself")) return false

        const yearRegex = /^Year:\s*\d{4}$/m
        if (!yearRegex.test(content)) return false

        const randomRegex = /^This is a random number:\s*\d+$/m
        if (!randomRegex.test(content)) return false

        if (!content.includes("Minimal content from a file")) return false

        return true
      }
    }
  ],
  success: true,
}

#!/usr/bin/env -S deno run -A

import { resolve } from "@std/path"
import { parseArgs } from "@std/cli/parse-args"

import { main } from "./src/main.js"

function getVersion() {
  try {
    const json = JSON.parse(Deno.readTextFileSync("./deno.json"))
    return json.version ?? "unknown"
  } catch {
    return "unknown"
  }
}

function printHelp() {
  console.log(`
Usage: genalia <module|directory> [options]

Options:
  --out <outputDir>    Specify output directory (default: ./dist)
  --ignore <patterns>  Ignore files or directories matching glob patterns (comma separated, default: **/.*)
  --version            Show version information
  --help               Show this help message
`)
}

if (import.meta.main) {
  try {
    const args = parseArgs(Deno.args, {
      string: ["out", "ignore"],
      boolean: ["version", "help"],
      alias: { o: "out", V: "version", h: "help", i: "ignore"},
    })

    if (args.help) {
      printHelp()
      Deno.exit(0)
    }

    if (args.version) {
      console.log(`genalia ${getVersion()}`)
      Deno.exit(0)
    }

    const positionals = args._

    if (positionals.length < 1) {
      throw new Error("Missing required argument.\nUsage: genalia <module|directory> [--out <outputDir>]")
    }

    const inputPath = String(positionals[0])
    const outDir = args.out ?? "./dist"
    const ignore = args.ignore ?? "**/.*"

    const options = { ignore }

    await main(resolve(inputPath), resolve(outDir), options)
    Deno.exit(0)
  } catch (error) {
    console.error("Error:", error.message)
    Deno.exit(1)
  }
}

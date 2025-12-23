import { ensureDir } from "https://deno.land/std@0.203.0/fs/mod.ts"
import { dirname, join, resolve, relative } from "https://deno.land/std@0.203.0/path/mod.ts"
import { walk } from "https://deno.land/std@0.203.0/fs/walk.ts"

async function processFile(filePath, inputDir, outDir) {
  const resolvedPath = resolve(filePath)
  const mod = await import(`file://${resolvedPath}`)
  const generate = mod.default
  
  if (typeof generate !== "function") {
    throw new Error(`Module ${filePath} does not export a default function`)
  }
  const result = await generate()
  if (!Array.isArray(result)) {
    throw new Error(`Generator ${filePath} must return an array of files`)
  }

  const relPath = relative(inputDir, resolvedPath)
  const baseDir = dirname(relPath)

  for (const file of result) {
    const outFilePath = join(outDir, baseDir, file.path)
    await ensureDir(dirname(outFilePath))
    await Deno.writeTextFile(outFilePath, file.content)
  }

  return result
}

async function processDir(inputDir, outDir) {
  for await (const entry of walk(inputDir, { includeDirs: false })) {
    const name = entry.name
    const relPath = relative(inputDir, entry.path)
    const destPath = join(outDir, relPath)

    if (name.startsWith(".")) continue

    if (name.endsWith(".genika.js")) {
      await processFile(entry.path, inputDir, outDir)
      continue
    }

    await ensureDir(dirname(destPath))
    await Deno.copyFile(entry.path, destPath)
  }
}

async function main() {
  const args = Deno.args
  if (args.length < 1) {
    console.error("Usage: deno run --allow-read --allow-write cli.js <module|directory> [--out <outputDir>]")
    Deno.exit(1)
  }

  const inputPath = args[0]
  let outDir = "./dist"

  const outIndex = args.indexOf("--out")
  if (outIndex !== -1 && args.length > outIndex + 1) {
    outDir = args[outIndex + 1]
  }

  const resolvedInputPath = resolve(inputPath)
  const stat = await Deno.stat(resolvedInputPath)

  await ensureDir(outDir)

  if (stat.isDirectory) {
    await processDir(resolvedInputPath, outDir)
  } else if (stat.isFile) {
    await processFile(resolvedInputPath, dirname(resolvedInputPath), outDir)
  } else {
    console.error("Input path is neither a file nor a directory")
    Deno.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  Deno.exit(1)
})

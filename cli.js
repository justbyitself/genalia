#!/usr/bin/env -S deno run --allow-read --allow-write

import { ensureDir } from "https://deno.land/std@0.203.0/fs/mod.ts"
import { dirname, join, resolve, relative } from "https://deno.land/std@0.203.0/path/mod.ts"
import { walk } from "https://deno.land/std@0.203.0/fs/walk.ts"
import { parse } from "jsr:@std/yaml@1.0.10"

async function loadConfig(inputDir) {
  const configPathYaml = join(inputDir, "config.genika.yaml")

  try {
    const text = await Deno.readTextFile(configPathYaml)
    return parse(text)
  } catch (e) {
    return {}
  }
}

async function processFile(filePath, inputDir, outDir, config = {}) {
  const resolvedPath = resolve(filePath)
  const mod = await import(`file://${resolvedPath}`)
  const generate = mod.default

  if (typeof generate !== "function") {
    throw new Error(`Module ${filePath} does not export a default function`)
  }

  const fileName = filePath.split("/").pop()

  // Detectar generador especial .genika.xxx.js (xxx distinto de js)
  const specialGenMatch = fileName.match(/^(.*)\.genika\.([^.]+)\.js$/)
  let generatedFiles

  if (specialGenMatch && specialGenMatch[2] !== "js") {
    const [_, baseName, outExt] = specialGenMatch
    const content = await generate({ config })
    if (typeof content !== "string") {
      throw new Error(`Generator ${filePath} must return a string for .genika.${outExt}.js files`)
    }
    generatedFiles = [{ path: `${baseName}.${outExt}`, content }]
  } else if (fileName.endsWith(".genika.js")) {
    const result = await generate({ config })
    if (!Array.isArray(result)) {
      throw new Error(`Generator ${filePath} must return an array of files`)
    }
    generatedFiles = result
  } else {
    throw new Error(`Unsupported generator filename format: ${fileName}`)
  }

  const relPath = relative(inputDir, resolvedPath)
  const baseDir = dirname(relPath)

  for (const file of generatedFiles) {
    const outFilePath = join(outDir, baseDir, file.path)
    await ensureDir(dirname(outFilePath))
    await Deno.writeTextFile(outFilePath, file.content)
  }

  return generatedFiles
}

async function processDirectory(inputDir, outDir, config) {
  for await (const entry of walk(inputDir, { includeDirs: false })) {
    const name = entry.name
    const relPath = relative(inputDir, entry.path)
    const destPath = join(outDir, relPath)

    if (name.startsWith(".") || name === "config.genika.yaml") continue

    if (/\.genika(\.[^.]+)?\.js$/.test(name)) {
      await processFile(entry.path, inputDir, outDir, config)
      continue
    }

    // Copiar archivos estáticos
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

  let config = {}
  if (stat.isDirectory) {
    config = await loadConfig(resolvedInputPath)
    await processDirectory(resolvedInputPath, outDir, config)
  } else if (stat.isFile) {
    const inputDir = dirname(resolvedInputPath)
    config = await loadConfig(inputDir)
    await processFile(resolvedInputPath, inputDir, outDir, config)
  } else {
    console.error("Input path is neither a file nor a directory")
    Deno.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  Deno.exit(1)
})

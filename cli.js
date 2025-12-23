#!/usr/bin/env -S deno run --allow-read --allow-write

import { ensureDir } from "https://deno.land/std@0.203.0/fs/mod.ts"
import { walk } from "https://deno.land/std@0.203.0/fs/walk.ts"
import { dirname, join, resolve, relative } from "https://deno.land/std@0.203.0/path/mod.ts"
import { parse as parseYaml } from "jsr:@std/yaml@1.0.10"

export async function loadConfig(inputDir) {
  const yamlPath = join(inputDir, "config.genika.yaml")

  try {
    const yamlText = await Deno.readTextFile(yamlPath)
    const cfg = parseYaml(yamlText)
    return cfg ?? {}
  } catch {
    return {}
  }
}

function describeEntry(path, inputDir) {
  const name = path.split("/").pop() ?? path
  const relPath = relative(inputDir, path).replace(/^\.\/+/, "")

  const isHidden = name.startsWith(".")
  const isNamedGenerator = /\.genika\.[^.]+\.js$/.test(name)
  const isNormalGenerator = /\.genika\.js$/.test(name)
  const isGenerator = isNamedGenerator || isNormalGenerator
  const isConfig = /^config\.genika\.yaml$/.test(name)
  const isCopyFile = !isGenerator && !isHidden && !isConfig

  let baseName = null
  let outExt = null

  if (isNamedGenerator) {
    const m = name.match(/^(.*)\.genika\.([^.]+)\.js$/)
    if (m) [, baseName, outExt] = m
  }

  return {
    path,
    name,
    relPath,
    baseName,
    outExt,
    isHidden,
    isGenerator,
    isNamedGenerator,
    isNormalGenerator,
    isCopyFile,
  }
}

async function copyStaticFiles(fileEntries, inputDir, outDir) {
  for (const entry of fileEntries) {
    const relPath = relative(inputDir, entry.path)
    const destPath = join(outDir, relPath)
    await ensureDir(dirname(destPath))
    await Deno.copyFile(entry.path, destPath)
  }
}

async function writeGeneratedFiles(files, outDir, baseDir = "") {
  for (const file of files) {
    const outFilePath = join(outDir, baseDir, file.path)
    await ensureDir(dirname(outFilePath))
    await Deno.writeTextFile(outFilePath, file.content)
  }
}

function normalizeGeneratedFiles(result, entry, filePath) {
  if (entry.isNamedGenerator) {
    if (typeof result !== "string") {
      throw new Error(
        `Generator ${filePath} must return a string for named generators`,
      )
    }
    return [{ path: `${entry.baseName}.${entry.outExt}`, content: result }]
  } else {
    if (!Array.isArray(result)) {
      throw new Error(`Generator ${filePath} must return an array of files`)
    }
    return result
  }
}

async function processEntry(entry, outDir, config = {}) {
  const filePath = entry.path
  const resolvedPath = resolve(filePath)
  const mod = await import(`file://${resolvedPath}`)
  const generate = mod.default

  if (typeof generate !== "function") {
    throw new Error(`Module ${filePath} does not export a default function`)
  }

  const result = await generate({ config })

  const generatedFiles = normalizeGeneratedFiles(result, entry, filePath)


  const baseDir = dirname(entry.relPath)

  await writeGeneratedFiles(generatedFiles, outDir, baseDir)

  return generatedFiles
}

function parseArgs(args) {
  if (args.length < 1) {
    throw new Error(
      "Usage: deno run --allow-read --allow-write cli.js <module|directory> [--out <outputDir>]",
    )
  }

  const inputPath = args[0]
  let outDir = "./dist"

  const outIndex = args.indexOf("--out")
  if (outIndex !== -1 && args.length > outIndex + 1) {
    outDir = args[outIndex + 1]
  }

  return { inputPath, outDir }
}

async function processEntries(entries, inputDir, outDir, config) {
  const visibleEntries = entries.filter(e => !e.isHidden)

  const namedGenerators = visibleEntries.filter(e => e.isNamedGenerator)
  const normalGenerators = visibleEntries.filter(e => e.isNormalGenerator)
  const copyFiles = visibleEntries.filter(e => e.isCopyFile)

  const errors = []

  const safeProcess = async (entry) => {
    try {
      await processEntry(entry, outDir, config)
    } catch (e) {
      errors.push(new Error(`Error processing generator ${entry.path}: ${e.message || e}`))
    }
  }

  await Promise.all(namedGenerators.map(safeProcess))
  await Promise.all(normalGenerators.map(safeProcess))

  await copyStaticFiles(copyFiles, inputDir, outDir)

  if (errors.length) {
    throw new AggregateError(errors, "One or more generators failed")
  }
}

async function getEntries(path) {
  const entries = []
  for await (const entry of walk(path, { includeDirs: false })) {
    entries.push(entry.path)
  }
  return entries
}

async function main(inPath, outPath) {
  const stat = await Deno.stat(inPath)

  if (!stat.isDirectory && !stat.isFile) {
    throw new Error("Input path is neither a file nor a directory")
  }

  await ensureDir(outPath)

  const basePath = stat.isFile ? dirname(inPath) : inPath
  const paths = stat.isFile ? [inPath] : await getEntries(inPath)
  const entries = paths.map(p => describeEntry(p, basePath))

  const config = await loadConfig(basePath)
  await processEntries(entries, basePath, outPath, config)
}

if (import.meta.main) {
  try {
    const { inputPath, outDir } = parseArgs(Deno.args)
    await main(resolve(inputPath), resolve(outDir))
    Deno.exit(0)
  } catch (error) {
    console.error("Error:", error.message)
    Deno.exit(1)
  }
}


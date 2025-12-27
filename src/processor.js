import { importModule } from "jsr:@brad-jones/jsr-dynamic-imports@^0.1.2"
import { resolve } from "@std/path"

import * as fs from "./fs.js"

function normalize(generatorOutput, entry) {
  if (entry.isNamedGenerator && typeof generatorOutput !== "string") {
    throw new Error(`Generator ${entry.path} must return a string for named generators`)
  }

  if (entry.isNormalGenerator && !Array.isArray(generatorOutput)) {
    throw new Error(`Generator ${entry.path} must return a string for named generators`)
  }

  return entry.isNormalGenerator 
    ? generatorOutput 
    : [{ path: `${entry.baseName}.${entry.outExt}`, content: generatorOutput }]
}

async function processEntry(entry, outPath, config = {}) {
  const generate = (await importModule(resolve(entry.path))).default

  if (typeof generate !== "function") {
    throw new Error(`Module ${entry.path} does not export a default function`)
  }

  const generatorOutput = await generate({ config })
  const generatedFiles = normalize(generatorOutput, entry)

  await fs.write(generatedFiles, outPath, entry.relativeDirPath)

  return generatedFiles
}

export default async function process(entries, basePath, outPath, config) {
  const visibleEntries = entries.filter(e => !e.isHidden && !e.isConfig)

  const namedGenerators = visibleEntries.filter(e => e.isNamedGenerator)
  const normalGenerators = visibleEntries.filter(e => e.isNormalGenerator)
  const copyFiles = visibleEntries.filter(e => e.isCopyFile).map(e => e.path)

  const errors = []

  const safeProcess = async (entry) => {
    try {
      await processEntry(entry, outPath, config)
    } catch (e) {
      console.debug({e})
      errors.push(new Error(`Error processing generator ${entry.path}: ${e.message || e}`))
    }
  }

  await Promise.all(namedGenerators.map(safeProcess))
  await Promise.all(normalGenerators.map(safeProcess))

  await fs.copy(copyFiles, basePath, outPath)

  if (errors.length) {
    throw new AggregateError(errors, "One or more generators failed")
  }
}

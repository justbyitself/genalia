import { ensureDir } from "@std/fs"
import { dirname } from "@std/path"

import * as fs from "./fs.js"
import * as descriptor from "./descriptor.js"
import process from "./processor.js"

export async function main(inputPath, outPath) {
  const stat = await Deno.stat(inputPath)

  if (!stat.isDirectory && !stat.isFile) {
    throw new Error("Input path is neither a file nor a directory")
  }

  await ensureDir(outPath)
 
  const [basePath, filePaths] = stat.isFile 
    ? [dirname(inputPath), [inputPath]] 
    : [inputPath, fs.list(inputPath)]

  const entries = filePaths.map(p => descriptor.analyze(p, basePath))

  await process(entries, basePath, outPath)
}

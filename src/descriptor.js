import { relative } from "@std/path/relative"
import { dirname } from "node:path";

export function analyze(filePath, basePath) {
  const name = filePath.split("/").pop() ?? filePath
  const relativePath = relative(basePath, filePath)
  const relativeDirPath = dirname(relativePath)

  const isHidden = name.startsWith(".")
  const isNamedGenerator = /\.genalia\.[^.]+\.js$/.test(name)
  const isNormalGenerator = /\.genalia\.js$/.test(name)
  const isGenerator = isNamedGenerator || isNormalGenerator
  const isConfig = /config\.genalia\.[^.]+$/.test(name)
  const isCopyFile = !isGenerator && !isHidden && !isConfig

  let baseName = null
  let outExt = null

  if (isNamedGenerator) {
    const m = name.match(/^(.*)\.genalia\.([^.]+)\.js$/)
    if (m) [, baseName, outExt] = m
  }

  return {
    path: filePath,
    name,
    relativePath,
    relativeDirPath,
    baseName,
    outExt,
    isHidden,
    isGenerator,
    isNamedGenerator,
    isNormalGenerator,
    isCopyFile,
    isConfig
  }
}

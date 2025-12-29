import { globToRegExp } from "@std/path/glob-to-regexp"
import { relative } from "@std/path/relative"
import { dirname } from "node:path"

export function analyze(filePath, basePath,{ignore}) {
  const name = filePath.split("/").pop() ?? filePath
  const relativePath = relative(basePath, filePath)
  const relativeDirPath = dirname(relativePath)

  const patternList = ignore.split(",").map(p => p.trim())
  const regexes = patternList.map(p => globToRegExp(p))
  const isIgnored = regexes.some(regex => regex.test(filePath))
  
  const isNamedGenerator = /\.genalia\.[^.]+\.js$/.test(name)
  const isNormalGenerator = /\.genalia\.js$/.test(name)
  const isGenerator = isNamedGenerator || isNormalGenerator
  const isConfig = /config\.genalia\.[^.]+$/.test(name)
  const isCopyFile = !isGenerator && !isIgnored && !isConfig

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
    isIgnored,
    isGenerator,
    isNamedGenerator,
    isNormalGenerator,
    isCopyFile,
    isConfig
  }
}

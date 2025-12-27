import { walkSync } from "@std/fs/walk"
import { ensureDir } from "@std/fs"
import { dirname, join } from "@std/path"
import { relative } from "@std/path/relative"

export async function copy(filePaths, basePath, outPath) {
  for (const filePath of filePaths) {
    const relativePath = relative(basePath, filePath)
    const destinationPath = join(outPath, relativePath)

    await ensureDir(dirname(destinationPath))
    await Deno.copyFile(filePath, destinationPath)
  }
}

export async function write(files, outPath, baseDir = "") {
  for (const file of files) {
    const outFilePath = join(outPath, baseDir, file.path)
    
    await ensureDir(dirname(outFilePath))
    await Deno.writeTextFile(outFilePath, file.content)
  }
}

export function list(path) {
  return Array.from(walkSync(path, { includeDirs: false })).map(e => e.path)
}

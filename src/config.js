import { load as loadModule } from "jsr:@justbyitself/modulia@0.1.0"
import { join } from "@std/path"

export async function load(inputDir) {
  try {
    const files = Deno.readDirSync(inputDir)
      .filter(e => e.isFile && e.name.startsWith("config.genalia."))
      .map(e => join(inputDir, e.name))
      .toArray()
    
    const modules = await Promise.all(files.map(file => loadModule(file)))

    return modules.reduce((acc, module) => ({ ...acc, ...module() }), {})
  } catch {
    return {}
  }
}

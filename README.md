# Genalia

Genalia is a **file generator** developed in [Deno](https://deno.com/). Designed to be flexible, programmable and simple: generate files with minimal boilerplate and maximum expressiveness.

## Generators

Genalia uses JavaScript files called **generators** to define what files to create. A generator is a simple function that returns an array of objects, each representing a file to be generated.

Each file object contains two properties:

- `path`: The relative path and filename of the file to be created.
- `content`: The content to be written inside the file.

#### Naming Convention

Generator files must follow the naming convention `*.genalia.js`. This convention helps Genalia identify which files are generators to be executed during the generation process.

Here is a basic example of a generator file named `hello.genalia.js`:

```javascript
export default () => [
  {
    path: "helloworld.txt",
    content: "Hello world!"
  }
]
```

This generator will create a file named `helloworld.txt` with the text "Hello world!" inside.

## Named generators

In addition to returning an array of file objects, Genalia generators can also return a single string. This is useful for simple cases where you want to generate the content of a single file without specifying a path explicitly.

For example, a named generator file called `example.genalia.txt.js` might look like this:

```javascript
export default () => "This is a test content"
```

When using this generator, Genalia will create a file named `example.txt` with the content `"This is a test content"`.

This feature allows for quick and concise file generation when the filename is derived from the generator's filename itself.

## Directory as input

Genalia can be run with either a single generator file or a directory as its input argument. While it works perfectly with a single generator file, its full power is unleashed when you provide a directory.

When given a directory, Genalia will recursively scan all files within that directory and its subdirectories, processing every generator file it finds according to the naming conventions (`*.genalia.js` or `*.genalia.<ext>.js`).

This allows you to organize multiple generators in a structured way, enabling complex projects with many generated files and templates to be managed easily.

## Configuration files

For advanced usage, Genalia supports configuration files that allow you to customize and control the generation process.

These configuration files can be named:

- `config.genalia.yaml`
- `config.genalia.yml`
- `config.genalia.js`

The configuration file can define various settings such as output directories, global variables, or custom behaviors that affect how generators are processed.

Using configuration files helps tailor Genalia to fit complex project requirements and streamline your file generation workflows.

### Configuration Files Example

Genalia supports configuration files such as `config.genalia.yml` to provide global settings accessible by generators.

For example, a `config.genalia.yml` file might look like this:

```yaml
title: genalia
author: justbyitself
```

A generator can then access this configuration by receiving it as an argument. For instance, a generator file named `sample.genalia.json.js` could use the config like this:

```javascript
export default ({ config }) => JSON.stringify(config)
```

This generator will produce a JSON file containing the configuration data defined in `config.genalia.yml`.

This feature allows you to centralize settings and reuse them across multiple generators, making file generation more dynamic and maintainable.

### Configuration Injection

One important aspect of Genalia’s design is how configuration data is **injected** into generators. When a generator function is executed, Genalia passes an object containing the configuration under the `config` property as an argument.

This means you can access your global configuration simply by destructuring the argument in your generator function, like this:

```javascript
export default ({ config }) => {
  // Use the config object here
  return JSON.stringify(config)
}
```

This injection mechanism allows generators to dynamically adapt their output based on the configuration settings, enabling flexible and reusable generation logic.

## Ignored and copied Files

In addition to generator and config files, Genalia handles other files in the input directory differently:

- Files that start with a dot (`.`), such as `.gitignore` or `.env`, are **ignored** and not processed or copied.
- All other files that do not match the generator naming convention are **copied directly** to the output directory without modification.

This behavior allows you to include static assets or configuration files alongside your generators, ensuring they are preserved in the generated output.

## Dynamic imports

All .js files used by Genalia—both generators and configuration files—are executed within the Deno runtime environment. This provides a significant advantage: you can leverage Deno’s support for dynamic imports.

Thanks to this, you can dynamically import, within your generators or config files, external libraries from npm/jsr packages, URLs or local modules. In addition, there’s no need to set up a full project, making Genalia perfect for quick scripting workflows with minimal setup.

For example, you can write the generator `loremIpsum.txt.js`:
```javascript
import { loremIpsum } from "npm:lorem-ipsum"
export default () => loremIpsum({ count: 2, units: "paragraphs" })
```

## Additional examples

For more illustrative examples and to help you get started quickly, please check the [examples](https://github.com/justbyitself/genalia/tree/main/examples) directory included in the Genalia project.

This directory contains a variety of generator files and configurations demonstrating different use cases and advanced features of Genalia. Exploring these examples is highly recommended to understand the full potential and flexibility of the tool.

## Installation

### Precompiled binaries

You can [download](https://github.com/justbyitself/genalia/releases/latest) and use the precompiled binaries for Linux, macOS, and Windows from the latest GitHub releases.

For example, in Linux:

```bash
# Download the binary
curl -L -o genalia "https://github.com/justbyitself/genalia/releases/latest/download/genalia-x86_64-linux"

# Make it executable
chmod +x genalia

# Run it
./genalia [module or directory]
```
### Running with Deno

If you have `deno` installed, you can run Genalis using the following methods:

```bash
# Option 1: Using deno run
deno run -A jsr:@justbyitself/genalia [module or directory]

# Option 2: Using deno x (Deno 2.6+)
deno x jsr:@justbyitself/genalia [module or directory]

# Option 3: Using dx shorthand (Deno 2.6+)
dx jsr:@justbyitself/genalia [module or directory]
```

## Testing examples
The examples included in the Genalia project are tested using [Veritaclis](https://github.com/justbyitself/veritaclis), a testing framework designed for Deno.

You can run these tests easily with the following command:

```bash
deno task test
```

This ensures that the example generators work as expected and helps maintain the quality and reliability of the project.
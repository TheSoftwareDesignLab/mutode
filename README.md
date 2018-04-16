# Mutode [![npm](https://img.shields.io/npm/v/mutode.svg)]() [![npm](https://img.shields.io/npm/dm/mutode.svg)]() [![npm](https://img.shields.io/npm/l/mutode.svg)](LICENSE)

Mutation testing for Node.js and JavaScript. **Currently being built**

[![Build Status](https://travis-ci.org/TheSoftwareDesignLab/mutode.svg?branch=master)](https://travis-ci.org/TheSoftwareDesignLab/mutode) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**Requires Node 8+**

## Install

Globally:

```sh
npm i -g mutode
```

Locally as a dev dependency:

```sh
npm i -D mutode
```

## Use

Globally:

```sh
mutode [options] [paths]
```

Locally with `npx`:

```sh
npx mutode [options] [paths]
```

Locally with a package.json script:

```
{
  ...
  "scripts": {
    "test: "my test command",
    "mutode": "mutode [options] [paths]"
  }
  ...
}
```

**Options**:

```
Usage: mutode [options] [paths]

Options:
  --concurrency, -c  Concurrency of mutant runners         [number] [default: 4]
  --mutators, -m     Specific mutators to load (space separated)
             [array] [choices: "conditionalsBoundary", "deletion", "increments",
          "invertNegatives", "math", "negateConditionals", "removeConditionals",
                                                  "returnValues", "switchCases"]
  -h, --help         Show help                                         [boolean]
  -v, --version      Show version number                               [boolean]
```

## License
MIT Copyright © Diego Rodríguez Baquero

# Mutode [![npm](https://img.shields.io/npm/v/mutode.svg)]() [![npm](https://img.shields.io/npm/dm/mutode.svg)]() [![npm](https://img.shields.io/npm/l/mutode.svg)](LICENSE)

Mutation testing for Node.js and JavaScript. **Currently being built**

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)

## Install

```sh
npm i -D mutode
or
npm install --save-dev mutode
```

## Use

With `npx`:
```sh
npx mutode [options] [paths]
```

With an package.json script:

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
  --mutators, -m     Mutators to load (space separated)      [array] [choices: ]
  -h, --help         Show help                                         [boolean]
  -v, --version      Show version number                               [boolean]
```

## License
MIT Copyright © Diego Rodríguez Baquero

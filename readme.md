# TypeScript Node.js Scripts Template

Minimal TypeScript template for Node.js scripts and utilities.

## Project Structure

project/
- ├── app/ # Source directory (.ts files)
- ├── build/ # Compiled output (.js files)
- └── tsconfig.json # TypeScript configuration


## Prerequisites

- Node.js 18+
- npm

## Installation

```bash
git clone someTrickyCase/tstemplate
cd tstemplate
npm install
```
Available Scripts

    npm run build - Compile TypeScript to JavaScript
    npm run start - Run the compiled application
    npm run dev - Run with ts-node (development)

Usage

    Place your TypeScript files in the app/ directory
    Run npm run build to compile to build/ directory
    Execute with npm run start or node build/index.js

Development

For development with auto-reload:
```bash
npm run dev
```

Build Configuration

    Target: ES2022
    Module: CommonJS
    Strict type checking

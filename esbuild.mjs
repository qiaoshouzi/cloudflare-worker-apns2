import { build } from 'esbuild'

const options = {
  entryPoints: ['./src/index.ts'],
  platform: 'node',
  target: 'node16',
  // external: ['fetch-http2', 'jsonwebtoken'],
  minify: true,
  bundle: true,
  outfile: './dist/index.js'
}

build(options).catch((err) => {
  process.stderr.write(err.stderr)
  process.exit(1)
})

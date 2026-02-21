import { describe, it, expect } from 'vitest'

// ensure we can import the bundler configuration helpers directly and that
// they contain the expected keys. the actual values are trivial and not
// runtime-dependent, so this test acts as a sanity check for the new export
// path.
describe('Application Tests', () => {
  it('hello world!', () => {
    expect(1 + 1).toBe(2)
  })

  it('bundler-config export has expected shape', async () => {
    const { viteConfig, webpackConfig, nextjsConfig, getBundlerConfig } = await import('./bundler-config')

    expect(typeof viteConfig).toBe('object')
    expect(typeof webpackConfig).toBe('object')
    expect(typeof nextjsConfig).toBe('object')
    expect(typeof getBundlerConfig).toBe('function')
  })

  it('built bundle can be required without throwing', async () => {
    // we don't ship types for the generated dist file, so silence TS here
    // (the runtime check below still runs during jest/vitest execution)
    // @ts-ignore
    const distPkg = await import('../dist/index.js')
    expect(distPkg).toHaveProperty('viteConfig')
  })
})

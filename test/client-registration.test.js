import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

test('client bundle registers the package identity requested by the boot graph', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  const registrations = []
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load: registration => registrations.push(registration) } },
  })
  assert.equal(registrations.length, 1)
  assert.equal(registrations[0].id, pkg.name)
  assert.equal(typeof registrations[0].factory, 'function')
})

/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '../data/language.ts'

// The stylesheet as plain text, so its colours can be read and measured.
// Tests run from the project root, and the bundler hands tests no CSS.
const css = readFileSync(resolve('src/styles/tokens.css'), 'utf8')

/** The custom properties declared in the block that follows a selector. */
function tokensOf(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) return {}
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  const tokens: Record<string, string> = {}
  for (const [, name, value] of body.matchAll(
    /(--[\w-]+):\s*(#[0-9a-f]{6})\s*;/gi,
  ))
    if (name && value) tokens[name] = value
  return tokens
}

const channel = (hex: string, i: number) => {
  const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminance = (hex: string) =>
  0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2)
/** WCAG contrast ratio between two colours, from 1 to 21. */
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

// French uses the base palette; every other language overrides it.
const light = (code: string) =>
  code === 'fr' ? ':root' : `:root[lang='${code}']`
const darkByPreference = (code: string) =>
  code === 'fr'
    ? ":root:not([data-theme='light'])"
    : `:root[lang='${code}']:not([data-theme='light'])`
const darkByChoice = (code: string) =>
  code === 'fr'
    ? ":root[data-theme='dark']"
    : `:root[lang='${code}'][data-theme='dark']`

const others = LANGUAGES.filter((l) => l.code !== 'fr')
const base = { light: tokensOf(':root'), dark: tokensOf(darkByChoice('fr')) }

describe.each(others)('the $code palette', ({ code }) => {
  const own = tokensOf(light(code))

  it('has its own ink, paper and margin colours', () => {
    for (const token of ['--ink', '--paper', '--sheet', '--pen', '--rule'])
      expect(own[token], token).toMatch(/^#[0-9a-f]{6}$/i)
    expect(own['--ink']).not.toBe(base.light['--ink'])
  })

  it('redefines for dark mode every colour it sets for light mode', () => {
    const tokens = Object.keys(own).sort()
    expect(Object.keys(tokensOf(darkByPreference(code))).sort()).toEqual(tokens)
    expect(Object.keys(tokensOf(darkByChoice(code))).sort()).toEqual(tokens)
  })

  it('uses the same dark colours whether dark is preferred or chosen', () => {
    expect(tokensOf(darkByPreference(code))).toEqual(
      tokensOf(darkByChoice(code)),
    )
  })

  it.each([
    ['light', own, base.light],
    ['dark', tokensOf(darkByChoice(code)), base.dark],
  ])('is readable in %s mode', (_mode, palette, fallback) => {
    const c = (token: string) => palette[token] ?? fallback[token] ?? ''
    const sheet = c('--sheet')
    // Body text and the learner's writing: comfortably readable.
    expect(contrast(c('--text'), sheet)).toBeGreaterThanOrEqual(7)
    expect(contrast(c('--ink'), sheet)).toBeGreaterThanOrEqual(7)
    // Everything else that is read as text: at least AA.
    for (const token of ['--muted', '--pen', '--ok', '--warn'])
      expect(contrast(c(token), sheet), token).toBeGreaterThanOrEqual(4.5)
    // Text on a filled button is the sheet colour on ink.
    expect(contrast(sheet, c('--ink'))).toBeGreaterThanOrEqual(7)
    // Muted text also sits on the page background.
    expect(contrast(c('--muted'), c('--paper'))).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the meanings apart: writing, correction and right are three colours', () => {
    const c = (token: string) => own[token] ?? base.light[token] ?? ''
    expect(new Set([c('--ink'), c('--pen'), c('--ok')]).size).toBe(3)
    // Ink and "right" must not be mistaken for each other at a glance.
    expect(contrast(c('--ink'), c('--ok'))).toBeGreaterThanOrEqual(1.5)
  })
})

describe('the palettes', () => {
  it('differ from one language to the next', () => {
    const inks = LANGUAGES.map((l) => tokensOf(light(l.code))['--ink'])
    expect(new Set(inks).size).toBe(LANGUAGES.length)
  })
})

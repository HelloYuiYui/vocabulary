import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(async () => {
  cleanup()
  // Let a step back the test started land, then start the next test at a
  // bare address.
  await new Promise((resolve) => setTimeout(resolve, 0))
  history.replaceState(null, '', location.pathname)
})

// jsdom implements neither of these.
window.matchMedia = (media: string): MediaQueryList => ({
  matches: false,
  media,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})
Element.prototype.scrollIntoView = () => undefined

// jsdom has <dialog> but neither of its methods.
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  if (!this.open) return
  this.open = false
  this.dispatchEvent(new Event('close'))
}

import { jest } from "@jest/globals"
import "@testing-library/jest-dom"

// Mock Web Worker for tests
global.Worker = class Worker {
  constructor(stringUrl) {
    this.url = stringUrl
    this.onmessage = null
  }

  postMessage(msg) {
    // Mock worker behavior for tests
    if (this.onmessage) {
      setTimeout(() => {
        this.onmessage({
          data: {
            ok: true,
            xml: "<mock>XML content</mock>",
            readable: { ids: { title: "Mock", rules: [] } },
          },
        })
      }, 0)
    }
  }

  terminate() {
    // Mock terminate
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
})

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mocked-url")
global.URL.revokeObjectURL = jest.fn()

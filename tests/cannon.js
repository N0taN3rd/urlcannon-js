import test from 'ava'
import * as fs from 'fs-extra'
import dataPaths from './data/dataPaths'
import { resolvePathDots } from '../lib/canon'

const testNames = {
  dots: 'resolve path dots'
}

test.beforeEach(async t => {
  if (t.title.includes(testNames.dots)) {
    t.context.data = await fs.readJSON(dataPaths.dotsPath)
  }
})

test(testNames.dots, t => {
  const { special, nonspecial } = t.context.data
  for (const [originalDotPath, expectedDotsPath] of Object.entries(special)) {
    t.is(
      resolvePathDots(originalDotPath, true),
      expectedDotsPath,
      `The special dots path ${originalDotPath} should have been resolved to ${expectedDotsPath}`
    )
  }
  for (const [originalDotPath, expectedDotsPath] of Object.entries(
    nonspecial
  )) {
    t.is(
      resolvePathDots(originalDotPath),
      expectedDotsPath,
      `The non-special dots path ${originalDotPath} should have been resolved to ${expectedDotsPath}`
    )
  }
})

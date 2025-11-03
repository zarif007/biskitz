import { diffLines } from 'diff'

export interface FileCollection {
  [path: string]: string
}

/**
 * Produces a Git-style merged diff between two FileCollection objects.
 * Each line is prefixed with:
 * [ADDED]   for new lines
 * [REMOVED] for deleted lines
 * [CONST]   for unchanged lines
 */
const fileDiff = (
  prevFiles: FileCollection,
  newFiles: FileCollection
): string => {
  let output = ''

  const allFileNames = Array.from(
    new Set([...Object.keys(prevFiles), ...Object.keys(newFiles)])
  )

  for (const filename of allFileNames) {
    const prevContent = prevFiles[filename] || ''
    const newContent = newFiles[filename] || ''

    const diff = diffLines(prevContent, newContent)

    for (const part of diff) {
      const tag = part.added
        ? '[ADDED]'
        : part.removed
        ? '[REMOVED]'
        : '[CONST]'

      const lines = part.value.split('\n')
      if (lines.at(-1) === '') lines.pop()

      for (const line of lines) {
        output += `${tag} ${line}\n`
      }
    }
  }

  return output.trimEnd()
}

export default fileDiff

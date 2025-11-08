import { diffLines } from 'diff'

export interface FileCollection {
  [path: string]: { mergedLines: string[]; lineStatus: string[] }
}

export interface FileDiffResult {
  [path: string]: {
    mergedLines: string[]
    lineStatus: string[]
  }
}

const fileDiff = (
  prevFiles: FileCollection,
  newFiles: FileCollection | Record<string, string>
): FileDiffResult => {
  const result: FileDiffResult = {}

  const allFileNames = Array.from(
    new Set([...Object.keys(prevFiles), ...Object.keys(newFiles)])
  )

  for (const filename of allFileNames) {
    const prevContent =
      typeof prevFiles[filename] === 'string'
        ? prevFiles[filename]
        : Array.isArray(prevFiles[filename]?.mergedLines)
        ? prevFiles[filename].mergedLines.join('\n')
        : ''

    const newContent =
      typeof newFiles[filename] === 'string'
        ? newFiles[filename]
        : Array.isArray(newFiles[filename]?.mergedLines)
        ? newFiles[filename].mergedLines.join('\n')
        : ''

    const diff = diffLines(prevContent, newContent)

    const mergedLines: string[] = []
    const lineStatus: ('|' | '-' | '+')[] = []

    for (const part of diff) {
      const lines = part.value.split('\n')
      if (lines.at(-1) === '') lines.pop()

      const status = part.added ? '+' : part.removed ? '-' : '|'
      for (const line of lines) {
        mergedLines.push(line)
        lineStatus.push(status)
      }
    }

    result[filename] = { mergedLines, lineStatus }
  }

  return result
}

export default fileDiff

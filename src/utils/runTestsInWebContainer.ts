import { WebContainer } from '@webcontainer/api'

interface Props {
  files: { [path: string]: string }
}

const convertToFileSystemTree = (files: { [path: string]: string }) => {
  const tree: any = {}
  Object.entries(files).forEach(([path, content]) => {
    const parts = path.split('/').filter(Boolean)
    let current = tree
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        current[part] = { file: { contents: content } }
      } else {
        if (!current[part]) current[part] = { directory: {} }
        if ('directory' in current[part]) {
          current = current[part].directory
        }
      }
    }
  })
  return tree
}

export async function runTestsInWebContainer({ files }: Props) {
  console.log('🚀 Booting WebContainer...')
  const webcontainer = await WebContainer.boot()
  console.log('✅ WebContainer booted')

  const tree = convertToFileSystemTree(files)
  await webcontainer.mount(tree)

  console.log('📥 Running npm install...')
  const installProcess = await webcontainer.spawn('npm', ['install'])

  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log('npm:', data)
      },
    })
  )

  await installProcess.exit
  console.log('✅ npm install complete')

  console.log('🧪 Running Vitest...')

  let stdout = ''
  let stderr = ''

  const testProcess = await webcontainer.spawn('npx', [
    'vitest',
    'run',
    '--reporter=json',
    '--outputFile=test-results.json',
  ])

  // Capture both stdout and stderr
  testProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log('vitest stdout:', data)
        stdout += data
      },
    })
  )

  const exitCode = await testProcess.exit
  console.log('🧪 Vitest finished with exit code:', exitCode)
  console.log('Stdout length:', stdout.length)
  console.log('First 500 chars:', stdout.substring(0, 500))

  // Try reading from the output file instead
  try {
    const resultsFile = await webcontainer.fs.readFile(
      'test-results.json',
      'utf-8'
    )
    console.log('✅ Read results from file')
    return JSON.parse(resultsFile)
  } catch (fileError) {
    console.log('❌ Could not read file, trying to parse stdout')

    // Try to extract JSON from stdout
    const jsonMatch = stdout.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error(`Could not parse test results. Output: ${stdout}`)
  }
}

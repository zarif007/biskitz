const parseMarkdown = (markdown: string) => {
  if (!markdown) return ''

  let html = markdown
    .replace(
      /^### (.*$)/gim,
      '<h3 class="text-lg font-semibold mb-3 mt-6 text-gray-800 dark:text-gray-100">$1</h3>'
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-semibold mb-4 mt-8 text-gray-800 dark:text-gray-100">$1</h2>'
    )
    .replace(
      /^# (.*$)/gim,
      '<h1 class="text-2xl font-bold mb-6 mt-8 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">$1</h1>'
    )
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>'
    )
    .replace(
      /\*(.*?)\*/g,
      '<em class="italic text-gray-800 dark:text-gray-200">$1</em>'
    )
    .replace(
      /```([\s\S]*?)```/g,
      '<div class="bg-gray-100 dark:bg-gray-950 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre">$1</code></div>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 dark:bg-gray-950 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">$1</code>'
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors">$1</a>'
    )
    .replace(
      /^\* (.*$)/gim,
      '<li class="ml-4 mb-1 text-gray-700 dark:text-gray-300">• $1</li>'
    )
    .replace(
      /^\d+\. (.*$)/gim,
      '<li class="ml-4 mb-1 text-gray-700 dark:text-gray-300 list-decimal">$1</li>'
    )
    .replace(
      /^> (.*$)/gim,
      '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic text-gray-700 dark:text-gray-300">$1</blockquote>'
    )
    .replace(/\n/g, '<br />')

  return html
}
export default parseMarkdown

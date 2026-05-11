import { useState } from "react"

interface Props {
  title: string
  script: string
  onRegenerate: () => void
  onBack: () => void
  loading: boolean
}

export default function ScriptPreview({
  title,
  script,
  onRegenerate,
  onBack,
  loading,
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(title + "\n\n" + script)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = title + "\n\n" + script
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Render script with pause markers highlighted
  const renderScript = (text: string) => {
    return text.split(/(【停】)/g).map((part, i) =>
      part === "【停】" ? (
        <span
          key={i}
          className="inline-block bg-rose-100 text-rose-600 text-xs px-1.5 py-0.5 rounded font-medium mx-0.5 align-middle"
        >
          停
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  return (
    <div className="space-y-4">
      {/* 返回和重新生成 */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ← 重新填写
        </button>
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="flex-1 py-2.5 border border-rose-300 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "生成中..." : "🔄 换一版"}
        </button>
      </div>

      {/* 脚本预览 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-800 text-lg mb-3 border-b pb-2">
          {title}
        </h3>
        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
          {renderScript(script)}
        </div>
      </div>

      {/* 动作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
            copied
              ? "bg-green-500 text-white"
              : "bg-gray-800 text-white hover:bg-gray-900"
          }`}
        >
          {copied ? "✅ 已复制" : "📋 复制脚本"}
        </button>
        <button
          onClick={() => {
            const blob = new Blob([title + "\n\n" + script], {
              type: "text/plain",
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${title}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="py-3 px-4 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          💾 下载
        </button>
      </div>

      {/* 脚本统计 */}
      <div className="text-xs text-gray-400 text-center">
        共 {script.length} 字 · 约 {Math.ceil(script.length / 4)} 秒口播
      </div>
    </div>
  )
}

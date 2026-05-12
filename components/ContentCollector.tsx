import { useState } from "react"

interface Topic {
  id: string
  title: string
  type: string
  source: string
  note: string
  used: boolean
  createdAt: string
}

interface AnalysisResult {
  type: string
  title: string
  summary: string
  sourceAuthor: string
}

function loadTopics(): Topic[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("zhangqing_topics")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTopics(topics: Topic[]) {
  localStorage.setItem("zhangqing_topics", JSON.stringify(topics))
}

export default function ContentCollector() {
  const [sourceUrl, setSourceUrl] = useState("")
  const [content, setContent] = useState("")
  const [fetching, setFetching] = useState(false)
  const [fetchHint, setFetchHint] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [saved, setSaved] = useState(false)

  const handleFetchUrl = async () => {
    if (!sourceUrl.trim().startsWith("http")) {
      setFetchHint("请输入完整链接（以 http 开头）")
      return
    }
    setFetching(true)
    setFetchHint("")
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl.trim() }),
      })
      const data = await res.json()

      if (data.success && data.content) {
        setContent(data.content)
        setFetchHint("✅ " + data.hint)
      } else {
        setFetchHint("⚠️ " + data.hint)
      }
    } catch {
      setFetchHint("⚠️ 网络错误，请手动粘贴文案")
    } finally {
      setFetching(false)
    }
  }

  const handleAnalyze = async () => {
    if (content.trim().length < 20) {
      setError("内容太短，至少20字。如果链接抓取失败，请手动复制文案粘贴到输入框")
      return
    }
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/classify-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "分析失败")
      }
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || "网络错误")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!result) return
    const topics = loadTopics()
    const topic: Topic = {
      id: Date.now().toString(),
      title: result.title,
      type: result.type,
      source: [result.sourceAuthor, sourceUrl].filter(Boolean).join(" · "),
      note: result.summary,
      used: false,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    topics.unshift(topic)
    saveTopics(topics)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    setContent("")
    setSourceUrl("")
    setResult(null)
    setError("")
    setFetchHint("")
  }

  const typeColors: Record<string, string> = {
    故事型: "bg-blue-100 text-blue-700",
    点评型: "bg-purple-100 text-purple-700",
    观点型: "bg-amber-100 text-amber-700",
    干货型: "bg-green-100 text-green-700",
  }

  return (
    <div className="space-y-4">
      {/* 链接输入 + 抓取 */}
      <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            粘贴抖音/小红书链接（优先尝试自动抓取）
          </label>
          <div className="flex gap-2">
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFetchUrl()
              }}
              placeholder="如：https://v.douyin.com/xxxxx/ 或 https://www.xiaohongshu.com/explore/xxxxx"
              className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none"
            />
            <button
              onClick={handleFetchUrl}
              disabled={fetching}
              className="px-4 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {fetching ? "抓取中..." : "抓取内容"}
            </button>
          </div>
        </div>

        {fetchHint && (
          <div
            className={`p-2.5 rounded-lg text-xs whitespace-pre-line ${
              fetchHint.startsWith("✅")
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-amber-50 border border-amber-200 text-amber-700"
            }`}
          >
            {fetchHint}
          </div>
        )}

        {/* 分割线 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">或手动粘贴</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="直接把竞品的小红书文案、抖音口播文案粘贴到这里……"
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none resize-none"
          />
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex-1 py-2.5 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "AI 分析中..." : "🔍 AI 分析分类"}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2.5 border border-gray-300 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      {/* 分析结果 */}
      {result && (
        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            📋 分析结果
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                typeColors[result.type] || "bg-gray-100 text-gray-600"
              }`}
            >
              {result.type}
            </span>
          </h3>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-gray-400">标题</span>
              <p className="text-gray-800 font-medium">{result.title}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">摘要</span>
              <p className="text-gray-600">{result.summary}</p>
            </div>
            {result.sourceAuthor && (
              <div>
                <span className="text-xs text-gray-400">来源</span>
                <p className="text-gray-500">{result.sourceAuthor}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              saved
                ? "bg-green-500 text-white"
                : "bg-gray-800 text-white hover:bg-gray-900"
            }`}
          >
            {saved ? "✅ 已保存到选题库" : "📥 确认存入选题库"}
          </button>
        </div>
      )}

      {/* 使用提示 */}
      <div className="p-3 bg-gray-100 rounded-xl">
        <p className="text-xs text-gray-500">
          💡 <strong>方式一：</strong>粘贴链接 → 点"抓取内容"自动提取（抖音/小红书可能拦截，属正常现象）
          <br />
          💡 <strong>方式二：</strong>手动复制文案 → 粘贴到输入框 → 点"AI 分析分类" → 确认存入选题库
        </p>
      </div>
    </div>
  )
}

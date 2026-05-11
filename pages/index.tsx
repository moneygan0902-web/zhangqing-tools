import { useState, useCallback } from "react"
import ScriptForm from "../components/ScriptForm"
import ScriptPreview from "../components/ScriptPreview"
import WeekPlanner from "../components/WeekPlanner"
import TopicLibrary from "../components/TopicLibrary"

type Tab = "script" | "week" | "topics"

interface SavedScript {
  id: string
  title: string
  script: string
  type: string
  createdAt: string
}

function loadSavedScripts(): SavedScript[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("zhangqing_scripts")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveScriptToLocal(script: SavedScript) {
  const scripts = loadSavedScripts()
  scripts.unshift(script)
  localStorage.setItem("zhangqing_scripts", JSON.stringify(scripts.slice(0, 50)))
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("script")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    title: string
    script: string
    type: string
    caseInfo: string
    extraNotes: string
  } | null>(null)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const handleGenerate = useCallback(
    async (data: { type: string; caseInfo: string; extraNotes: string }) => {
      setLoading(true)
      setError("")
      setSaved(false)
      try {
        const res = await fetch("/api/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || "生成失败")
        }

        const json = await res.json()
        setResult({ ...json, ...data })
      } catch (err: any) {
        setError(err.message || "网络错误，请重试")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleRegenerate = useCallback(() => {
    if (result) {
      handleGenerate({
        type: result.type,
        caseInfo: result.caseInfo,
        extraNotes: result.extraNotes,
      })
    }
  }, [result, handleGenerate])

  const handleSave = () => {
    if (!result) return
    saveScriptToLocal({
      id: Date.now().toString(),
      title: result.title,
      script: result.script,
      type: result.type,
      createdAt: new Date().toISOString().slice(0, 10),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "script", label: "生脚本", emoji: "✍️" },
    { id: "week", label: "周计划", emoji: "📅" },
    { id: "topics", label: "选题库", emoji: "📚" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                张清 · 红娘口播助手
              </h1>
              <p className="text-xs text-gray-400">脚本生成 · 选题管理</p>
            </div>
          </div>

          {/* Tab 导航 */}
          <nav className="flex gap-1 mt-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setResult(null)
                  setError("")
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="mr-1">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-20">
        {activeTab === "script" && (
          <div className="space-y-5">
            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                ❌ {error}
              </div>
            )}

            {/* 生成结果展示 */}
            {result && !loading ? (
              <div className="space-y-4">
                <ScriptPreview
                  title={result.title}
                  script={result.script}
                  onRegenerate={handleRegenerate}
                  onBack={() => setResult(null)}
                  loading={loading}
                />
                <button
                  onClick={handleSave}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                    saved
                      ? "bg-green-500 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {saved ? "✅ 已保存" : "💾 保存到本地"}
                </button>
              </div>
            ) : (
              <ScriptForm onGenerate={handleGenerate} loading={loading} />
            )}

            {/* 最近保存的脚本 */}
            <SavedScriptsList />
          </div>
        )}

        {activeTab === "week" && <WeekPlanner />}
        {activeTab === "topics" && <TopicLibrary />}
      </main>
    </div>
  )
}

function SavedScriptsList() {
  const [scripts, setScripts] = useState<SavedScript[]>([])

  useState(() => {
    setScripts(loadSavedScripts())
  })

  if (scripts.length === 0) return null

  return (
    <div className="pt-4 border-t border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        最近保存的脚本
      </h3>
      <div className="space-y-2">
        {scripts.slice(0, 5).map((s) => (
          <div
            key={s.id}
            className="p-3 bg-white border border-gray-200 rounded-xl"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-800 truncate">
                {s.title}
              </span>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {s.type}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{s.script}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

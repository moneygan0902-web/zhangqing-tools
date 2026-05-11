import { useState } from "react"

interface Props {
  onGenerate: (data: {
    type: string
    caseInfo: string
    extraNotes: string
  }) => void
  loading: boolean
}

const CONTENT_TYPES = [
  { id: "故事型", label: "故事型", desc: "真实客户案例", emoji: "📖" },
  { id: "点评型", label: "点评型", desc: "分析人/现象", emoji: "🎯" },
  { id: "观点型", label: "观点型", desc: "说大实话", emoji: "💡" },
  { id: "干货型", label: "干货型", desc: "实操建议", emoji: "📝" },
]

export default function ScriptForm({ onGenerate, loading }: Props) {
  const [type, setType] = useState("故事型")
  const [caseInfo, setCaseInfo] = useState("")
  const [extraNotes, setExtraNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate({ type, caseInfo, extraNotes })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 内容类型选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ① 内容类型
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.id}
              type="button"
              onClick={() => setType(ct.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                type === ct.id
                  ? "border-rose-400 bg-rose-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{ct.emoji}</span>
                <div>
                  <div className="font-medium text-gray-800 text-sm">
                    {ct.label}
                  </div>
                  <div className="text-xs text-gray-500">{ct.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 案例信息 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ② 案例信息
        </label>
        <p className="text-xs text-gray-400 mb-2">
          填得越具体，生成的脚本越好。比如：年龄、职业、核心事件、冲突点
        </p>
        <textarea
          value={caseInfo}
          onChange={(e) => setCaseInfo(e.target.value)}
          rows={4}
          placeholder="例如：35岁女生，银行工作，各方面条件都不错，但相亲了十几次都没成。最近终于找到了，对方是个离异带娃的程序员..."
          className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none resize-none"
        />
      </div>

      {/* 补充说明 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ③ 补充说明（选填）
        </label>
        <textarea
          value={extraNotes}
          onChange={(e) => setExtraNotes(e.target.value)}
          rows={2}
          placeholder="比如：想突出什么观点、不希望提到什么、想用什么语气..."
          className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none resize-none"
        />
      </div>

      {/* 生成按钮 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 active:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            正在生成...
          </span>
        ) : (
          "✨ 生成脚本"
        )}
      </button>
    </form>
  )
}

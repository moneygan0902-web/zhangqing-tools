import { useState } from "react"

interface WeekPlanItem {
  day: string
  type: string
  title: string
  brief: string
}

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

export default function WeekPlanner() {
  const [ideas, setIdeas] = useState("")
  const [preferences, setPreferences] = useState("")
  const [loading, setLoading] = useState(false)
  const [weekPlan, setWeekPlan] = useState<WeekPlanItem[]>([])
  const [error, setError] = useState("")

  const ideaList = ideas
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)

  const handleGenerate = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/generate-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideas: ideaList, preferences }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "生成失败")
      }

      const data = await res.json()
      if (data.weekPlan && data.weekPlan.length > 0) {
        setWeekPlan(data.weekPlan)
      } else if (data.rawText) {
        setError("AI返回格式有误，请重试")
      }
    } catch (err: any) {
      setError(err.message || "生成失败")
    } finally {
      setLoading(false)
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case "故事型":
        return "bg-blue-100 text-blue-700"
      case "点评型":
        return "bg-purple-100 text-purple-700"
      case "观点型":
        return "bg-amber-100 text-amber-700"
      case "干货型":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="space-y-5">
      {/* 灵感输入 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          这周的选题灵感（一行一个）
        </label>
        <textarea
          value={ideas}
          onChange={(e) => setIdeas(e.target.value)}
          rows={4}
          placeholder={`相亲第一次见面要不要AA\n三十岁女生该不该降低标准\n我介绍成功的一对给我的启示`}
          className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none resize-none"
        />
      </div>

      {/* 偏好 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          本周想侧重什么（选填）
        </label>
        <input
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="比如：多讲30+女生的案例、侧重武汉本地"
          className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none"
        />
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-3.5 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 active:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            正在规划...
          </span>
        ) : (
          "📅 生成本周计划"
        )}
      </button>

      {/* 错误 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 周计划展示 */}
      {weekPlan.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-800">本周内容日历</h3>
          <div className="space-y-2">
            {weekPlan.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-xs font-medium text-rose-600 flex-shrink-0">
                  {DAYS[i] || `D${i + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${typeColor(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>
                    <span className="font-medium text-gray-800 text-sm truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{item.brief}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

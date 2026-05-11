import { useState, useEffect } from "react"

interface Topic {
  id: string
  title: string
  type: string
  source: string
  note: string
  used: boolean
  createdAt: string
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

export default function TopicLibrary() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [filter, setFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [newTopic, setNewTopic] = useState({
    title: "",
    type: "故事型",
    source: "",
    note: "",
  })

  useEffect(() => {
    setTopics(loadTopics())
  }, [])

  const addTopic = () => {
    if (!newTopic.title.trim()) return
    const topic: Topic = {
      id: Date.now().toString(),
      ...newTopic,
      used: false,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    const updated = [topic, ...topics]
    setTopics(updated)
    saveTopics(updated)
    setNewTopic({ title: "", type: "故事型", source: "", note: "" })
    setShowForm(false)
  }

  const toggleUsed = (id: string) => {
    const updated = topics.map((t) =>
      t.id === id ? { ...t, used: !t.used } : t
    )
    setTopics(updated)
    saveTopics(updated)
  }

  const deleteTopic = (id: string) => {
    const updated = topics.filter((t) => t.id !== id)
    setTopics(updated)
    saveTopics(updated)
  }

  const filtered = topics.filter((t) => {
    if (filter === "used") return t.used
    if (filter === "unused") return !t.used
    if (filter !== "all") return t.type === filter
    return true
  })

  const typeColors: Record<string, string> = {
    故事型: "bg-blue-100 text-blue-700",
    点评型: "bg-purple-100 text-purple-700",
    观点型: "bg-amber-100 text-amber-700",
    干货型: "bg-green-100 text-green-700",
  }

  return (
    <div className="space-y-5">
      {/* 操作栏 */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-1 overflow-x-auto pb-1">
          {["all", "unused", "used", "故事型", "点评型", "观点型", "干货型"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === f
                    ? "bg-rose-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all"
                  ? "全部"
                  : f === "unused"
                  ? "未用过"
                  : f === "used"
                  ? "已用过"
                  : f}
              </button>
            )
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-900 transition-colors whitespace-nowrap"
        >
          ＋ 新选题
        </button>
      </div>

      {/* 添加表单 */}
      {showForm && (
        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
          <input
            value={newTopic.title}
            onChange={(e) =>
              setNewTopic({ ...newTopic, title: e.target.value })
            }
            placeholder="选题标题"
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none"
          />
          <div className="flex gap-2">
            <select
              value={newTopic.type}
              onChange={(e) =>
                setNewTopic({ ...newTopic, type: e.target.value })
              }
              className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="故事型">故事型</option>
              <option value="点评型">点评型</option>
              <option value="观点型">观点型</option>
              <option value="干货型">干货型</option>
            </select>
            <input
              value={newTopic.source}
              onChange={(e) =>
                setNewTopic({ ...newTopic, source: e.target.value })
              }
              placeholder="来源（如：抖音@文卓）"
              className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none"
            />
          </div>
          <textarea
            value={newTopic.note}
            onChange={(e) =>
              setNewTopic({ ...newTopic, note: e.target.value })
            }
            placeholder="备注（选填）"
            rows={2}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={addTopic}
              className="flex-1 py-2.5 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors"
            >
              添加
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="py-2.5 px-4 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 列表 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            还没有选题，点"+新选题"添加
          </div>
        )}
        {filtered.map((topic) => (
          <div
            key={topic.id}
            className={`p-3 border rounded-xl transition-colors ${
              topic.used
                ? "border-gray-200 bg-gray-50 opacity-70"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      typeColors[topic.type] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {topic.type}
                  </span>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {topic.title}
                  </span>
                </div>
                {topic.source && (
                  <p className="text-xs text-gray-400 ml-0">{topic.source}</p>
                )}
                {topic.note && (
                  <p className="text-xs text-gray-500 mt-1">{topic.note}</p>
                )}
                <p className="text-xs text-gray-300 mt-1">{topic.createdAt}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleUsed(topic.id)}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                    topic.used
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {topic.used ? "✓" : "○"}
                </button>
                <button
                  onClick={() => deleteTopic(topic.id)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 统计 */}
      <div className="text-xs text-gray-400 text-center">
        共 {topics.length} 条选题 · {topics.filter((t) => t.used).length} 已用
        · {topics.filter((t) => !t.used).length} 待用
      </div>
    </div>
  )
}

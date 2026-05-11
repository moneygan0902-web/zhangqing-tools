import type { NextApiRequest, NextApiResponse } from "next"
import { generateWithGemini, sanitizeScript } from "../../lib/gemini"
import { buildScriptPrompt } from "../../lib/prompts"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST" })
  }

  const { type, caseInfo, extraNotes } = req.body

  if (!type) {
    return res.status(400).json({ error: "请选择内容类型" })
  }

  const validTypes = ["故事型", "点评型", "观点型", "干货型"]
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "无效的内容类型" })
  }

  try {
    const prompt = buildScriptPrompt(type, caseInfo || "", extraNotes || "")
    const rawScript = await generateWithGemini(prompt)
    const script = sanitizeScript(rawScript)

    // 尝试提取标题（第一行）
    const lines = script.split("\n").filter((l: string) => l.trim())
    const title =
      lines.length > 0
        ? lines[0].replace(/^#+\s*/, "").replace(/标题[：:]\s*/, "")
        : `${type}脚本`

    return res.status(200).json({ script, title })
  } catch (err: any) {
    console.error("生成失败:", err)
    return res.status(500).json({
      error: err.message || "生成失败，请重试",
    })
  }
}

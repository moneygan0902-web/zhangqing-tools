import type { NextApiRequest, NextApiResponse } from "next"
import { generateWithGemini } from "../../lib/gemini"
import { buildWeekPlanPrompt } from "../../lib/prompts"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST" })
  }

  const { ideas, preferences } = req.body

  try {
    const prompt = buildWeekPlanPrompt(ideas || [], preferences || "")
    const raw = await generateWithGemini(prompt)

    // Try to parse JSON from the response
    const cleaned = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()

    try {
      const parsed = JSON.parse(cleaned)
      return res.status(200).json(parsed)
    } catch {
      // If JSON parsing fails, return raw text
      return res.status(200).json({
        weekPlan: [],
        rawText: raw,
        note: "JSON解析失败，请查看原始内容",
      })
    }
  } catch (err: any) {
    console.error("生成周计划失败:", err)
    return res.status(500).json({
      error: err.message || "生成失败，请重试",
    })
  }
}

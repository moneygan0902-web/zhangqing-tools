import type { NextApiRequest, NextApiResponse } from "next"
import { generateWithGemini } from "../../lib/gemini"

const CLASSIFY_PROMPT = `你是一个内容分类助手。分析以下婚恋/相亲相关内容，输出 JSON。

判断内容属于哪种类型：
— 故事型：讲具体客户案例，有人物有情节
— 点评型：分析某种现象或某一类人
— 观点型：表达对某个争议话题的看法
— 干货型：给实用建议或避坑指南

提取：
1. type：以上4种之一
2. title：吸引人的标题，15字以内
3. summary：2-3句话概括核心内容，100字以内
4. sourceAuthor：如果能看出作者/博主名就填，否则留空

严格输出JSON格式，不要有其他文字：
{"type":"故事型","title":"...","summary":"...","sourceAuthor":"..."}`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST" })
  }

  const { content, sourceUrl } = req.body

  if (!content || content.trim().length < 20) {
    return res.status(400).json({ error: "内容太短，至少20字" })
  }

  try {
    const prompt = `${CLASSIFY_PROMPT}\n\n${sourceUrl ? `来源链接：${sourceUrl}\n` : ""}内容：\n${content.trim().slice(0, 2000)}`

    const raw = await generateWithGemini(prompt)

    // 提取 JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("AI 返回格式异常，请重试")
    }

    const result = JSON.parse(jsonMatch[0])

    return res.status(200).json({
      type: result.type || "故事型",
      title: result.title || "未命名",
      summary: result.summary || "",
      sourceAuthor: result.sourceAuthor || "",
    })
  } catch (err: any) {
    console.error("分类失败:", err)
    return res.status(500).json({
      error: err.message || "分析失败，请重试",
    })
  }
}

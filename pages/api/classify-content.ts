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

function extractJson(raw: string): any {
  // 1. 尝试从 markdown 代码块中提取
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1].trim()) } catch {}
  }

  // 2. 尝试匹配最外层 JSON 对象
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    let jsonStr = jsonMatch[0]
    // 清理常见问题：尾部逗号、换行中的非法字符
    jsonStr = jsonStr.replace(/,\s*}/g, "}")
    try { return JSON.parse(jsonStr) } catch {}
  }

  // 3. 最后尝试：找到第一个 { 到最后一个 }
  const firstBrace = raw.indexOf("{")
  const lastBrace = raw.lastIndexOf("}")
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const jsonStr = raw.slice(firstBrace, lastBrace + 1)
    try { return JSON.parse(jsonStr) } catch {}
  }

  return null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST" })
  }

  const { content, sourceUrl } = req.body

  if (!content || content.trim().length < 20) {
    return res.status(400).json({
      error: "内容太短，至少20字。如果链接抓取失败，请手动复制视频文案粘贴到输入框。",
    })
  }

  // 检测是否粘贴了 HTML 源码而非文案
  const trimmed = content.trim()
  if (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    (trimmed.includes("<div") && trimmed.includes("</div>") && trimmed.length > 500)
  ) {
    return res.status(400).json({
      error: "检测到粘贴的是网页代码而非文案内容。请复制视频的文字描述/字幕，不要复制网页源码。",
    })
  }

  try {
    const prompt = `${CLASSIFY_PROMPT}\n\n${sourceUrl ? `来源链接：${sourceUrl}\n` : ""}内容：\n${trimmed.slice(0, 2000)}`

    const raw = await generateWithGemini(prompt)

    const result = extractJson(raw)
    if (!result) {
      // 再试一次，用更强的指令
      const retryPrompt = `${prompt}\n\n注意：只输出一行纯JSON，不要任何解释、不要markdown代码块、不要换行。`
      const retryRaw = await generateWithGemini(retryPrompt)
      const retryResult = extractJson(retryRaw)
      if (!retryResult) {
        throw new Error(`AI 返回格式异常，请重试。原始返回：${raw.slice(0, 100)}`)
      }
      return res.status(200).json({
        type: retryResult.type || "故事型",
        title: retryResult.title || "未命名",
        summary: retryResult.summary || "",
        sourceAuthor: retryResult.sourceAuthor || "",
      })
    }

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

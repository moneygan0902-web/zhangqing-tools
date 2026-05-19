import { PERSONA, TYPE_GUIDES } from "./persona"

export function buildScriptPrompt(
  type: string,
  caseInfo: string,
  extraNotes: string
): string {
  const typeGuide = TYPE_GUIDES[type] || ""

  let prompt = `${PERSONA}

${typeGuide}

请生成一条「${type}」口播脚本。

用户提供的素材：
${caseInfo || "（没有额外素材，请根据类型自由创作）"}
${extraNotes ? `补充说明：${extraNotes}` : ""}

输出格式要求（重要）：
— 标题用纯文字，不要用任何Markdown符号（不要##、**、****等）
— 正文也是纯文字，自然分段即可
— 正文中用【停】标注停顿处
— 结尾自然引导私信"缘分"，不要生硬
— 字数控制在1000–1200字`

  return prompt
}

export function buildWeekPlanPrompt(
  ideas: string[],
  preferences: string
): string {
  const ideasText = ideas.length > 0
    ? ideas.map((idea, i) => `${i + 1}. ${idea}`).join("\n")
    : "暂无灵感，请根据常见婚恋话题自由发挥"

  return `${PERSONA}

请帮我规划下周7天的口播脚本选题。

要求：
— 7天覆盖4种类型：故事型2条、点评型2条、观点型2条、干货型1条
— 每天一个选题，要有标题和一句话说明
— 选题要有节奏感，不要连着几天发同一类型
— 结合这些灵感：
${ideasText}
${preferences ? `\n用户偏好：${preferences}` : ""}

输出JSON格式：
{
  "weekPlan": [
    {"day": "周一", "type": "故事型", "title": "...", "brief": "一句话说明"},
    ...
  ]
}`
}

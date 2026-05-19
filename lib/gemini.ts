import { SocksProxyAgent } from "socks-proxy-agent"
import fetch from "node-fetch"

// 按稳定性排序，2.5-flash 最不稳定但质量好，2.0-flash 最稳定
const MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"]
const API_KEY = process.env.GEMINI_API_KEY || ""
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

const isDev = process.env.NODE_ENV !== "production"
const proxyAgent = isDev ? new SocksProxyAgent("socks5://127.0.0.1:10808") : null

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function apiFetch(url: string, body: any): Promise<any> {
  const options: any = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
  if (proxyAgent) {
    options.agent = proxyAgent
  }
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API 请求失败 (${res.status}): ${err}`)
  }
  return res.json()
}

async function tryModel(model: string, prompt: string): Promise<string> {
  const data = await apiFetch(
    `${BASE_URL}/models/${model}:generateContent?key=${API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 6144,
      },
    }
  )
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error(`${model} 返回了空内容`)
  }
  return text
}

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("请在环境变量中设置 GEMINI_API_KEY")
  }

  let lastError = ""

  // 依次尝试每个模型，每个最多重试4次，间隔递增
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const text = await tryModel(model, prompt)
        return text
      } catch (err: any) {
        lastError = err.message
        // 503=拥堵，429=限流，这些值得重试
        if (err.message.includes("503") || err.message.includes("429")) {
          await sleep(5000 * (attempt + 1))
          continue
        }
        // 其他错误不重试当前模型，直接试下一个
        break
      }
    }
  }

  throw new Error(
    `所有模型暂时不可用，请稍后重试。${lastError ? ` (${lastError})` : ""}`
  )
}

export function sanitizeScript(script: string): string {
  let cleaned = script
    // 去掉Markdown标题标记
    .replace(/^#{1,6}\s*/gm, "")
    // 去掉加粗/斜体
    .replace(/\*{1,3}/g, "")
    .replace(/_{1,3}/g, "")
    // 去掉多余空行
    .replace(/\n{3,}/g, "\n\n")
  if (!cleaned.includes("缘分") && !cleaned.includes("私信")) {
    cleaned += `\n\n我是张清，在武汉做了十几年红娘。如果你想找人聊聊，私信我"缘分"。`
  }
  return cleaned.trim()
}

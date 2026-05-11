import { SocksProxyAgent } from "socks-proxy-agent"
import fetch from "node-fetch"

const MODEL = "gemini-2.5-flash"
const API_KEY = process.env.GEMINI_API_KEY || ""
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

const isDev = process.env.NODE_ENV !== "production"
const proxyAgent = isDev ? new SocksProxyAgent("socks5://127.0.0.1:10808") : null

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

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("请在环境变量中设置 GEMINI_API_KEY")
  }

  const data = await apiFetch(
    `${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }
  )

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error("Gemini 返回了空内容，请重试")
  }

  return text
}

export function sanitizeScript(script: string): string {
  let cleaned = script.replace(/\n{3,}/g, "\n\n")
  if (!cleaned.includes("缘分") && !cleaned.includes("私信")) {
    cleaned += `\n\n我是张清，在武汉做了十几年红娘。如果你想找人聊聊，私信我"缘分"。`
  }
  return cleaned.trim()
}

import { SocksProxyAgent } from "socks-proxy-agent"
import fetch from "node-fetch"
import { GoogleAuth } from "google-auth-library"

const MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"]
const API_KEY = process.env.GEMINI_API_KEY || ""
const VERTEX_KEY_JSON = process.env.GEMINI_VERTEX_KEY || ""
const VERTEX_PROJECT = process.env.GEMINI_PROJECT_ID || ""

// Gemini API (API Key 方式)
const API_BASE = "https://generativelanguage.googleapis.com/v1beta"

// Vertex AI (服务账号方式)
const VERTEX_LOCATION = "us-central1"

let vertexAuth: GoogleAuth | null = null
let vertexToken: { token: string; expires: number } | null = null

function getVertexAuth(): GoogleAuth {
  if (!vertexAuth) {
    const cleanJson = VERTEX_KEY_JSON.replace(/^﻿/, "")
    const key = JSON.parse(cleanJson)
    vertexAuth = new GoogleAuth({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    })
  }
  return vertexAuth
}

async function getVertexToken(): Promise<string> {
  if (vertexToken && Date.now() < vertexToken.expires - 60000) {
    return vertexToken.token
  }
  const auth = getVertexAuth()
  const client = await auth.getClient()
  const tokenResponse = await (client as any).getAccessToken()
  vertexToken = {
    token: tokenResponse.token || (tokenResponse as any).access_token,
    expires: Date.now() + 50 * 60 * 1000,
  }
  return vertexToken.token
}

const isDev = process.env.NODE_ENV !== "production"
const proxyAgent = isDev ? new SocksProxyAgent("socks5://127.0.0.1:10808") : null

// 优先用 Vertex AI，其次 API Key
const useVertex = !!VERTEX_KEY_JSON

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function apiFetch(url: string, body: any, headers?: Record<string, string>): Promise<any> {
  const options: any = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
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
  const text = await res.text()
  return JSON.parse(text.replace(/^﻿/, ""))
}

async function tryModel(model: string, prompt: string): Promise<string> {
  let url: string
  let headers: Record<string, string> = {}

  if (useVertex) {
    const token = await getVertexToken()
    url = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/${model}:generateContent`
    headers = { Authorization: `Bearer ${token}` }
  } else {
    url = `${API_BASE}/models/${model}:generateContent?key=${API_KEY}`
  }

  const data = await apiFetch(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 6144,
    },
  }, headers)

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error(`${model} 返回了空内容`)
  }
  return text
}

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!useVertex && !API_KEY) {
    throw new Error("请在环境变量中设置 GEMINI_API_KEY 或 GEMINI_VERTEX_KEY")
  }
  if (useVertex && !VERTEX_PROJECT) {
    throw new Error("请在环境变量中设置 GEMINI_PROJECT_ID")
  }

  let lastError = ""

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const text = await tryModel(model, prompt)
        return text
      } catch (err: any) {
        lastError = err.message
        if (err.message.includes("503") || err.message.includes("429")) {
          await sleep(5000 * (attempt + 1))
          continue
        }
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
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*{1,3}/g, "")
    .replace(/_{1,3}/g, "")
    .replace(/\n{3,}/g, "\n\n")
  if (!cleaned.includes("缘分") && !cleaned.includes("私信")) {
    cleaned += `\n\n我是张清，在武汉做了十几年红娘。如果你想找人聊聊，私信我"缘分"。`
  }
  return cleaned.trim()
}

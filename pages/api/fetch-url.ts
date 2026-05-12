import type { NextApiRequest, NextApiResponse } from "next"

// 服务端尝试抓取链接内容（Vercel 服务器在美国，抖音基本拿不到，小红书可能拿到）

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST" })
  }

  const { url } = req.body

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "请输入有效的链接" })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      redirect: "follow",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const html = await response.text()

    // 提取 meta 信息
    const getMeta = (name: string, prop = false): string => {
      if (prop) {
        const match = html.match(
          new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")
        )
        return match?.[1] || ""
      }
      const match = html.match(
        new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")
      )
      return match?.[1] || ""
    }

    const title =
      getMeta("og:title", true) ||
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ||
      ""
    const description =
      getMeta("og:description", true) ||
      getMeta("description") ||
      ""

    // 提取正文（尝试常见选择器对应的区域）
    let bodyText = ""
    const bodyMatch = html.match(
      /<(?:article|div)[^>]*(?:class|id)=["'](?:[^"']*content[^"']*|note-text|desc|detail-desc)[^"']*["'][^>]*>([\s\S]*?)<\/(?:article|div)>/i
    )
    if (bodyMatch) {
      bodyText = bodyMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    }

    // 拼接结果
    let content = [title, description, bodyText].filter(Boolean).join("\n\n")

    if (!content || content.length < 30) {
      return res.status(200).json({
        success: false,
        title: title || "",
        hint:
          "无法自动提取内容。这可能是因为：\n" +
          "1. 抖音/小红书页面需要登录才能看\n" +
          "2. 服务端被反爬拦截\n\n" +
          "👉 请手动复制视频文案，粘贴到输入框即可。",
      })
    }

    return res.status(200).json({
      success: true,
      content: content.slice(0, 3000),
      title,
      hint: "已自动提取页面内容，你可以编辑后再分析。",
    })
  } catch (err: any) {
    console.error("抓取失败:", err.message)
    return res.status(200).json({
      success: false,
      title: "",
      hint:
        `抓取失败：${err.message || "网络超时"}\n\n` +
        "抖音/小红书通常屏蔽服务器抓取，这是正常的。\n" +
        "👉 请手动复制视频文案，粘贴到输入框即可。",
    })
  }
}

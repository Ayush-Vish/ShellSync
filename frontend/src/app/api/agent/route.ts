import { NextResponse } from "next/server"
import { userAgent } from "next/server"

export async function GET(request: Request) {
  const ua = userAgent({ headers: request.headers })
  const platform = ua.os.name?.toLowerCase() || "unknown"
  const arch = ua.ua.includes("arm64") ? "arm64" : "amd64"

  let file = ""

  if (platform.includes("mac")) {
    file = arch === "arm64" ? "client-darwin-arm64" : "client-darwin-amd64"
  } else if (platform.includes("linux")) {
    file = arch === "arm64" ? "client-linux-arm64" : "client-linux-amd64"
  } else {
    return NextResponse.json({ error: "Unsupported platform." }, { status: 400 })
  }

  const downloadUrl = `https://github.com/Ayush-Vish/ShellSync/raw/main/bin/${file}`

  return NextResponse.json({ url: downloadUrl })
}

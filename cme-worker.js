export default {
  async fetch(request) {

    const url = new URL(request.url)
    const target = url.searchParams.get("url")

    if (!target) {
      return new Response("missing url", { status: 400 })
    }

    const response = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json,text/plain,*/*"
      }
    })

    const data = await response.text()

    return new Response(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    })
  }
}

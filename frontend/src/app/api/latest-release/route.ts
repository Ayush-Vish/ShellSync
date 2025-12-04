export async function GET() {
  const res = await fetch(
    "https://api.github.com/repos/Ayush-Vish/ShellSync/releases/latest",
    {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ShellSync-Frontend",
      },
      // Optional caching
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    return Response.json({ error: "Failed to fetch release" }, { status: 500 });
  }

  const data = await res.json();
  return Response.json(data);
}

export async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(`https://r.jina.ai/${url}`);
  return response.text();
}

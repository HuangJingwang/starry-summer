export function GET(): Response {
  return Response.json({
    status: 'ok',
    service: 'starry-summer-web',
  });
}

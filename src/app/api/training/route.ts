export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { rounds?: unknown; photos?: unknown };
  try {
    body = await request.json() as { rounds?: unknown; photos?: unknown };
  } catch {
    return Response.json({ error: 'Send the training options as JSON.' }, { status: 400 });
  }

  if (body.rounds !== 10 && body.rounds !== 25 && body.rounds !== 50) {
    return Response.json({ error: 'Rounds must be 10, 25, or 50.' }, { status: 400 });
  }

  return Response.json(
    { error: 'Model training has not been connected yet.' },
    { status: 501 },
  );
}

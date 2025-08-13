// app/api/revalidate/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (token !== process.env.REVALIDATION_TOKEN) {
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const path = body?.path;

    if (!path) {
      return new NextResponse(JSON.stringify({ message: "Missing path to revalidate" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    revalidatePath(path);

    return new NextResponse(JSON.stringify({ revalidated: true, now: Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    let errorMessage = "Error revalidating";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

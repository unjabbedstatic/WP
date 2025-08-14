"use server";

import { revalidatePath } from "next/cache";

export async function handleRevalidate(path: string) {
  if (!path) {
    return { message: "Error: Path is required.", success: false };
  }

  try {
    revalidatePath(path);
    return {
      message: `Successfully revalidated path: ${path}`,
      success: true,
    };
  } catch (error) {
    let errorMessage = "Error revalidating";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { message: errorMessage, success: false };
  }
}

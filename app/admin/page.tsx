// app/admin/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { handleRevalidate } from "./actions";

function RevalidationForm() {
  const [path, setPath] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Revalidating...");

    const result = await handleRevalidate(path);

    setMessage(result.message);
    setIsSubmitting(false);
    if (result.success) {
      setPath("");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Manual Revalidation</h1>
      <p>Enter the path you want to revalidate (e.g., `/latest-news/`).</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1rem" }}>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/path-to-revalidate"
          style={{ padding: "0.5rem", minWidth: "300px" }}
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          style={{ padding: "0.5rem 1rem" }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Revalidating..." : "Revalidate"}
        </button>
      </form>
      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}

function AdminPageContent() {
  const searchParams = useSearchParams();
  const secret = searchParams.get("secret");

  const adminKey = process.env.NEXT_PUBLIC_REVALIDATION_ADMIN_KEY;

  if (secret !== adminKey) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return <RevalidationForm />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPageContent />
    </Suspense>
  );
}

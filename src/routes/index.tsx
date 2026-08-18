import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SAMOO — نظام إدارة المخالفات والإجازات" },
      {
        name: "description",
        content:
          "تطبيق SAMOO لإدارة المخالفات والملفات والإجازات والمناوبات مع وضع ليلي مريح وعرض موحّد للتواريخ.",
      },
      { property: "og:title", content: "SAMOO — نظام إدارة المخالفات والإجازات" },
      {
        property: "og:description",
        content:
          "إدارة المخالفات والملفات والإجازات والمناوبات في تطبيق واحد سريع على الهاتف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/samoo/index.html");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SAMOO</h1>
        <p className="mt-2 text-sm text-muted-foreground">جاري فتح التطبيق…</p>
        <a
          className="mt-4 inline-block text-sm font-medium text-primary underline"
          href="/samoo/index.html"
        >
          فتح التطبيق يدويًا
        </a>
      </div>
    </div>
  );
}

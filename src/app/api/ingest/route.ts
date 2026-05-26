import { NextRequest, NextResponse } from "next/server";
import { runDecisionContinuityPipeline } from "@workflows/decision_continuity/pipeline";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const title = String(form.get("title") || "Untitled document");
      const bodyText = String(form.get("body") || "");
      const sourceDate = String(form.get("sourceDate") || "") || undefined;
      const owner = String(form.get("owner") || "") || undefined;
      const team = String(form.get("team") || "") || undefined;
      const tagsRaw = String(form.get("tags") || "");
      const tags = tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (!bodyText.trim()) {
        return NextResponse.json(
          { error: "Body text is required." },
          { status: 400 }
        );
      }

      const result = await runDecisionContinuityPipeline({
        title,
        bodyText,
        sourceDate,
        owner,
        team,
        tags,
      });
      return NextResponse.json(result);
    }

    const json = (await req.json()) as {
      title?: string;
      bodyText?: string;
      sourceDate?: string;
      owner?: string;
      team?: string;
      tags?: string[];
    };

    if (!json.bodyText?.trim()) {
      return NextResponse.json(
        { error: "bodyText is required." },
        { status: 400 }
      );
    }

    const result = await runDecisionContinuityPipeline({
      title: json.title ?? "Untitled document",
      bodyText: json.bodyText,
      sourceDate: json.sourceDate,
      owner: json.owner,
      team: json.team,
      tags: json.tags,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

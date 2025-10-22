import { NextRequest, NextResponse } from "next/server";
import { executeAIQuery, getQueryHistory, clearAllQueryHistory } from "@/server/ai/query-executor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, templateId } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const result = await executeAIQuery(query, templateId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to execute query" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const history = await getQueryHistory(limit);
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch history" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const result = await clearAllQueryHistory();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to clear history" },
      { status: 500 }
    );
  }
}


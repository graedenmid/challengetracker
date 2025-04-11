import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { data: challenge, error } = await supabase
      .from("challenges")
      .insert({
        title: body.title,
        description: body.description,
        type: body.type,
        target: body.target,
        unit: body.unit,
        frequency: body.frequency,
        start_date: body.startDate,
        end_date: body.endDate,
        user_id: session.user.id,
        is_incremental: body.isIncremental,
        base_value: body.baseValue,
        increment_per_day: body.incrementPerDay,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating challenge:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error("Error in POST /api/challenges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: challenges, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching challenges:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map database field names to our API model field names
    const mappedChallenges = challenges.map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      target: challenge.target,
      unit: challenge.unit,
      frequency: challenge.frequency,
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      userId: challenge.user_id,
      createdAt: challenge.created_at,
      updatedAt: challenge.updated_at,
      isIncremental: challenge.is_incremental,
      baseValue: challenge.base_value,
      incrementPerDay: challenge.increment_per_day,
    }));

    return NextResponse.json(mappedChallenges);
  } catch (error) {
    console.error("Error in GET /api/challenges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

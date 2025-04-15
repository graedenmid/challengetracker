import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Fetching challenge with ID: ${params.id}`);
    const { data: challenge, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching challenge:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    console.log("Raw database challenge:", JSON.stringify(challenge, null, 2));

    // Check if the column has been renamed in the database
    if (
      challenge.increment_per_day !== undefined &&
      challenge.increment_value === undefined
    ) {
      console.warn("Database still using old column name 'increment_per_day'");
      // Handle legacy database schema
      challenge.increment_value = challenge.increment_per_day;
    }

    if (!challenge.increment_value && challenge.increment_value !== 0) {
      console.error("Missing increment_value in database response");
    }

    // Map database field names to our API model field names
    const mappedChallenge = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      target: challenge.target,
      unit: challenge.unit,
      frequency: challenge.frequency,
      startDate: challenge.start_date,
      endDate: challenge.end_date?.toISOString
        ? challenge.end_date.toISOString()
        : challenge.end_date,
      userId: challenge.user_id,
      createdAt: challenge.created_at,
      updatedAt: challenge.updated_at,
      isIncremental: challenge.is_incremental,
      baseValue: challenge.base_value ?? 1, // Use nullish coalescing to handle null
      incrementValue: challenge.increment_value ?? 1, // Use nullish coalescing to handle null
    };

    console.log(
      "Mapped challenge for API:",
      JSON.stringify(mappedChallenge, null, 2)
    );

    // Convert to JSON and then parse to ensure clean serialization
    const serializedChallenge = JSON.parse(JSON.stringify(mappedChallenge));
    console.log("Serialized challenge:", serializedChallenge);

    return NextResponse.json(serializedChallenge);
  } catch (error) {
    console.error("Error in GET /api/challenges/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("challenges")
      .delete()
      .eq("id", params.id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting challenge:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/challenges/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      .update({
        title: body.title,
        description: body.description,
        type: body.type,
        target: body.target,
        unit: body.unit,
        frequency: body.frequency,
        start_date: body.startDate,
        end_date: body.endDate,
        is_incremental: body.isIncremental,
        base_value: body.baseValue,
        increment_value: body.incrementValue,
      })
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating challenge:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map database field names to our API model field names in PATCH handler
    const mappedChallenge = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      target: challenge.target,
      unit: challenge.unit,
      frequency: challenge.frequency,
      startDate: challenge.start_date,
      endDate: challenge.end_date?.toISOString
        ? challenge.end_date.toISOString()
        : challenge.end_date,
      userId: challenge.user_id,
      createdAt: challenge.created_at,
      updatedAt: challenge.updated_at,
      isIncremental: challenge.is_incremental,
      baseValue: challenge.base_value ?? 1,
      incrementValue: challenge.increment_value ?? 1,
    };

    console.log("Updated challenge:", JSON.stringify(mappedChallenge, null, 2));

    // Convert to JSON and then parse to ensure clean serialization
    const serializedChallenge = JSON.parse(JSON.stringify(mappedChallenge));

    return NextResponse.json(serializedChallenge);
  } catch (error) {
    console.error("Error in PATCH /api/challenges/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
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
    console.log("Received entry submission:", body);

    try {
      // Check if an entry already exists for this date and challenge
      const { data: existingEntries } = await supabase
        .from("challenge_entries")
        .select("*")
        .eq("challenge_id", params.id)
        .eq("date", new Date(body.date).toISOString());

      // If entry exists, update it instead of creating a new one
      let operation;
      if (existingEntries && existingEntries.length > 0) {
        operation = supabase
          .from("challenge_entries")
          .update({
            value: Number(body.value),
            notes: body.notes,
          })
          .eq("id", existingEntries[0].id)
          .select()
          .single();
        console.log("Updating existing entry for this date");
      } else {
        operation = supabase
          .from("challenge_entries")
          .insert({
            challenge_id: params.id,
            date: new Date(body.date).toISOString(),
            value: Number(body.value),
            notes: body.notes,
          })
          .select()
          .single();
        console.log("Creating new entry");
      }

      const { data: entry, error } = await operation;

      if (error) {
        console.error("Error creating/updating entry:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Map database field names to our API model field names
      const mappedEntry = {
        id: entry.id,
        challengeId: entry.challenge_id,
        date: entry.date,
        value: entry.value,
        notes: entry.notes,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      };

      console.log("Successfully created/updated entry:", mappedEntry);
      return NextResponse.json(mappedEntry);
    } catch (error) {
      console.error("Exception in entry creation:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/challenges/[id]/entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { data: entries, error } = await supabase
      .from("challenge_entries")
      .select("*")
      .eq("challenge_id", params.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching entries:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map database field names to our API model field names
    const mappedEntries = entries.map((entry) => ({
      id: entry.id,
      challengeId: entry.challenge_id,
      date: entry.date,
      value: entry.value,
      notes: entry.notes,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    }));

    return NextResponse.json(mappedEntries);
  } catch (error) {
    console.error("Error in GET /api/challenges/[id]/entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

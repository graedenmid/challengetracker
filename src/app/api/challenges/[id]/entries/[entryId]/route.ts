import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify that the challenge belongs to the authenticated user
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: "Challenge not found or access denied" },
        { status: 404 }
      );
    }

    // Update the entry
    const body = await request.json();
    console.log("Updating entry:", { id: params.entryId, ...body });

    const { data: entry, error } = await supabase
      .from("challenge_entries")
      .update({
        value: Number(body.value),
        notes: body.notes,
      })
      .eq("id", params.entryId)
      .eq("challenge_id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating entry:", error);
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

    return NextResponse.json(mappedEntry);
  } catch (error) {
    console.error(
      "Error in PATCH /api/challenges/[id]/entries/[entryId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify that the challenge belongs to the authenticated user
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: "Challenge not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the entry
    const { error } = await supabase
      .from("challenge_entries")
      .delete()
      .eq("id", params.entryId)
      .eq("challenge_id", params.id);

    if (error) {
      console.error("Error deleting entry:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error in DELETE /api/challenges/[id]/entries/[entryId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

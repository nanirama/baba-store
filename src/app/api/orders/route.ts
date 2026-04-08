import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/server";

type OrderPayload = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  product_name: string;
  product_sku: string;
};



function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<OrderPayload>;

    if (
      !payload.first_name?.trim() ||
      !payload.last_name?.trim() ||
      !payload.phone?.trim() ||
      !payload.email?.trim() ||
      !payload.address?.trim()
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidEmail(payload.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("orders").insert([payload]);
    if (error) {
      console.error("Orders API insert error:", error);
      return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Orders API server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

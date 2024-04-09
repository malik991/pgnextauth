import pool from "@/dbConnection/dbConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { token } = reqBody;
    console.log("token for verifcation ", token);

    if (!token) {
      return NextResponse.json({ error: "token is empty" }, { status: 400 });
    }
    const checkUserFromToken = await pool.query(
      `SELECT * FROM USERS WHERE "verifyToken" = $1 AND "verifyTokenExpiry" > CURRENT_TIMESTAMP`,
      [token]
    );
    if (checkUserFromToken.rows.length === 0) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    const userId = checkUserFromToken.rows[0].id;
    const updateUserQuery = `
  UPDATE USERS
  SET "isVerified" = true,
      "verifyToken" = NULL,
      "verifyTokenExpiry" = NULL
  WHERE id = $1
`;
    await pool.query("BEGIN");
    await pool.query(updateUserQuery, [userId]);
    await pool.query("COMMIT");
    return NextResponse.json({
      message: "Email verified successfully",
      success: true,
    });
  } catch (error: any) {
    await pool.query("ROLLBACK");
    console.log("error in verify Email ", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

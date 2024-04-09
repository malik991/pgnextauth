import pool from "@/dbConnection/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { payLoadData } from "@/utils/interfaces";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { email, password } = reqBody;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are mendatory" },
        { status: 400 }
      );
    }

    await pool.query("BEGIN");
    const res = await pool.query(`SELECT * FROM USERS WHERE EMAIL = $1`, [
      email,
    ]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "user Not found" }, { status: 400 });
    }
    const validPassword = await bcryptjs.compare(
      password,
      res.rows[0].password
    );
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }
    if (!res.rows[0].isVerified) {
      const result = NextResponse.json({
        message: "Login Failed, please verify your token from email",
        success: false,
      });
      return result;
    }

    const tokenData: payLoadData = {
      email: res.rows[0].email,
      id: res.rows[0].id,
    };
    //create jwt token
    const jwtToken = await jwt.sign(tokenData, process.env.TOKEN_SECRET!, {
      expiresIn: "1d",
    });
    const response = NextResponse.json({
      message: "login successfully😀",
      success: true,
    });
    response.cookies.set("token", jwtToken, {
      httpOnly: true, // secure cookies
    });
    return response;
  } catch (error: any) {
    console.log("error in login route: ", error.message);
    return NextResponse.json(
      { error: error.message || "internal server error" },
      { status: 500 }
    );
  }
}

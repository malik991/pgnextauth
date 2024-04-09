//import { dbConnect } from "@/dbConnection/dbConfig";
//import db from "@/dbConnection/dbConfig";
import pool from "@/dbConnection/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { sendEmail } from "@/utils/mailer";
import { emailInterface } from "@/utils/interfaces";

//dbConnect();

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { userName, email, password } = reqBody;
    if (!userName && !email && !password) {
      return NextResponse.json(
        { error: "all fields are mendatory" },
        { status: 400 }
      );
    }

    // check user exist
    const res = await pool.query("SELECT * FROM users where email = $1", [
      email,
    ]);
    //console.log(res.rows);

    if (res.rows.length > 0) {
      return NextResponse.json(
        { error: "user already registered." },
        { status: 400 }
      );
    }
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);
    await pool.query("BEGIN");
    const newUser = await pool.query(
      `INSERT INTO users (userName, email, password) VALUES ($1, $2, $3) RETURNING id, userName, email`,
      [userName, email, hashPassword]
    );
    await pool.query("COMMIT"); // Commit transaction

    if (newUser.rows.length === 1) {
      const insertedUser = newUser.rows[0];
      const emailOptions: emailInterface = {
        toEmail: insertedUser?.email,
        emailType: "VERIFY",
        userId: insertedUser?.id,
      };
      await sendEmail(emailOptions);
      return NextResponse.json({
        success: true,
        message: "User registered successfully",
        user: {
          id: insertedUser.id,
          userName: insertedUser.userName,
          email: insertedUser.email,
        },
      });
    } else {
      throw new Error("Failed to insert user"); // Rollback will be automatically performed due to unhandled error
    }
  } catch (error: any) {
    await pool.query("ROLLBACK"); // Rollback transaction
    console.log("error in signup: ", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

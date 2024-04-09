import nodemailer from "nodemailer";
import { emailInterface } from "./interfaces";
import { v4 as uuidv4 } from "uuid";
import pool from "@/dbConnection/dbConfig";
import ejs from "ejs";
import fs from "fs";

export const sendEmail = async ({
  toEmail,
  emailType,
  userId,
}: emailInterface) => {
  try {
    const hashedToken = uuidv4();
    const template = fs.readFileSync("src/templates/emailTemplate.ejs", "utf8");

    // Render the EJS template with the required data
    const htmlTemplate = ejs.render(template, {
      domain: process.env.DOMAIN,
      hashedToken,
      emailType,
    });

    const fromEmail = process.env.SEND_From_Email;
    if (emailType === "VERIFY") {
      const timestamp = Date.now() + 3600000; // Adds 1 hour to the current timestamp
      const tokenExpiry: any = new Date(timestamp); // Converts timestamp to ISO format
      // console.log("userID: ", tokenExpiry);

      await pool.query("BEGIN");
      const respo = await pool.query(
        `UPDATE USERS SET "verifyToken" = $1, "verifyTokenExpiry" = $2 WHERE id = $3`,
        [hashedToken, tokenExpiry, userId]
      );
      // console.log("reposnse ", respo.rowCount);

      await pool.query("COMMIT");
    } else if (emailType === "RESET") {
      const timestamp = Date.now() + 3600000; // Adds 1 hour to the current timestamp
      const tokenExpiry = new Date(timestamp).toISOString(); // Converts timestamp to ISO format
      console.log("token expiry ", tokenExpiry);

      await pool.query("BEGIN");
      await pool.query(
        `UPDATE USERS SET "forgotPasswordToken" = $1, "forgotPasswordExpiry" = $2 where id=$3`,
        [hashedToken, tokenExpiry, userId]
      );
      await pool.query("COMMIT");
    }
    const transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      port: parseInt(process.env.NODEMAILER_PORT || "2525"),
      auth: {
        user: process.env.NODEMAILER_AUTH_USER,
        pass: process.env.NODEMAILER_AUTH_PWD,
      },
    });
    const mailOptions = {
      from: `"nextJs Auth by Malik👻" <${fromEmail}>`,
      to: toEmail,
      subject:
        emailType === "VERIFY" ? "VERIFY EMAIL ADDRESS" : "RESET YOUR PASSWORD",
      html: htmlTemplate,
      // html: `<p>Click <a href="${
      //   process.env.DOMAIN
      // }/verifyemail?token=${hashedToken}">here</a> to ${
      //   emailType === "VERIFY" ? "verify your email" : "reset your password"
      // }
      //    or copy and paste the link below in your browser. <br> ${
      //      process.env.DOMAIN
      //    }/verifyemail?token=${hashedToken}
      //    </p>`,
    };
    const emailResponse = await transporter.sendMail(mailOptions);
    return emailResponse;
  } catch (error: any) {
    await pool.query("ROLLBACK");
    console.log("error send email: ", error);
    throw new Error(error);
  }
};

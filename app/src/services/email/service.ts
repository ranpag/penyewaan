import nodemailer from "nodemailer";
import templateHTML from "./template";
import env from "~/configs/env";

const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    auth: {
        user: env.SMTP_USERNAME,
        pass: env.SMTP_PASSWORD
    }
});

const sendEmail = async (emailTo: string, subject: string, html: string) => {
    try {
        return await transport.sendMail({
            from: `${env.APP_NAME} <${(env.APP_NAME as string).toLowerCase()}@pratadev.my.id>`,
            to: emailTo,
            subject,
            html
        });
    } catch (err) {
        return err;
    }
};

const sendPasswordResetEmail = async (emailTo: string, passwordResetToken: string) => {
    try {
        const subject = `${env.APP_NAME} - Reset your password`;
        const html = templateHTML.passwordReset(`${env.FRONTEND_URL}/${passwordResetToken}`);

        return await sendEmail(emailTo, subject, html);
    } catch (err) {
        return err;
    }
};

export default { sendEmail, sendPasswordResetEmail };

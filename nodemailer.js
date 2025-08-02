import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async (email, content) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: "wac.ai.assistent@gmail.com",
    to: email,
    subject: "Olá! Wac AI enviou uma mensagem!",
    text: content,
    html: `
    <div>
      <h1>Olá! Está é uma mensagem enviada pela Wac AI!</h1>
      <p><strong>Mensagem:</strong> ${content}</p><br>
      <small>Wac AI é uma assistente de IA do projeto: <a href="https://web-api-csharp-frontend.onrender.com/" target="_blank">Web API C#</a></small>
    </div>
    `,
  };

  return transporter.sendMail(mailOptions);

  // try {
  //   const info = await transporter.sendMail(mailOptions);
  //   console.log("Email enviado: ", info.response);
  // } catch (error) {
  //   console.error("Erro: ", error);
  // }
};

export default sendEmail;

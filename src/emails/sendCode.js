import sgMail from "@sendgrid/mail";
//sgMail api key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function verifyAccountMsg(to, name, code) {
  sgMail.send({
    to: to,
    from: "sockrat.love@gmail.com",
    subject: "Account Verification",
    text: `Hello, ${name}!! your link is: http://localhost:3000/verify-account?user=${to}&&code-token=${code}`,
  });
}

function forgetPasswordMsg(to, name, code) {
  sgMail.send({
    to: to,
    from: "sockrat.love@gmail.com",
    subject: "Forget Password",
    text: `Hello, ${name}!! your link is: http://localhost:3000/forget-password?user=${to}&&code-token=${code}`,
  });
}

export default { verifyAccountMsg, forgetPasswordMsg };

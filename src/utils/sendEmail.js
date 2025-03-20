const nodemailer = require("nodemailer");

exports.sendEmail = async (email, newPassword) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: "iydh hnpc tswh elar", // Mật khẩu email (hoặc App Password nếu dùng Gmail)
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset mật khẩu thành công",
    text: `Mật khẩu mới của bạn là: ${newPassword}`,
  };

  await transporter.sendMail(mailOptions);
};

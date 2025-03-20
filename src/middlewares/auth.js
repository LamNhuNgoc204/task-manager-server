const { getAuth } = require("firebase-admin/auth");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

exports.authorizationJWT = async (req, res, next) => {
  console.log("📢 Middleware authorizationJWT được gọi!");
  console.log("📢 Headers nhận được:", req.headers);

  try {
    console.log(req.headers.authorization);
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const accessToken = authorizationHeader.split(" ")[1];
    try {
      // 🔹 Kiểm tra nếu là Firebase Token
      const decodedToken = await getAuth().verifyIdToken(accessToken);
      console.log("✅ Firebase Token hợp lệ:", decodedToken);
      const user = await User.findOne({ googleId: decodedToken.uid });
      req.userId = user._id;
      console.log("✅user._id======", user._id);

      return next();
    } catch (firebaseError) {
      console.log("⚠️ Không phải Firebase Token, thử kiểm tra JWT thường...");

      try {
        // 🔹 Kiểm tra JWT thường
        const decodedJWT = jwt.verify(accessToken, process.env.JWT_SECRET);
        console.log("✅ JWT hợp lệ:", decodedJWT);
        req.userId = decodedJWT._id;
        console.log("✅decodedJWT._id======", decodedJWT._id);

        return next();
      } catch (jwtError) {
        console.log("❌ Token không hợp lệ:", jwtError.message);
        return res
          .status(403)
          .json({ message: "Forbidden", error: jwtError.message });
      }
    }
  } catch (error) {
    console.error("❌ Lỗi middleware:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

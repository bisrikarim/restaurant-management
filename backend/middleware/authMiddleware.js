const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    console.log("🔍 Middleware Auth: Vérification du token...");

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        console.log("❌ Aucun token fourni !");
        return res.status(401).json({ message: "Accès refusé, aucun token fourni." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        console.log("❌ Format de token invalide !");
        return res.status(401).json({ message: "Format de token invalide." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
        req.user = decoded;
        console.log("✅ JWT Validé:", decoded);

        console.log("➡️ Appel de next() pour passer à la suite");
        next(); // 🚀 Passer au prochain middleware
    } catch (error) {
        console.log("❌ Erreur JWT:", error.message);
        return res.status(403).json({ message: "Token invalide." });
    }
};

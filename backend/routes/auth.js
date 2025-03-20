const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "secret123";


// 🔹 Route d'inscription (Register)
router.post("/register", async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer un nouvel utilisateur
        const newUser = new User({ email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: "Utilisateur créé avec succès !" });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});


// 🔹 Route de connexion (Login)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect." });
        }

        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect." });
        }

        // Générer le token JWT
        const token = jwt.sign({ userId: user._id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});

module.exports = router;

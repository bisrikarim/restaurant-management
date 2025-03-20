const express = require("express");
const Menu = require("../models/Menu");
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 🔹 Ajouter un produit au menu
router.post("/", async (req, res) => {
    try {
        const newProduct = new Menu(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// 🔹 Lister tous les produits du menu
router.get("/", async (req, res) => {
    try {
        const menu = await Menu.find();
        res.json(menu);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// 🔹 Modifier un produit du menu
router.put("/:id", async (req, res) => {
    try {
        const updatedProduct = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// 🔹 Supprimer un produit du menu
router.delete("/:id", async (req, res) => {
    try {
        await Menu.findByIdAndDelete(req.params.id);
        res.json({ message: "Produit supprimé du menu" });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;

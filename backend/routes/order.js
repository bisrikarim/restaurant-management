const express = require("express");
const Order = require("../models/Order");
const Menu = require("../models/Menu");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");

const router = express.Router();

// 🔹 Ajouter une commande (CLIENT SEULEMENT)
router.post("/", authMiddleware, checkRole(["client"]), async (req, res) => {
    console.log("🔍 Requête reçue pour ajouter une commande");

    try {
        const { orderNumber, items } = req.body;
        console.log("🔍 Données reçues :", orderNumber, items);
        console.log("👤 Utilisateur connecté :", req.user);

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "La commande doit contenir au moins un produit." });
        }

        const productIds = items.map(item => item.product);
        console.log("🔎 Vérification des produits ID:", productIds);

        const products = await Menu.find({ _id: { $in: productIds } });

        if (products.length !== items.length) {
            return res.status(400).json({ message: "Certains produits n'existent pas dans le menu." });
        }

        console.log("✅ Tous les produits sont valides. Création de la commande...");
        const newOrder = new Order({
            orderNumber,
            items,
            status: "En attente",
            user: req.user.userId
        });

        await newOrder.save();

        // 🔥 Récupérer la commande avec les produits peuplés immédiatement
        const populatedOrder = await Order.findById(newOrder._id)
            .populate("items.product", "name price");

        console.log("✅ Commande enregistrée avec succès !");
        res.status(201).json({
            order: populatedOrder,  // 🔥 Envoie directement la version avec les produits peuplés
            userRole: req.user.role
        });
    } catch (err) {
        console.error("❌ Erreur serveur :", err.message);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});


// 🔹 Récupérer les commandes (ADMIN VOIT TOUT, CLIENT VOIT SEULEMENT SES COMMANDES)
router.get("/", authMiddleware, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "client") {
            filter.user = req.user.userId; // 🔥 Filtrer pour ne voir que les commandes du client
        }

        const orders = await Order.find(filter)
            .populate("items.product", "name price") // 🔥 Assure-toi de récupérer les noms des produits
            .populate("user", "email"); // 🔥 Récupère aussi l'email de l'utilisateur

        console.log("📦 Commandes récupérées avec produits :", JSON.stringify(orders, null, 2));

        res.json(orders);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des commandes :", err.message);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});



// 🔹 Modifier le statut d'une commande (ADMIN SEULEMENT)
router.put("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["En attente", "En préparation", "Prête", "Livrée"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Statut invalide." });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Commande introuvable." });
        }

        if (order.status === "Livrée") {
            return res.status(400).json({ message: "Impossible de modifier une commande déjà livrée." });
        }

        const statusFlow = {
            "En attente": ["En préparation"],
            "En préparation": ["Prête"],
            "Prête": ["Livrée"],
            "Livrée": []
        };

        if (!statusFlow[order.status].includes(status)) {
            return res.status(400).json({ message: `Transition de '${order.status}' à '${status}' non autorisée.` });
        }

        order.status = status;
        await order.save();

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});

// 🔹 Supprimer une commande (ADMIN SEULEMENT)
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Commande introuvable." });
        }

        if (order.status !== "En attente") {
            return res.status(400).json({ message: "Impossible de supprimer une commande en cours de préparation ou livrée." });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Commande supprimée avec succès." });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});

// 🔹 Génération d’un reçu PDF pour une commande (ADMIN & CLIENT PROPRIÉTAIRE)
router.get("/:id/pdf", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("items.product");
        if (!order) {
            return res.status(404).json({ message: "Commande introuvable." });
        }

        // Vérifier si l'utilisateur est le propriétaire ou un admin
        if (req.user.role !== "admin" && order.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Accès refusé." });
        }

        const receiptsDir = path.join(__dirname, "..", "receipts");
        try {
            if (!fs.existsSync(receiptsDir)) {
                fs.mkdirSync(receiptsDir, { recursive: true });
            }
        } catch (err) {
            return res.status(500).json({ message: "Erreur lors de la création du répertoire receipts", error: err.message });
        }

        const doc = new PDFDocument();
        const fileName = `reçu_${order.orderNumber}.pdf`;
        const filePath = path.join(receiptsDir, fileName);

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(20).text("Reçu de commande", { align: "center" });
        doc.moveDown();
        doc.fontSize(14).text(`Commande N°: ${order.orderNumber}`);
        
        const date = new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 19);
        doc.text(`Date: ${date}`);
        doc.moveDown();

        doc.fontSize(16).text("Produits :", { underline: true });
        order.items.forEach(item => {
            if (!item.product) return;
            doc.fontSize(12).text(
                `- ${item.product.name} x${item.quantity} - ${item.product.price} MAD`
            );
        });

        const total = order.items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
        doc.moveDown();
        doc.fontSize(14).text(`Total: ${total} MAD`, { bold: true });

        doc.end();

        stream.on("finish", () => {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    return res.status(500).json({ message: "Erreur: le fichier PDF n'a pas été généré." });
                }
                res.download(filePath, fileName, (err) => {
                    if (err) {
                        res.status(500).json({ message: "Erreur lors du téléchargement du PDF." });
                    }
                });
            });
        });

    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});

module.exports = router;

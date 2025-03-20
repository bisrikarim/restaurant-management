const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
            quantity: { type: Number, required: true }
        }
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 🔥 Ajout du champ "user"
    status: { type: String, enum: ["En attente", "En préparation", "Prête", "Livrée"], default: "En attente" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const orderRoutes = require("./routes/order");
const authRoutes  = require("./routes/auth");
const menuRoutes = require("./routes/menu");

// Connexion MongoDB
connectDB();

// Initialisation Express
const app = express();
app.use(cors());
app.use(express.json());

const jwtSecret = process.env.JWT_SECRET || "secret123"; // Vérifier .env

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);

// Création du serveur HTTP
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" },
});

// WebSockets : Écoute des mises à jour en temps réel
io.on("connection", (socket) => {
    console.log("🟢 Client connecté au WebSocket");

    socket.on("disconnect", () => {
        console.log("🔴 Client déconnecté");
    });
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));

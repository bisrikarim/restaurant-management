"use client";
import { useState, useEffect } from "react";

const OrdersPage = () => {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les produits du menu
        const menuResponse = await fetch("http://localhost:5000/api/menu");
        const menuData = await menuResponse.json();
        setMenu(menuData);

        // Charger les commandes existantes
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Aucun token trouvé. Veuillez vous connecter.");
          return;
        }

        const ordersResponse = await fetch("http://localhost:5000/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      }
    };

    fetchData();
  }, []);

  // Ajouter une commande
  const handleAddOrder = async () => {
    if (!selectedProduct) {
      alert("Veuillez sélectionner un produit.");
      return;
    }

    const newOrder = {
      orderNumber: `CMD-${Date.now()}`, // Génère un numéro unique
      items: [{ product: selectedProduct, quantity }],
      status: "En attente",
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vous devez être connecté pour passer une commande.");
        return;
      }

      console.log("🚀 Envoi de la commande :", newOrder);

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newOrder),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Commande ajoutée :", result);
        setOrders([...orders, result.order]);
        setSelectedProduct("");
        setQuantity(1);
      } else {
        console.error("❌ Erreur lors de l'ajout de la commande :", result.message);
      }
    } catch (error) {
      console.error("❌ Erreur réseau :", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🛒 Gestion des Commandes</h1>

      {/* Formulaire d'ajout */}
      <div className="mb-4 p-4 border rounded bg-gray-100">
        <h2 className="text-lg font-semibold">➕ Ajouter une commande</h2>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="border p-2 m-1"
        >
          <option value="">Sélectionner un produit</option>
          {menu.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name} - {product.price} MAD
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border p-2 m-1 w-16"
        />
        <button
          onClick={handleAddOrder}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Ajouter
        </button>
      </div>

      {/* Liste des commandes */}
      {orders.length > 0 ? (
        <div className="mt-4">
          <h2 className="text-xl font-bold">📋 Commandes existantes</h2>
          <ul className="mt-2">
          {orders.map((order) => (
            <li key={order._id} className="border p-3 rounded my-2">
                <strong>Commande N° {order.orderNumber}</strong>
                <ul>
                {order.items.map((item, index) => (
                    <li key={index}>
                    {item.product && item.product.name ? `${item.product.name} x ${item.quantity}` : "Produit inconnu"}
                    </li>
                ))}
                </ul>
                <p className="text-sm text-gray-600">Statut: {order.status}</p>
            </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-600">Aucune commande pour le moment.</p>
      )}
    </div>
  );
};

export default OrdersPage;

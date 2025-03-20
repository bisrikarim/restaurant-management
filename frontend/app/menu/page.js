"use client";
import { useState, useEffect } from "react";

const MenuPage = () => {
  const [menu, setMenu] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "Burger",
    available: true,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Ajoute ceci juste après :
useEffect(() => {
  console.log("Produit en édition mis à jour :", editingProduct);
}, [editingProduct]);

  // Charger les produits du menu
  useEffect(() => {
    fetch("http://localhost:5000/api/menu")
      .then((res) => res.json())
      .then((data) => setMenu(data))
      .catch((err) => console.error("Erreur :", err));

    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role === "admin") setIsAdmin(true);
    }
  }, []);

  // Ajouter un produit
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const addedProduct = await response.json();
        setMenu([...menu, addedProduct]);
        setNewProduct({ name: "", description: "", price: "", category: "Burger", available: true });
      } else {
        console.error("Erreur lors de l'ajout du produit");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };

  // Ouvrir le modal avec les données du produit
  const handleEditClick = (product) => {
    console.log("Produit sélectionné :", product);
    setEditingProduct({ ...product });
    console.log("Produit en édition :", editingProduct);
    setShowModal(true);
  };

  // Modifier un produit
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`http://localhost:5000/api/menu/${editingProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editingProduct),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setMenu(menu.map((item) => (item._id === updatedProduct._id ? updatedProduct : item)));
        setShowModal(false);
      } else {
        console.error("Erreur lors de la modification du produit");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };

  // Supprimer un produit
  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/menu/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.ok) {
        setMenu(menu.filter((item) => item._id !== id));
      } else {
        console.error("Erreur lors de la suppression du produit");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🛒 Menu du Restaurant</h1>

      {/* Formulaire d'ajout de produit */}
      {isAdmin && (
        <div className="mb-4 p-4 border rounded bg-gray-100">
          <h2 className="text-lg font-semibold">➕ Ajouter un produit</h2>
          <input
            type="text"
            placeholder="Nom"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="border p-2 m-1"
          />
          <input
            type="text"
            placeholder="Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="border p-2 m-1"
          />
          <input
            type="number"
            placeholder="Prix"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            className="border p-2 m-1"
          />
          <select
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            className="border p-2 m-1"
          >
            <option value="Burger">Burger</option>
            <option value="Frites">Frites</option>
            <option value="Boisson">Boisson</option>
            <option value="Dessert">Dessert</option>
          </select>
          <button onClick={handleAddProduct} className="bg-green-500 text-white px-4 py-2 rounded">
            Ajouter
          </button>
        </div>
      )}

      {menu.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {menu.map((item) => (
            <div key={item._id} className="border p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="text-sm text-gray-600">{item.description}</p>
              <p className="text-md font-bold text-green-600">{item.price} MAD</p>
              <p className="text-sm text-blue-600">Catégorie: {item.category}</p>
              {isAdmin && (
                <div className="mt-2">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(item._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Aucun produit disponible pour le moment.</p>
      )}

      {/* MODAL DE MODIFICATION */}
      {showModal && editingProduct && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Modifier le produit</h2>
      
      <input
        type="text"
        value={editingProduct?.name || ""}
        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
        className="border p-2 mb-2 w-full"
        placeholder="Nom du produit"
      />
      
      <textarea
        value={editingProduct?.description || ""}
        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
        className="border p-2 mb-2 w-full"
        placeholder="Description"
      />
      
      <input
        type="number"
        value={editingProduct?.price || ""}
        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
        className="border p-2 mb-2 w-full"
        placeholder="Prix"
      />
      
      <select
        value={editingProduct?.category || "Burger"}
        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
        className="border p-2 mb-2 w-full"
      >
        <option value="Burger">Burger</option>
        <option value="Frites">Frites</option>
        <option value="Boisson">Boisson</option>
        <option value="Dessert">Dessert</option>
      </select>
      
      <button onClick={handleUpdateProduct} className="bg-blue-500 text-white px-4 py-2 rounded">
        Enregistrer
      </button>
      <button onClick={() => setShowModal(false)} className="ml-2 bg-gray-500 text-white px-4 py-2 rounded">
        Annuler
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default MenuPage;

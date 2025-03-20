"use client";
import { useState, useEffect } from "react";
import { GiBowlOfRice, GiHotMeal, GiCookingPot } from 'react-icons/gi';
import { 
  ChartBarIcon, 
  FireIcon, 
  ClipboardDocumentListIcon, 
  TruckIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ShoppingCartIcon, 
  DocumentCheckIcon, 
  PlusCircleIcon, 
  ArrowRightOnRectangleIcon,
  CakeIcon 
} from "@heroicons/react/24/solid";
import './dashboard.css';
import { useRouter } from 'next/navigation';

const statutOptions = ["En attente", "En préparation", "Prête", "Livrée"];

const Dashboard = () => {
  const router = useRouter(); // Ajout de cette ligne
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Ajout des fonctions de navigation
  const handleAddOrder = () => {
    router.push('/orders');
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Supprime le token
    router.push('/auth/login');
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      } catch (error) {
        console.error("Erreur lors de la lecture du token :", error);
      }
    }

    fetch("http://localhost:5000/api/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Erreur :", err);
        setIsLoading(false);
      });
  }, []);

  const handleEditClick = (orderId, currentStatus) => {
    setEditingOrder(orderId);
    setSelectedStatus(currentStatus);
  };

  const handleStatusChange = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (response.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId ? { ...order, status: selectedStatus } : order
          )
        );
        setEditingOrder(null);
      } else {
        console.error("Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };

  // Calcul des statistiques
  const stats = {
    total: orders.length,
    enPreparation: orders.filter(order => order.status === "En préparation").length,
    pretes: orders.filter(order => order.status === "Prête").length,
    livrees: orders.filter(order => order.status === "Livrée").length
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <div className="title-container">
          <h1 className="dashboard-title">Suivi des Commandes</h1>
        </div>
        <p className="dashboard-subtitle">Suivez en temps réel l'état de vos commandes</p>
        {/* Ajout des boutons avec leurs handlers */}
        <div className="header-buttons">
          <button className="header-btn btn-add" onClick={handleAddOrder}>
            <PlusCircleIcon className="header-btn-icon" />
            Ajouter une commande
          </button>
          <button className="header-btn btn-logout" onClick={handleLogout}>
            <ArrowRightOnRectangleIcon className="header-btn-icon" />
            Se déconnecter
          </button>
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <ChartBarIcon className="stat-icon total" />
          <div className="stat-info">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total commandes</span>
          </div>
        </div>
        <div className="stat-card">
          <FireIcon className="stat-icon preparing" />
          <div className="stat-info">
            <span className="stat-number">{stats.enPreparation}</span>
            <span className="stat-label">En préparation</span>
          </div>
        </div>
        <div className="stat-card">
          <ClipboardDocumentListIcon className="stat-icon ready" />
          <div className="stat-info">
            <span className="stat-number">{stats.pretes}</span>
            <span className="stat-label">Prêtes</span>
          </div>
        </div>
        <div className="stat-card">
          <TruckIcon className="stat-icon delivered" />
          <div className="stat-info">
            <span className="stat-number">{stats.livrees}</span>
            <span className="stat-label">Livrées</span>
          </div>
        </div>
      </div>

      <div className="orders-wrapper">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Chargement des commandes...</p>
          </div>
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-number">
                <DocumentCheckIcon className="order-icon" />
                {order.orderNumber}
              </div>

              <div className="order-items">
                <GiHotMeal className="order-icon" />
                <span>{order.items?.map((item) => item.product?.name || "Produit inconnu").join(", ")}</span>
              </div>

              <div className="status-container">
                {editingOrder === order._id ? (
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="status-select"
                  >
                    {statutOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
                    {order.status === "Livrée" && <CheckCircleIcon className="status-icon" />}
                    {order.status === "En préparation" && <ClockIcon className="status-icon" />}
                    {order.status === "Prête" && <DocumentCheckIcon className="status-icon" />}
                    {order.status === "En attente" && <XCircleIcon className="status-icon" />}
                    {order.status}
                  </span>
                )}
              </div>

              {userRole === "admin" && (
                <div className="admin-actions">
                  {editingOrder === order._id ? (
                    <>
                      <button onClick={() => handleStatusChange(order._id)} className="btn btn-save">
                        <CheckCircleIcon className="btn-icon" />
                        Enregistrer
                      </button>
                      <button onClick={() => setEditingOrder(null)} className="btn btn-cancel">
                        <XCircleIcon className="btn-icon" />
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleEditClick(order._id, order.status)} className="btn btn-edit">
                      <PencilSquareIcon className="btn-icon" />
                      Modifier
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-orders">
            <ShoppingCartIcon className="icon" />
            <p>Aucune commande disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
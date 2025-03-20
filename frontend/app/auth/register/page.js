"use client";
import { useState } from "react";
import { FaEnvelope, FaLock, FaUserPlus, FaUserCog } from 'react-icons/fa';
import Link from 'next/link';
import './register.css';

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("Inscription réussie ! 🎉 Connectez-vous maintenant.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <FaUserCog className="input-icon" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={isLoading ? 'loading' : ''}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <FaUserPlus className="button-icon" />
                S'inscrire
              </>
            )}
          </button>
        </form>

        <div className="additional-links">
          <Link href="/auth/login">Déjà un compte ? Se connecter</Link>
          <Link href="/">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
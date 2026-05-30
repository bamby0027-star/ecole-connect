'use client'
import { useState } from 'react'

export default function Home() {
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [classe, setClasse] = useState('')
  const [error, setError] = useState('')

  const handleAdmin = () => {
    if (password === 'ecole2026') {
      window.location.href = '/admin'
    } else {
      setError('Mot de passe incorrect')
    }
  }

  const handleParent = () => {
    if (!nom || !classe) {
      setError('Remplissez tous les champs')
      return
    }
    window.location.href = `/parent?nom=${encodeURIComponent(nom)}&classe=${encodeURIComponent(classe)}`
  }

  if (role === 'admin') return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <button onClick={() => setRole('')} className="text-blue-600 text-sm mb-4">← Retour</button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚙️</div>
          <h1 className="text-2xl font-bold text-gray-800">Espace Admin</h1>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdmin()}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 mb-4"
          placeholder="Mot de passe admin"
        />
        <button onClick={handleAdmin} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
          Se connecter
        </button>
      </div>
    </div>
  )

  if (role === 'parent') return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <button onClick={() => setRole('')} className="text-blue-600 text-sm mb-4">← Retour</button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👨‍👩‍👧</div>
          <h1 className="text-2xl font-bold text-gray-800">Espace Parent</h1>
          <p className="text-gray-500 text-sm mt-1">Entrez le nom de votre enfant</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        <div className="space-y-3">
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
            placeholder="Nom de famille de l'élève"
          />
          <input
            type="text"
            value={classe}
            onChange={(e) => setClasse(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
            placeholder="Classe (ex: CI A, CP)"
          />
          <button onClick={handleParent} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
            Voir le tableau de bord
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <h1 className="text-3xl font-bold text-blue-700">École Connect</h1>
          <p className="text-gray-500 mt-2">Bienvenue ! Qui êtes-vous ?</p>
        </div>
        <div className="space-y-3">
          <button onClick={() => setRole('parent')} className="w-full bg-green-50 border-2 border-green-200 text-green-700 py-4 rounded-xl font-semibold hover:bg-green-100 transition text-lg">
            👨‍👩‍👧 Je suis un Parent
          </button>
          <button onClick={() => setRole('admin')} className="w-full bg-blue-50 border-2 border-blue-200 text-blue-700 py-4 rounded-xl font-semibold hover:bg-blue-100 transition text-lg">
            ⚙️ Je suis Admin
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">École Connect © 2026</p>
      </div>
    </div>
  )
}
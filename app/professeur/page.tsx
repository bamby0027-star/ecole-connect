'use client'
export default function ProfesseurPage() {
  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-green-700">👨‍🏫 Espace Professeur</h1>
          <p className="text-gray-500 mt-1">Bienvenue sur École Connect</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">✉️</div>
            <h2 className="font-semibold text-gray-700">Envoyer un message</h2>
            <p className="text-gray-400 text-sm">Contacter les parents</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">👨‍🎓</div>
            <h2 className="font-semibold text-gray-700">Mes élèves</h2>
            <p className="text-gray-400 text-sm">Voir mes classes</p>
          </div>
        </div>
      </div>
    </div>
  )
}
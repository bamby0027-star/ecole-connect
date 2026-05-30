'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ParentPage() {
  const router = useRouter()

  const [step, setStep] = useState<'login' | 'dashboard'>('login')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [classes, setClasses] = useState<{id: string; nom: string}[]>([])
  const [classeId, setClasseId] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [eleve, setEleve] = useState<any>(null)
  const [classeNom, setClasseNom] = useState('')
  const [activeTab, setActiveTab] = useState<'emploi'|'messages'|'absences'|'demandes'|'infos'>('emploi')
  const [emplois, setEmplois] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [absences, setAbsences] = useState<any[]>([])
  const [demandes, setDemandes] = useState<any[]>([])
  const [newMessages, setNewMessages] = useState(0)
  const [loadingData, setLoadingData] = useState(false)
  const [nouveauMessage, setNouveauMessage] = useState('')
  const [loadingDemande, setLoadingDemande] = useState(false)
  const [demandeSuccess, setDemandeSuccess] = useState('')

  useEffect(() => {
    supabase
      .from('classes')
      .select('id, nom')
      .order('nom')
      .then(({ data }) => { if (data) setClasses(data) })
  }, [])

  const handleLogin = async () => {
    if (!prenom.trim() || !nom.trim()) {
      setLoginError("Veuillez entrer le prénom et le nom de l'élève.")
      return
    }
    if (!classeId) {
      setLoginError('Veuillez sélectionner la classe.')
      return
    }
    setLoadingLogin(true)
    setLoginError('')

    const { data, error } = await supabase
      .from('élèves')
      .select('*')
      .ilike('prenom', prenom.trim())
      .ilike('nom', nom.trim())
      .eq('classe_id', classeId)
      .limit(1)

    if (error) {
      console.error(error)
      setLoginError('Erreur de connexion. Réessayez.')
      setLoadingLogin(false)
      return
    }

    if (!data || data.length === 0) {
      setLoginError(`Élève "${prenom} ${nom}" non trouvé dans cette classe. Vérifiez le prénom, nom et la classe.`)
      setLoadingLogin(false)
      return
    }

    const found = data[0]
    setEleve(found)
    setClasseNom(classes.find(c => c.id === classeId)?.nom ?? '')

    setLoadingData(true)
    const [emploiRes, msgClasse, msgEcole, msgPersonnel, absenceRes, demandeRes] = await Promise.all([
      supabase.from('emplois_du_temps').select('*').eq('classe_id', found.classe_id).order('jour').order('heure_debut'),
      supabase.from('message').select('*').eq('classe_id', found.classe_id),
      supabase.from('message').select('*').is('classe_id', null),
      supabase.from('message').select('*').eq('destinataire_id', found.id),
      supabase.from('absences').select('*').eq('eleve_id', found.id).order('date', { ascending: false }),
      supabase.from('demandes').select('*').eq('eleve_id', found.id).order('created_at', { ascending: false }),
    ])

    if (emploiRes.data) setEmplois(emploiRes.data)

    const tousRaw = [
      ...(msgClasse.data ?? []),
      ...(msgEcole.data ?? []),
      ...(msgPersonnel.data ?? []),
    ]
    const unique = tousRaw.filter((m, index, self) => index === self.findIndex(x => x.id === m.id))
    const tousMessages = unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setMessages(tousMessages)
    setNewMessages(tousMessages.filter(m => !m.lu).length)

    if (absenceRes.data) setAbsences(absenceRes.data)
    if (demandeRes.data) setDemandes(demandeRes.data)

    setLoadingData(false)
    setStep('dashboard')
    setLoadingLogin(false)
  }

  const envoyerDemande = async () => {
    if (!nouveauMessage.trim()) return
    setLoadingDemande(true)
    setDemandeSuccess('')
    const { error } = await supabase.from('demandes').insert([{
      eleve_id: eleve.id,
      classe_id: eleve.classe_id,
      message: nouveauMessage.trim(),
    }])
    if (error) { alert('Erreur : ' + error.message) }
    else {
      setDemandeSuccess('Message envoyé à l\'administration !')
      setNouveauMessage('')
      const { data } = await supabase.from('demandes').select('*').eq('eleve_id', eleve.id).order('created_at', { ascending: false })
      if (data) setDemandes(data)
    }
    setLoadingDemande(false)
  }

  const handleDeconnexion = () => {
    setStep('login')
    setEleve(null)
    setPrenom('')
    setNom('')
    setClasseId('')
    setEmplois([])
    setMessages([])
    setAbsences([])
    setDemandes([])
    setNewMessages(0)
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">👨‍👩‍👧</div>
            <h1 className="text-2xl font-bold text-blue-700">Espace Parent</h1>
            <p className="text-gray-500 text-sm mt-1">Entrez les informations de votre enfant</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom de l'élève</label>
            <input
              type="text"
              placeholder="Ex : Fatou"
              value={prenom}
              onChange={e => { setPrenom(e.target.value); setLoginError('') }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nom de l'élève</label>
            <input
              type="text"
              placeholder="Ex : Diallo"
              value={nom}
              onChange={e => { setNom(e.target.value); setLoginError('') }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Classe</label>
            <select
              value={classeId}
              onChange={e => { setClasseId(e.target.value); setLoginError('') }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">-- Sélectionnez la classe --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              ⚠️ {loginError}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loadingLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60 text-sm"
          >
            {loadingLogin ? 'Recherche en cours...' : 'Accéder au suivi →'}
          </button>

          <button onClick={() => router.push('/')} className="w-full mt-3 text-gray-400 text-xs hover:text-gray-600">
            ← Retour à l'accueil
          </button>

          <p className="text-center text-xs text-gray-400 mt-6">École Connect © 2026</p>
        </div>
      </div>
    )
  }

  const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const today = new Date().toISOString().slice(0, 10)
  const absentAujourdhui = absences.some(a => a.date === today)
  const demandesNonRepondues = demandes.filter(d => !d.reponse).length

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{eleve?.prenom} {eleve?.nom}</h1>
            <p className="text-sm text-gray-500">Classe : <strong>{classeNom}</strong></p>
            {absentAujourdhui && (
              <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                🔴 Absent aujourd'hui
              </span>
            )}
          </div>
          <button onClick={handleDeconnexion} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-xl">
            Changer d'élève
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-1.5 flex gap-1 overflow-x-auto">
          {([
            { key: 'emploi',   label: '📅 Emploi' },
            { key: 'messages', label: `✉️ Messages${newMessages > 0 ? ` 🔴${newMessages}` : ''}` },
            { key: 'absences', label: `📋 Absences${absences.length > 0 ? ` (${absences.length})` : ''}` },
            { key: 'demandes', label: `💬 Demandes${demandesNonRepondues > 0 ? ` 🟡${demandesNonRepondues}` : ''}` },
            { key: 'infos',    label: '🏫 Infos' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="bg-white rounded-2xl shadow-sm p-5 min-h-64">
          {loadingData ? (
            <p className="text-center text-gray-400 py-10">Chargement...</p>
          ) : (
            <>
              {/* Emploi du temps */}
              {activeTab === 'emploi' && (
                <div className="space-y-5">
                  {emplois.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Aucun cours enregistré pour cette classe.</p>}
                  {JOURS.map(jour => {
                    const cours = emplois.filter(e => e.jour?.toLowerCase() === jour.toLowerCase())
                    if (cours.length === 0) return null
                    return (
                      <div key={jour}>
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">{jour}</h3>
                        <div className="space-y-2">
                          {cours.map(c => (
                            <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border-l-4 border-blue-400">
                              <span className="text-xs text-gray-400 font-semibold min-w-[90px]">{c.heure_debut?.slice(0,5)} – {c.heure_fin?.slice(0,5)}</span>
                              <div>
                                <p className="text-sm font-bold text-gray-800">{c.matiere}</p>
                                {c.enseignant && <p className="text-xs text-gray-400">{c.enseignant}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Messages */}
              {activeTab === 'messages' && (
                <div className="space-y-3">
                  {messages.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Aucun message pour l'instant.</p>}
                  {messages.map(m => (
                    <div key={m.id} className="bg-gray-50 rounded-xl p-4 border-l-4 border-green-400">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-green-700">{m.titre ?? 'Administration'}</span>
                        <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{m.contenu ?? '(message vide)'}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Absences */}
              {activeTab === 'absences' && (
                <div>
                  {absentAujourdhui && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                      <span className="text-2xl">🔴</span>
                      <div>
                        <p className="font-bold text-red-700 text-sm">Absent aujourd'hui</p>
                        <p className="text-red-500 text-xs">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                      </div>
                    </div>
                  )}
                  {absences.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-2xl mb-2">✅</p>
                      <p className="text-gray-400 text-sm">Aucune absence enregistrée.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 mb-3">{absences.length} absence{absences.length > 1 ? 's' : ''} au total</p>
                      {absences.map(a => (
                        <div key={a.id} className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-3 border-l-4 border-red-400">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📅</span>
                            <p className="text-sm font-semibold text-red-800">
                              {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          {a.justifiee && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Justifiée</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Demandes */}
              {activeTab === 'demandes' && (
                <div className="space-y-4">
                  {/* Formulaire envoi */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-blue-800 mb-3">✍️ Envoyer un message à l'administration</h3>
                    {demandeSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-lg mb-3 text-xs">{demandeSuccess}</div>
                    )}
                    <textarea
                      value={nouveauMessage}
                      onChange={e => { setNouveauMessage(e.target.value); setDemandeSuccess('') }}
                      className="w-full border border-blue-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-400 h-24"
                      placeholder="Ex : Je voudrais un rendez-vous concernant les notes de mon enfant..."
                    />
                    <button
                      onClick={envoyerDemande}
                      disabled={loadingDemande || !nouveauMessage.trim()}
                      className="w-full mt-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {loadingDemande ? 'Envoi...' : '📤 Envoyer'}
                    </button>
                  </div>

                  {/* Historique demandes */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Historique ({demandes.length})</h3>
                    {demandes.length === 0 && (
                      <p className="text-center text-gray-400 py-4 text-sm">Aucune demande envoyée.</p>
                    )}
                    <div className="space-y-3">
                      {demandes.map(d => (
                        <div key={d.id} className="bg-gray-50 rounded-xl p-4">
                          {/* Message parent */}
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-blue-600">Vous</span>
                            <span className="text-xs text-gray-400">
                              {new Date(d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{d.message}</p>

                          {/* Réponse admin */}
                          {d.reponse ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                              <p className="text-xs font-bold text-green-700 mb-1">✅ Réponse de l'administration</p>
                              <p className="text-sm text-gray-700">{d.reponse}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(d.repondu_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                              <p className="text-xs text-yellow-700 font-semibold">⏳ En attente de réponse</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Infos */}
              {activeTab === 'infos' && (
                <div className="divide-y divide-gray-100">
                  {[
                    { label: 'Élève', value: `${eleve?.prenom} ${eleve?.nom}` },
                    { label: 'Classe', value: classeNom },
                    { label: 'Cours enregistrés', value: emplois.length },
                    { label: 'Messages reçus', value: messages.length },
                    { label: 'Absences', value: absences.length },
                    { label: 'Demandes envoyées', value: demandes.length },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between py-3">
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <span className="text-sm font-bold text-gray-800">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [page, setPage] = useState('home')
  const [authed, setAuthed] = useState(false)
  const [mdp, setMdp] = useState('')
  const [mdpError, setMdpError] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [classeId, setClasseId] = useState('')
  const [classes, setClasses] = useState<any[]>([])
  const [nouvelleClasse, setNouvelleClasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [emploiClasseId, setEmploiClasseId] = useState('')
  const [emplois, setEmplois] = useState<any[]>([])
  const [annonces, setAnnonces] = useState<any[]>([])
  const [annonceTitre, setAnnonceTitre] = useState('')
  const [annonceContenu, setAnnonceContenu] = useState('')
  const [annonceType, setAnnonceType] = useState('tous')
  const [annonceClasseId, setAnnonceClasseId] = useState('')
  const [annonceEleveId, setAnnonceEleveId] = useState('')
  const [elevesClasse, setElevesClasse] = useState<any[]>([])
  const [absenceClasseId, setAbsenceClasseId] = useState('')
  const [elevesAbsence, setElevesAbsence] = useState<any[]>([])
  const [absentsCoches, setAbsentsCoches] = useState<number[]>([])
  const [absences, setAbsences] = useState<any[]>([])
  const [demandes, setDemandes] = useState<any[]>([])
  const [reponses, setReponses] = useState<{[key: number]: string}>({})
  const [loadingAbsence, setLoadingAbsence] = useState(false)

  const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const CRENEAUX = [
    '08:00–09:00', '09:00–10:00', '10:00–11:00',
    '11:00–12:00', '12:00–13:00', '13:00–14:00'
  ]

  useEffect(() => {
    fetchClasses()
    fetchAnnonces()
    fetchDemandes()
  }, [])

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('nom')
    if (data) setClasses(data)
  }

  const fetchEmplois = async (cid: string) => {
    const { data } = await supabase
      .from('emplois_du_temps')
      .select('*')
      .eq('classe_id', cid)
      .order('jour').order('heure_debut')
    if (data) setEmplois(data)
  }

  const fetchAnnonces = async () => {
    const { data } = await supabase
      .from('message')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setAnnonces(data)
  }

const fetchDemandes = async () => {
    const { data } = await supabase
      .from('demandes')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      const avec_eleves = await Promise.all(
        data.map(async (d) => {
          const { data: eleve } = await supabase
            .from('élèves')
            .select('prenom, nom')
            .eq('id', d.eleve_id)
            .single()
          return { ...d, eleve_nom: eleve ? `${eleve.prenom} ${eleve.nom}` : 'Parent inconnu' }
        })
      )
      setDemandes(avec_eleves)
    }
  }

  const fetchElevesClasse = async (cid: string) => {
    const { data } = await supabase
      .from('élèves')
      .select('id, prenom, nom')
      .eq('classe_id', cid)
      .order('nom')
    if (data) setElevesClasse(data)
  }

  const fetchElevesAbsence = async (cid: string) => {
    const { data } = await supabase
      .from('élèves')
      .select('id, prenom, nom')
      .eq('classe_id', cid)
      .order('nom')
    if (data) setElevesAbsence(data)

    const today = new Date().toISOString().slice(0, 10)
    const { data: abs } = await supabase
      .from('absences')
      .select('*')
      .eq('classe_id', cid)
      .eq('date', today)
    if (abs) {
      setAbsences(abs)
      setAbsentsCoches(abs.map((a: any) => a.eleve_id))
    }
  }

  const toggleAbsent = (id: number) => {
    setAbsentsCoches(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const enregistrerAbsences = async () => {
    if (!absenceClasseId) return
    setLoadingAbsence(true)
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('absences').delete().eq('classe_id', absenceClasseId).eq('date', today)
    if (absentsCoches.length > 0) {
      const rows = absentsCoches.map(eid => ({
        eleve_id: eid,
        classe_id: absenceClasseId,
        date: today,
      }))
      await supabase.from('absences').insert(rows)
    }
    setSuccess(`Absences enregistrées pour aujourd'hui !`)
    setLoadingAbsence(false)
  }

  const ajouterEleve = async () => {
    if (!prenom || !nom || !classeId) { setError('Remplissez tous les champs'); return }
    setLoading(true); setError('')
    const { error } = await supabase.from('élèves').insert([{ prenom, nom, classe_id: classeId }])
    if (error) { setError("Erreur lors de l'ajout") }
    else { setSuccess('Élève ajouté !'); setPrenom(''); setNom(''); setClasseId('') }
    setLoading(false)
  }

  const ajouterClasse = async () => {
    if (!nouvelleClasse) { setError('Entrez un nom de classe'); return }
    setLoading(true); setError('')
    const { error } = await supabase.from('classes').insert([{ nom: nouvelleClasse }])
    if (error) { setError("Erreur lors de l'ajout") }
    else { setSuccess('Classe ajoutée !'); setNouvelleClasse(''); fetchClasses() }
    setLoading(false)
  }

  const supprimerCours = async (id: number) => {
    await supabase.from('emplois_du_temps').delete().eq('id', id)
    fetchEmplois(emploiClasseId)
  }

  const envoyerAnnonce = async () => {
    if (!annonceTitre.trim() || !annonceContenu.trim()) {
      setError('Remplissez le titre et le message'); return
    }
    if (annonceType === 'classe' && !annonceClasseId) {
      setError('Choisissez une classe'); return
    }
    if (annonceType === 'eleve' && !annonceEleveId) {
      setError('Choisissez un élève'); return
    }
    setLoading(true); setError(''); setSuccess('')
    const payload: any = {
      titre: annonceTitre,
      contenu: annonceContenu,
      classe_id: null,
      destinataire_id: null,
    }
    if (annonceType === 'classe') payload.classe_id = annonceClasseId
    if (annonceType === 'eleve') {
      payload.classe_id = annonceClasseId
      payload.destinataire_id = annonceEleveId
    }
    const { error } = await supabase.from('message').insert([payload])
    if (error) { setError("Erreur : " + error.message) }
    else {
      setSuccess('Annonce envoyée !')
      setAnnonceTitre('')
      setAnnonceContenu('')
      setAnnonceType('tous')
      setAnnonceClasseId('')
      setAnnonceEleveId('')
      setElevesClasse([])
      fetchAnnonces()
    }
    setLoading(false)
  }

  const supprimerAnnonce = async (id: number) => {
    if (!confirm('Supprimer cette annonce ?')) return
    await supabase.from('message').delete().eq('id', id)
    fetchAnnonces()
  }

  const getCours = (jour: string, creneau: string) => {
    const debut = creneau.split('–')[0].trim()
    return emplois.find(e =>
      e.jour?.toLowerCase() === jour.toLowerCase() &&
      e.heure_debut?.slice(0, 5) === debut
    )
  }

  const handleCellClick = async (jour: string, creneau: string) => {
    const cours = getCours(jour, creneau)
    if (cours) {
      if (confirm(`Supprimer "${cours.matiere}" ?`)) {
        supprimerCours(cours.id)
      }
    } else {
      const mat = prompt(`Matière — ${jour} ${creneau} :`)
      if (!mat) return
      const prof = prompt('Professeur (optionnel, Entrée pour ignorer) :') ?? ''
      const [debut, fin] = creneau.split('–')
      const { error } = await supabase.from('emplois_du_temps').insert([{
        classe_id: emploiClasseId,
        jour,
        heure_debut: debut.trim() + ':00',
        heure_fin: fin.trim() + ':00',
        matiere: mat,
        professeur: prof,
      }])
      if (error) { alert('Erreur : ' + error.message) }
      else { fetchEmplois(emploiClasseId) }
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">⚙️</div>
            <h1 className="text-2xl font-bold text-gray-800">Espace Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Entrez le mot de passe</p>
          </div>
          {mdpError && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{mdpError}</div>}
          <input
            type="password"
            value={mdp}
            onChange={e => setMdp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mdp === 'ecole2026' ? setAuthed(true) : setMdpError('Mot de passe incorrect'))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 mb-4"
            placeholder="Mot de passe"
          />
          <button
            onClick={() => mdp === 'ecole2026' ? setAuthed(true) : setMdpError('Mot de passe incorrect')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  // ── PAGE ABSENCES ──────────────────────────────────────────────
  if (page === 'absences') {
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => { setPage('home'); setSuccess(''); setError('') }} className="text-blue-600 mb-4">← Retour</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">📋 Absences</h1>
          <p className="text-gray-400 text-sm mb-6">{today}</p>
          <div className="bg-white rounded-2xl shadow p-4 mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Classe</label>
            <select
              value={absenceClasseId}
              onChange={e => { setAbsenceClasseId(e.target.value); fetchElevesAbsence(e.target.value); setSuccess(''); setError('') }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
            >
              <option value="">-- Sélectionnez une classe --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          {absenceClasseId && (
            <>
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h2 className="font-semibold text-gray-700 mb-4">
                  Absences du jour ({absentsCoches.length} absent{absentsCoches.length > 1 ? 's' : ''})
                </h2>
                {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}
                {elevesAbsence.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">Aucun élève dans cette classe.</p>
                )}
                <div className="space-y-2 mb-4">
                  {elevesAbsence.map(e => (
                    <div
                      key={e.id}
                      onClick={() => toggleAbsent(e.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border-2 ${absentsCoches.includes(e.id) ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${absentsCoches.includes(e.id) ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                        {absentsCoches.includes(e.id) && <span className="text-white text-xs font-bold">✕</span>}
                      </div>
                      <span className={`text-sm font-medium ${absentsCoches.includes(e.id) ? 'text-red-700' : 'text-gray-700'}`}>
                        {e.prenom} {e.nom}
                      </span>
                      {absentsCoches.includes(e.id) && <span className="ml-auto text-xs text-red-500 font-semibold">Absent</span>}
                    </div>
                  ))}
                </div>
                <button
                  onClick={enregistrerAbsences}
                  disabled={loadingAbsence}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loadingAbsence ? 'Enregistrement...' : '✅ Enregistrer les absences'}
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-semibold text-gray-700 mb-4">
                  📅 Historique — {classes.find(c => c.id === absenceClasseId)?.nom} ({absences.length} absence{absences.length > 1 ? 's' : ''})
                </h2>
                {absences.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucune absence enregistrée.</p>}
                <div className="space-y-2">
                  {absences.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(a => {
                    const eleveNom = elevesAbsence.find(e => e.id === a.eleve_id)
                    return (
                      <div key={a.id} className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-3 border-l-4 border-red-300">
                        <div>
                          <p className="text-sm font-bold text-red-800">{eleveNom ? `${eleveNom.prenom} ${eleveNom.nom}` : `Élève #${a.eleve_id}`}</p>
                          <p className="text-xs text-red-400">{new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm('Supprimer cette absence ?')) return
                            await supabase.from('absences').delete().eq('id', a.id)
                            fetchElevesAbsence(absenceClasseId)
                            setSuccess('Absence supprimée !')
                          }}
                          className="text-red-400 hover:text-red-600 text-xs font-semibold px-3 py-1 rounded-lg hover:bg-red-100 transition"
                        >🗑️</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── PAGE EMPLOIS DU TEMPS ──────────────────────────────────────
  if (page === 'emplois') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => { setPage('home'); setSuccess(''); setError('') }} className="text-blue-600 mb-4">← Retour</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">📅 Emplois du temps</h1>
          <div className="bg-white rounded-2xl shadow p-4 mb-6 flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Classe :</label>
            <select
              value={emploiClasseId}
              onChange={e => { setEmploiClasseId(e.target.value); fetchEmplois(e.target.value) }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 flex-1"
            >
              <option value="">-- Sélectionnez une classe --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            {emploiClasseId && <span className="text-xs text-gray-400 hidden md:block">Cliquez sur une case vide pour ajouter • Cliquez sur un cours pour supprimer</span>}
          </div>
          {emploiClasseId && (
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-3 py-3 text-xs font-bold text-left w-28 border-r border-blue-500">Horaire</th>
                      {JOURS.map(j => <th key={j} className="px-3 py-3 text-xs font-bold text-center border-r border-blue-500 last:border-r-0">{j}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {CRENEAUX.map((creneau, i) => (
                      <tr key={creneau} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-4 text-xs font-bold text-blue-700 border-r border-gray-200 whitespace-nowrap">{creneau.replace('–', ' –\n')}</td>
                        {JOURS.map(jour => {
                          const cours = getCours(jour, creneau)
                          return (
                            <td key={jour} onClick={() => handleCellClick(jour, creneau)} className={`px-2 py-4 text-center border-r border-gray-200 last:border-r-0 cursor-pointer transition min-w-[100px] ${cours ? 'bg-blue-50 hover:bg-red-50' : 'hover:bg-green-50'}`}>
                              {cours ? (
                                <div>
                                  <p className="text-xs font-bold text-blue-800">{cours.matiere}</p>
                                  {cours.professeur && <p className="text-xs text-gray-400 mt-0.5">{cours.professeur}</p>}
                                </div>
                              ) : <span className="text-gray-300 text-xl">+</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-6 text-xs text-gray-400">
                <span>🟦 Cours existant → cliquer pour supprimer</span>
                <span>⬜ Case vide → cliquer pour ajouter</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── PAGE ANNONCES ──────────────────────────────────────────────
  if (page === 'annonces') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => { setPage('home'); setSuccess(''); setError('') }} className="text-blue-600 mb-4">← Retour</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">📢 Annonces</h1>
          <div className="bg-white rounded-2xl shadow p-6 space-y-4 mb-6">
            <h2 className="font-semibold text-gray-700">✉️ Envoyer une annonce</h2>
            {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">{success}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input value={annonceTitre} onChange={e => setAnnonceTitre(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800" placeholder="Ex : Réunion parents d'élèves" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destinataires</label>
              <select value={annonceType} onChange={e => { setAnnonceType(e.target.value); setAnnonceClasseId(''); setAnnonceEleveId(''); setElevesClasse([]) }} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 mb-2">
                <option value="tous">🏫 Toute l'école</option>
                <option value="classe">👥 Une classe</option>
                <option value="eleve">👤 Un élève</option>
              </select>
              {annonceType === 'classe' && (
                <select value={annonceClasseId} onChange={e => setAnnonceClasseId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800">
                  <option value="">-- Choisir une classe --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              )}
              {annonceType === 'eleve' && (
                <div className="space-y-2">
                  <select value={annonceClasseId} onChange={e => { setAnnonceClasseId(e.target.value); fetchElevesClasse(e.target.value) }} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800">
                    <option value="">-- Choisir une classe d'abord --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                  {elevesClasse.length > 0 && (
                    <select value={annonceEleveId} onChange={e => setAnnonceEleveId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800">
                      <option value="">-- Choisir un élève --</option>
                      {elevesClasse.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={annonceContenu} onChange={e => setAnnonceContenu(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 h-32" placeholder="Écrivez votre annonce ici..." />
            </div>
            <button onClick={envoyerAnnonce} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Envoi...' : "📤 Envoyer l'annonce"}
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-4">📋 Annonces envoyées ({annonces.length})</h2>
            {annonces.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucune annonce pour l'instant.</p>}
            <div className="space-y-3">
              {annonces.map(a => (
                <div key={a.id} className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-400">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-gray-800 text-sm">{a.titre ?? '(sans titre)'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <button onClick={() => supprimerAnnonce(a.id)} className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    {a.destinataire_id ? '👤 Élève spécifique' : a.classe_id ? '👥 ' + (classes.find(c => c.id === a.classe_id)?.nom ?? 'Classe') : "🏫 Toute l'école"}
                  </p>
                  <p className="text-sm text-gray-600">{a.contenu}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PAGE AJOUTER ÉLÈVE ─────────────────────────────────────────
  if (page === 'ajouter') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => { setPage('eleves'); setSuccess(''); setError('') }} className="text-blue-600 mb-4">← Retour</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">➕ Ajouter un Élève</h1>
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">{success}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input value={prenom} onChange={e => setPrenom(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800" placeholder="Prénom de l'élève" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input value={nom} onChange={e => setNom(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800" placeholder="Nom de l'élève" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
              <select value={classeId} onChange={e => setClasseId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800">
                <option value="">Choisir une classe</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <button onClick={ajouterEleve} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Ajout...' : "➕ Ajouter l'élève"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PAGE CLASSES ───────────────────────────────────────────────
  if (page === 'classes') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => { setPage('home'); setSuccess(''); setError('') }} className="text-blue-600 mb-4">← Retour</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">🏫 Gestion des Classes</h1>
          <div className="bg-white rounded-2xl shadow p-6 space-y-4 mb-6">
            {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">{success}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la classe</label>
              <input value={nouvelleClasse} onChange={e => setNouvelleClasse(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800" placeholder="Ex: CI B, CP A, 6ème B..." />
            </div>
            <button onClick={ajouterClasse} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Ajout...' : '➕ Ajouter la classe'}
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-3">Classes existantes ({classes.length})</h2>
            <div className="grid grid-cols-3 gap-2">
              {classes.map(c => (
                <div key={c.id} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm text-center font-medium">{c.nom}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PAGE ÉLÈVES ────────────────────────────────────────────────
  if (page === 'eleves') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setPage('home')} className="text-blue-600 mb-4">← Retour</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">👨‍🎓 Gestion des Élèves</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div onClick={() => setPage('ajouter')} className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition border-2 border-blue-100">
              <div className="text-3xl mb-2">➕</div>
              <h2 className="font-semibold text-gray-700">Ajouter un élève</h2>
              <p className="text-gray-400 text-sm">Ajouter manuellement</p>
            </div>
            <div onClick={() => setPage('liste')} className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition border-2 border-purple-100">
              <div className="text-3xl mb-2">📋</div>
              <h2 className="font-semibold text-gray-700">Liste par classe</h2>
              <p className="text-gray-400 text-sm">Voir et supprimer</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 border-2 border-green-100">
              <div className="text-3xl mb-2">📂</div>
              <h2 className="font-semibold text-gray-700">Importer CSV</h2>
              <p className="text-gray-400 text-sm">Ajouter en masse</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PAGE LISTE ÉLÈVES ──────────────────────────────────────────
  if (page === 'liste') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => { setPage('eleves'); setSuccess(''); setError('') }} className="text-blue-600 mb-4">← Retour</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 Liste des élèves</h1>
          <div className="bg-white rounded-2xl shadow p-4 mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Classe</label>
            <select
              value={classeId}
              onChange={e => { setClasseId(e.target.value); fetchElevesClasse(e.target.value) }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
            >
              <option value="">-- Sélectionnez une classe --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          {classeId && (
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-gray-700 mb-4">
                {classes.find(c => c.id === classeId)?.nom} — {elevesClasse.length} élève{elevesClasse.length > 1 ? 's' : ''}
              </h2>
              {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}
              {elevesClasse.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucun élève dans cette classe.</p>}
              <div className="space-y-2">
                {elevesClasse.map((e, index) => (
                  <div key={e.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-bold w-6">{index + 1}</span>
                      <p className="text-sm font-semibold text-gray-800">{e.prenom} {e.nom}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`Supprimer ${e.prenom} ${e.nom} ?`)) return
                        const { error } = await supabase.from('élèves').delete().eq('id', e.id)
                        if (error) { alert('Erreur : ' + error.message) }
                        else { setSuccess(`${e.prenom} ${e.nom} supprimé !`); fetchElevesClasse(classeId) }
                      }}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold px-3 py-1 rounded-lg hover:bg-red-50 transition"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── PAGE DEMANDES ──────────────────────────────────────────────
  if (page === 'demandes') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => { setPage('home'); setSuccess(''); setError('') }} className="text-blue-600 mb-4">← Retour</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">💬 Demandes des parents</h1>
          {demandes.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-gray-400 text-sm">Aucune demande pour l'instant.</p>
            </div>
          )}
          <div className="space-y-4">
            {demandes.map(d => (
              <div key={d.id} className="bg-white rounded-2xl shadow p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{d.eleve_nom}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {d.reponse ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">✅ Répondu</span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">⏳ En attente</span>
                  )}
                </div>
                <div className="bg-blue-50 rounded-xl p-3 mb-3">
                  <p className="text-xs font-bold text-blue-600 mb-1">Message du parent</p>
                  <p className="text-sm text-gray-700">{d.message}</p>
                </div>
                {d.reponse && (
                  <div className="bg-green-50 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-green-600 mb-1">Votre réponse</p>
                    <p className="text-sm text-gray-700">{d.reponse}</p>
                  </div>
                )}
                {!d.reponse && (
                  <div>
                    <textarea
                      value={reponses[d.id] ?? ''}
                      onChange={e => setReponses(prev => ({ ...prev, [d.id]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 h-20 focus:outline-none focus:border-blue-400"
                      placeholder="Écrivez votre réponse..."
                    />
                    <button
                      onClick={async () => {
                        const rep = reponses[d.id]
                        if (!rep?.trim()) return
                        const { error } = await supabase
                          .from('demandes')
                          .update({ reponse: rep.trim(), repondu_at: new Date().toISOString() })
                          .eq('id', d.id)
                        if (error) { alert('Erreur : ' + error.message) }
                        else {
                          setReponses(prev => { const n = {...prev}; delete n[d.id]; return n })
                          fetchDemandes()
                        }
                      }}
                      className="w-full mt-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                    >
                      📤 Envoyer la réponse
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── PAGE HOME ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">⚙️ Espace Admin</h1>
          <p className="text-gray-500 mt-1">Gestion de l'école</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div onClick={() => setPage('eleves')} className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">👨‍🎓</div>
            <h2 className="font-semibold text-gray-700">Élèves</h2>
            <p className="text-gray-400 text-sm">Gérer les élèves</p>
          </div>
          <div onClick={() => setPage('classes')} className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">🏫</div>
            <h2 className="font-semibold text-gray-700">Classes</h2>
            <p className="text-gray-400 text-sm">Gérer les classes</p>
          </div>
          <div onClick={() => setPage('emplois')} className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">📅</div>
            <h2 className="font-semibold text-gray-700">Emplois du temps</h2>
            <p className="text-gray-400 text-sm">Gérer les horaires</p>
          </div>
          <div onClick={() => setPage('annonces')} className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">📢</div>
            <h2 className="font-semibold text-gray-700">Annonces</h2>
            <p className="text-gray-400 text-sm">Envoyer des messages</p>
          </div>
          <div onClick={() => setPage('absences')} className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">📋</div>
            <h2 className="font-semibold text-gray-700">Absences</h2>
            <p className="text-gray-400 text-sm">Marquer les absents</p>
          </div>
          <div onClick={() => setPage('demandes')} className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">💬</div>
            <h2 className="font-semibold text-gray-700">Demandes</h2>
            <p className="text-gray-400 text-sm">Répondre aux parents</p>
          </div>
        </div>
      </div>
    </div>
  )
}
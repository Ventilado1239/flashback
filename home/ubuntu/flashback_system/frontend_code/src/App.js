import { useState, useEffect } from 'react'
import { partyInfo, menuItems } from './data/menu.js'
import './App.css'

// URL do backend (lê do .env e usa localhost se não tiver)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

// ===== função para puxar stats do backend (tolerante a formatos) =====
async function fetchStatsAPI() {
  const res = await fetch(`${API_URL}/stats`)
  const json = await res.json()
  if (!res.ok || json.success === false) {
    throw new Error(json?.error || `Erro HTTP ${res.status}`)
  }
  // seu back manda { data: {...} }, então normalizamos:
  const data = json?.data ?? json
  return data // { dish_stats: [{dish, count}], ... }
}

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: 1,
    selectedDish: '',
    paymentType: 'individual'
  })
  const [availableItems, setAvailableItems] = useState(
    // garante selectedBy sempre como array
    menuItems.map(it => ({ ...it, selectedBy: it.selectedBy || [], selectedCount: it.selectedCount || 0 }))
  )
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentDecade, setCurrentDecade] = useState('60s')
  const [isPlaying, setIsPlaying] = useState(false)
  const [youtubePlayer, setYoutubePlayer] = useState(null)

  // Inicializar player do YouTube
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT) {
        initializePlayer()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)

      window.onYouTubeIframeAPIReady = initializePlayer
    }

    const initializePlayer = () => {
      const player = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: 'djV11Xbc914',
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: 'djV11Xbc914',
          controls: 0,
          showinfo: 0,
          rel: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          start: 0
        },
        events: {
          onReady: (event) => {
            setYoutubePlayer(event.target)
            event.target.setVolume(20)
            
            const startOnInteraction = () => {
              try {
                event.target.playVideo()
                setIsPlaying(true)
                document.removeEventListener('click', startOnInteraction)
                document.removeEventListener('touchstart', startOnInteraction)
              } catch (error) {
                console.log('Aguardando interação do usuário')
              }
            }

            document.addEventListener('click', startOnInteraction)
            document.addEventListener('touchstart', startOnInteraction)
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
            }
          }
        }
      })
    }

    loadYouTubeAPI()
  }, [])

  const toggleMusic = () => {
    if (youtubePlayer) {
      if (isPlaying) {
        youtubePlayer.pauseVideo()
        setIsPlaying(false)
      } else {
        youtubePlayer.playVideo()
        setIsPlaying(true)
      }
    }
  }

  const decades = {
    '60s': { 
      color: 'from-cyan-400 via-blue-500 to-purple-600', 
      title: 'Anos 60',
      pattern: 'future-grid'
    },
    '70s': { 
      color: 'from-blue-400 via-cyan-500 to-teal-600', 
      title: 'Anos 70',
      pattern: 'circuit-pattern'
    },
    '80s': { 
      color: 'from-purple-500 via-blue-600 to-cyan-500', 
      title: 'Anos 80',
      pattern: 'future-grid'
    },
    '90s': { 
      color: 'from-indigo-600 via-blue-700 to-cyan-600', 
      title: 'Anos 90',
      pattern: 'circuit-pattern'
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const decadeKeys = Object.keys(decades)
      const currentIndex = decadeKeys.indexOf(currentDecade)
      const nextIndex = (currentIndex + 1) % decadeKeys.length
      setCurrentDecade(decadeKeys[nextIndex])
    }, 4000)

    return () => clearInterval(interval)
  }, [currentDecade])

  // ===== SINCRONIZAÇÃO COM O BACKEND =====
  useEffect(() => {
    let alive = true

    async function syncFromBackend() {
      try {
        const stats = await fetchStatsAPI()
        const dishStats = (stats?.dish_stats || [])  // [{ dish, count }]

        if (!alive) return

        setAvailableItems(prev =>
          prev.map(item => {
            // casa pelo nome do prato que você exibe
            const match = dishStats.find(d => d.dish === item.name)
            const confirmed = Number(match?.count ?? 0)
            const capacity  = Number(item.maxCount) // capacidade vem do menu local

            return {
              ...item,
              maxCount: capacity,
              selectedCount: confirmed,
              available: confirmed < capacity,
              selectedBy: item.selectedBy || []
            }
          })
        )
      } catch (e) {
        console.error('Falha ao sincronizar stats:', e)
      }
    }

    syncFromBackend()                 // primeira carga
    const id = setInterval(syncFromBackend, 10000) // e a cada 10s

    return () => { alive = false; clearInterval(id) }
  }, [])

  const calculateTotal = () => {
    const basePrice = formData.paymentType === 'couple' ? partyInfo.prices.couple : partyInfo.prices.individual
    return formData.paymentType === 'individual' ? basePrice * formData.guests : basePrice
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.selectedDish) {
      alert('Por favor, selecione um prato para levar!')
      return
    }
    
    try {
      // guests fixo conforme regra: individual=1, casal=2
      const guestsFixed = formData.paymentType === 'couple' ? 2 : 1

      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        guests: guestsFixed,
        selected_dish: availableItems.find(item => item.id === parseInt(formData.selectedDish))?.name,
        payment_type: formData.paymentType
      }

      console.log('POST ->', `${API_URL}/rsvps`, submitData)

      const response = await fetch(`${API_URL}/rsvps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status} – ${text}`)
      }
      
      const result = await response.json()
      console.log('RESPOSTA <-', result)
      
      if (result?.success) {
        // mantém sua UX: efeito imediato local
        setAvailableItems(prev => 
          prev.map(item => {
            if (item.id === parseInt(formData.selectedDish)) {
              const newSelectedCount = (item.selectedCount || 0) + 1
              const newSelectedBy = [...(item.selectedBy || []), formData.name] // <- seguro
              return { 
                ...item, 
                selectedCount: newSelectedCount,
                selectedBy: newSelectedBy,
                available: newSelectedCount < item.maxCount
              }
            }
            return item
          })
        )

        // sincroniza com back (usa dish/count)
        try {
          const stats = await fetchStatsAPI()
          const dishStats = (stats?.dish_stats || [])

          setAvailableItems(prev =>
            prev.map(item => {
              const match = dishStats.find(d => d.dish === item.name)
              const confirmed = Number(match?.count ?? 0)
              const capacity  = Number(item.maxCount)
              return { 
                ...item, 
                maxCount: capacity, 
                selectedCount: confirmed, 
                available: confirmed < capacity,
                selectedBy: item.selectedBy || []
              }
            })
          )
        } catch (e) {
          console.error('Falha ao atualizar stats após submit:', e)
        }

        setIsSubmitted(true)
      } else {
        throw new Error(result?.error || 'Erro ao enviar RSVP')
      }
    } catch (error) {
      console.error('Erro ao enviar RSVP:', error)
      alert(`Erro: ${error.message || 'Erro de conexão. Verifique sua internet e tente novamente.'}`)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white overflow-x-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 opacity-20 future-grid"></div>
        <div className="fixed inset-0 opacity-10 circuit-pattern"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full text-center retro-card">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl text-cyan-400 neon-glow mb-4 font-mono">⚡ PORTAL ATIVADO COM SUCESSO! ⚡</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-white font-mono">Obrigado, <strong className="text-cyan-400">{formData.name}</strong>!</p>
              <p className="text-white font-mono">Sua viagem temporal foi registrada com sucesso.</p>
              <p className="text-white font-mono">
                Prato selecionado: <span className="border border-cyan-400 text-cyan-400 px-2 py-1 rounded text-sm font-mono">
                  {availableItems.find(item => item.id === parseInt(formData.selectedDish))?.name}
                </span>
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-4 rounded-lg border border-cyan-400/30 mb-6">
              <p className="text-cyan-400 font-semibold font-mono text-lg">
                💰 Total: R$ {calculateTotal()},00
              </p>
              <div className="mt-3 p-3 bg-black/50 rounded border border-cyan-400/30">
                <p className="text-sm text-cyan-400 font-mono">
                  CHAVE PIX: <span className="text-white font-bold">{partyInfo.pixKey}</span>
                </p>
                <p className="text-sm text-white mt-1 font-mono">
                  Envie o comprovante para confirmar sua presença!
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 p-4 rounded-lg border border-green-400/30 mb-6">
              <h3 className="text-green-400 font-mono font-semibold mb-2">✅ PRÓXIMOS PASSOS:</h3>
              <ul className="text-sm text-white font-mono text-left space-y-1">
                <li>• Faça o PIX no valor indicado</li>
                <li>• Envie o comprovante para confirmação</li>
                <li>• Prepare sua fantasia dos anos 60-90</li>
                <li>• Traga seu cooler com gelo</li>
              </ul>
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full button-primary font-mono text-lg py-3"
            >
              ⚡ REGISTRAR NOVO VIAJANTE
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white overflow-x-hidden">
      <div id="youtube-player" style={{ display: 'none' }}></div>
      
      <div className={`fixed inset-0 bg-gradient-to-br ${decades[currentDecade].color} opacity-20 decade-transition ${decades[currentDecade].pattern}`}></div>
      <div className="fixed inset-0 opacity-10 circuit-pattern"></div>
      
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleMusic}
          className="button-primary border border-cyan-400 bg-black/50 text-cyan-400 px-4 py-2 rounded"
        >
          🎵 {isPlaying ? '⏸️ Take On Me' : '▶️ Take On Me'} ♪
        </button>
      </div>

      <div className="relative z-10">
        <section className="min-h-screen flex items-center justify-center text-center p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-4 text-cyan-400 animate-spin text-4xl">⚙️</div>
            </div>
            
            <div className="mb-8">
              <div className="mx-auto max-w-full h-auto opacity-90 hover:opacity-100 transition-opacity duration-300 text-6xl">
                🎉 FLASHBACK 🎉
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 flashback-title neon-glow">
              FESTA TEMPORAL
            </h1>
            <p className="text-xl md:text-3xl mb-8 text-cyan-300 font-mono">
              &gt; Uma viagem no tempo através das décadas_
            </p>
            <div className="flex justify-center space-x-4 text-sm md:text-base mb-8">
              <span className="border border-cyan-400/50 text-cyan-400 bg-black/30 px-2 py-1 rounded">1960s</span>
              <span className="border border-blue-400/50 text-blue-400 bg-black/30 px-2 py-1 rounded">1970s</span>
              <span className="border border-purple-400/50 text-purple-400 bg-black/30 px-2 py-1 rounded">1980s</span>
              <span className="border border-indigo-400/50 text-indigo-400 bg-black/30 px-2 py-1 rounded">1990s</span>
            </div>
            <div className="text-cyan-400 font-mono text-lg animate-pulse">
              ⚡ SISTEMA ATIVADO - PREPARANDO VIAGEM TEMPORAL
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 neon-title font-mono">
              &gt; DADOS DA MISSÃO_
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card-readable hover:scale-105 transition-transform bg-black/50 border border-cyan-400/30 rounded-lg p-6">
                <h3 className="flex items-center text-cyan-readable mb-4">
                  📅 DATA DE PARTIDA
                </h3>
                <p className="text-readable font-mono text-lg">{partyInfo.date}</p>
              </div>

              <div className="card-readable hover:scale-105 transition-transform bg-black/50 border border-cyan-400/30 rounded-lg p-6">
                <h3 className="flex items-center text-cyan-readable mb-4">
                  🕐 HORÁRIO TEMPORAL
                </h3>
                <p className="text-readable font-mono text-lg">{partyInfo.time}</p>
              </div>

              <div className="card-readable hover:scale-105 transition-transform bg-black/50 border border-cyan-400/30 rounded-lg p-6">
                <h3 className="flex items-center text-cyan-readable mb-4">
                  📍 COORDENADAS
                </h3>
                <p className="text-readable font-mono text-sm">{partyInfo.location}</p>
                <button 
                  className="mt-2 button-primary border border-cyan-400 bg-cyan-400/20 text-cyan-400 px-3 py-1 rounded text-sm"
                  onClick={() => {
                    const address = encodeURIComponent(partyInfo.location)
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`
                    window.open(googleMapsUrl, '_blank')
                  }}
                >
                  ⚡ NAVEGAR
                </button>
              </div>

              <div className="card-readable hover:scale-105 transition-transform bg-black/50 border border-cyan-400/30 rounded-lg p-6">
                <h3 className="flex items-center text-cyan-readable mb-4">
                  ✨ PROTOCOLO DE VESTIMENTA
                </h3>
                <p className="text-readable font-mono">{partyInfo.theme}</p>
              </div>

              <div className="card-readable hover:scale-105 transition-transform bg-black/50 border border-cyan-400/30 rounded-lg p-6">
                <h3 className="flex items-center text-cyan-readable mb-4">
                  🎵 SISTEMA DE ÁUDIO
                </h3>
                <p className="text-readable font-mono">{partyInfo.dj}</p>
              </div>

              <div className="card-readable hover:scale-105 transition-transform bg-black/50 border border-cyan-400/30 rounded-lg p-6">
                <h3 className="flex items-center text-cyan-readable mb-4">
                  💰 CUSTO ENERGÉTICO
                </h3>
                <p className="text-readable font-mono">Individual: R$ {partyInfo.prices.individual},00</p>
                <p className="text-readable font-mono">Casal: R$ {partyInfo.prices.couple},00</p>
              </div>
            </div>
            
            {partyInfo.observation && (
              <div className="mt-8 max-w-4xl mx-auto">
                <div className="card-readable bg-black/50 border border-cyan-400/30 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <span className="text-cyan-readable text-2xl">👨‍🍳</span>
                    <div>
                      <h3 className="font-semibold text-cyan-readable mb-2 font-mono">OBSERVAÇÃO IMPORTANTE</h3>
                      <p className="text-readable font-mono text-sm leading-relaxed">{partyInfo.observation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {partyInfo.coolerObservation && (
              <div className="mt-4 max-w-4xl mx-auto">
                <div className="card-readable bg-black/50 border border-cyan-400/30 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <span className="text-cyan-readable text-2xl">⚡</span>
                    <div>
                      <h3 className="font-semibold text-cyan-readable mb-2 font-mono">LEMBRETE ESSENCIAL</h3>
                      <p className="text-readable font-mono text-sm leading-relaxed">{partyInfo.coolerObservation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="card-readable bg-black/50 border border-cyan-400/30 rounded-lg p-6">
              <h2 className="text-2xl text-center neon-title flex items-center justify-center font-mono mb-4">
                👥 &gt; REGISTRO DE VIAJANTE_
              </h2>
              <p className="text-center text-readable font-mono mb-6">
                Insira seus dados para ativar o portal temporal
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-cyan-readable font-mono mb-2">NOME COMPLETO *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/50 border border-cyan-400/50 rounded px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-cyan-readable font-mono mb-2">E-MAIL *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black/50 border border-cyan-400/50 rounded px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-cyan-readable font-mono mb-2">COMUNICADOR</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-black/50 border border-cyan-400/50 rounded px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-cyan-readable font-mono mb-2">TIPO DE TRANSPORTE *</label>
                  <select
                    required
                    value={formData.paymentType}
                    onChange={(e) => {
                      const value = e.target.value
                      // força guests: individual=1, casal=2
                      setFormData({...formData, paymentType: value, guests: value === 'couple' ? 2 : 1})
                    }}
                    className="w-full bg-black/50 border border-cyan-400/50 rounded px-3 py-2 text-white font-mono"
                  >
                    <option value="individual">Individual (R$ 60/pessoa)</option>
                    <option value="couple">Casal (R$ 100)</option>
                  </select>
                </div>

                {/* Individual = 1 pessoa (campo bloqueado só informativo) */}
                {formData.paymentType === 'individual' && (
                  <div>
                    <label className="block text-cyan-readable font-mono mb-2">NÚMERO DE VIAJANTES</label>
                    <input
                      type="number"
                      value={1}
                      readOnly
                      disabled
                      className="w-full bg-black/30 border border-cyan-400/30 rounded px-3 py-2 text-white font-mono opacity-70 cursor-not-allowed"
                    />
                    <p className="text-xs text-cyan-400/80 mt-1 font-mono">Individual = 1 pessoa (fixo)</p>
                  </div>
                )}

                <div>
                  <label className="block text-cyan-readable font-mono mb-2">SUPRIMENTO ALIMENTAR * (seleção única)</label>
                  <select
                    required
                    value={formData.selectedDish}
                    onChange={(e) => {
                      console.log('Selecionando prato:', e.target.value);
                      setFormData({...formData, selectedDish: e.target.value});
                    }}
                    className="w-full bg-black/50 border border-cyan-400/50 rounded px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="">Selecione um suprimento</option>
                    {availableItems.filter(item => item.available).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.selectedCount}/{item.maxCount})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-4 rounded-lg border border-cyan-400/30">
                  <h3 className="text-cyan-readable font-mono mb-2">CUSTO TOTAL DA VIAGEM</h3>
                  <p className="text-readable font-mono text-xl">⚡ R$ {calculateTotal()},00</p>
                  <div className="mt-3 p-3 bg-black/50 rounded border border-cyan-400/30">
                    <p className="text-sm text-cyan-readable font-mono">
                      CHAVE PIX: <span className="text-white font-bold">{partyInfo.pixKey}</span>
                    </p>
                    <p className="text-sm text-readable mt-1 font-mono">
                      Envie o comprovante após o pagamento para ativar o portal
                    </p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full button-primary font-mono text-lg py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-black font-semibold rounded"
                >
                  ⚡ ATIVAR PORTAL TEMPORAL
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-8 neon-title font-mono">
              &gt; SUPRIMENTES DISPONÍVEIS_
            </h2>
            <p className="text-center text-readable mb-8 font-mono">
              Status dos suprimentos alimentares para a missão
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableItems.map(item => (
                <div 
                  key={item.id} 
                  className={`transition-all hover:scale-105 rounded-lg p-4 ${
                    item.available 
                      ? 'bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-400/50' 
                      : 'bg-gradient-to-br from-red-500/20 to-gray-500/20 border border-red-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-mono font-medium text-sm">{item.name}</span>
                    <span 
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        item.available ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      }`}
                    >
                      {item.available ? "DISPONÍVEL" : "ESGOTADO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-readable font-mono text-xs">
                      Vagas: {item.selectedCount}/{item.maxCount}
                    </span>
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          item.available ? 'bg-green-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${(item.selectedCount / item.maxCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  {item.selectedCount > 0 && (
                    <p className="text-xs text-readable mt-2 font-mono">
                      Últimos: {(item.selectedBy || []).slice(-2).join(', ')}
                      {(item.selectedBy || []).length > 2 && ` +${(item.selectedBy || []).length - 2}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="py-8 text-center text-cyan-400/60 font-mono">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span>⚙️</span>
            <span>FLASHBACK 2025 - SISTEMA TEMPORAL ATIVO</span>
            <span>⚙️</span>
          </div>
          <p className="text-xs">Uma experiência inesquecível através do tempo ⚡</p>
        </footer>
      </div>
    </div>
  )
}

export default App

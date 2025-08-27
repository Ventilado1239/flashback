// Cardápio da festa - Comidas de Boteco
// Cada prato pode ser escolhido por até 7 pessoas (110 convidados / 18 pratos ≈ 6-7 por prato)
export const menuItems = [
  { id: 1, name: "Almôndegas com mandioca", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 2, name: "Torresmo", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 3, name: "Calabresa frita", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 4, name: "Batata frita", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 5, name: "Carne de sol frita", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 6, name: "Caldos", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 7, name: "Pastéis", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 8, name: "Churrasquinho", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 9, name: "Frango a passarinho", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 10, name: "Linguiça acebolada", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 11, name: "Cachorro quente", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 12, name: "Mandioca frita", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 13, name: "Frios (mussarela, presunto, mortadela, ovos de codorna, azeitona, salsicha, palmito, salaminho)", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 14, name: "Bolinho de arroz", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 15, name: "Bolinho de bacalhau", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 16, name: "Camarão", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 17, name: "Tilápia frita", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] },
  { id: 18, name: "Kibe", available: true, selectedCount: 0, maxCount: 7, selectedBy: [] }
];

// Informações da festa
export const partyInfo = {
  title: "FLASHBACK",
  subtitle: "Uma viagem no tempo através das décadas",
  date: "06/09/2025",
  time: "21:00 às 06:00",
  location: "Rua 06 Chácara 266 Lote 22A, Vicente Pires",
  theme: "Festa fantasia (anos 60-90)",
  dj: "DJ e atração especial",
  observation: "Teremos uma pessoa à disposição para o preparo de frituras e pratos quentes, garantindo que tudo seja servido fresquinho!",
  coolerObservation: "IMPORTANTE: Cada convidado deve levar seu próprio cooler com gelo para manter as bebidas geladas durante toda a festa!",
  totalGuests: 110,
  maxPerDish: 7,
  prices: {
    individual: 60,
    couple: 100
  },
  pixKey: "61983000309",
  pixName: "Festa Flashback"
};
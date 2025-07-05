# SwagForm + Flare Web2Json Integration

Questo progetto integra **SwagForm** con **Flare Data Connector (FDC)** per permettere la verifica di dati Web2 direttamente on-chain usando il protocollo **Web2Json**.

## 🌟 Panoramica

La integrazione permette di:
- ✅ Richiedere **proof Web2Json** per specifiche domande nei form
- ✅ Verificare **esistenza di tweet** tramite API Twitter
- ✅ Assicurare **autenticità** dei post social degli utenti
- ✅ Collegare **contenuti Twitter con blockchain** in modo sicuro

## 🏗️ Architettura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   World Chain   │    │   Flare FDC     │    │  Twitter API    │
│                 │    │                 │    │                 │
│  SwagForm.sol   │◄──►│ProofManager.sol │◄──►│ Tweet Verification│
│                 │    │                 │    │                 │
│ - Forms         │    │ - Tweet Storage │    │ - Tweet content │
│ - Submissions   │    │ - Verification  │    │ - Author info   │
│ - Proof flags   │    │ - Cross-chain   │    │ - Timestamps    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Contratti

### 1. SwagForm.sol (World Chain)
- **Rete**: World Chain (Chain ID: 4801)
- **Indirizzo**: `0xDD0a13b48dd11985Ca8d7562B9564232AB8719B8`
- **Funzionalità**: Gestione form con supporto per proof requirements

### 2. SwagFormProofManager.sol (Flare Coston2)
- **Rete**: Flare Coston2 (Chain ID: 114)
- **Funzionalità**: Verifica proof Web2Json e sincronizzazione con World Chain

## 🚀 Setup e Deployment

### Prerequisiti
```bash
# Installa Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Clona il repository
git clone <repository-url>
cd contracts/flare-coston2
```

### Configurazione
1. **Crea file `.env`**:
```bash
PRIVATE_KEY=<your-private-key>
ETHERSCAN_API_KEY=<optional-for-verification>
```

2. **Configura parametri API** in `script/SwagFormProofManager.s.sol`:
```solidity
// Configurazione: Verifica esistenza tweet
string public apiUrl = "https://api.twitter.com/2/tweets/${tweetId}";
string public postProcessJq = '{tweetId: .data.id, authorUsername: .includes.users[0].username, tweetText: .data.text, exists: true}';
```

### Deployment
```bash
# Deploy su Flare Coston2
forge script script/SwagFormProofManager.s.sol:SwagFormProofManagerScript --rpc-url coston2 --broadcast

# Test del contratto
forge script script/SwagFormProofManager.s.sol:TestSwagFormProofManager --rpc-url coston2 --broadcast
```

## 🔧 Configurazione API

### Parametri Web2Json
Secondo la [documentazione Flare](https://dev.flare.network/fdc/guides/foundry/web-2-json-for-custom-api):

```solidity
// URL dell'API Twitter da chiamare
string public apiUrl = "https://api.twitter.com/2/tweets/${tweetId}";

// Metodo HTTP
string public httpMethod = "GET";

// Headers della richiesta (con Bearer Token)
string public headers = '{"Authorization": "Bearer ${TWITTER_BEARER_TOKEN}"}';

// Query parameters per ottenere informazioni complete
string public queryParams = "?tweet.fields=created_at,author_id,text&user.fields=username";

// Filtro jq per processare la risposta Twitter
string public postProcessJq = '{tweetId: .data.id, authorUsername: .includes.users[0].username, tweetText: .data.text, createdAt: .data.created_at, exists: true}';

// Signature ABI per decodificare
string public abiSignature = '{"components": [...], "name": "verifiedTweet", "type": "tuple"}';
```

### Esempio: Verifica Tweet Specifico
```solidity
// Verifica esistenza di un tweet
apiUrl = "https://api.twitter.com/2/tweets/1234567890123456789";
postProcessJq = '{
  tweetId: .data.id,
  authorUsername: .includes.users[0].username,
  tweetText: .data.text,
  createdAt: .data.created_at,
  exists: (.data.id != null),
  timestamp: now
}';
```

## 💻 Utilizzo nell'UI

### 1. Creazione Form con Proof
```typescript
// Crea form con domanda che richiede proof Twitter
const questions = [
  {
    text: "Condividi il tweet che dimostra la tua partecipazione all'evento",
    required: true,
    requiresProof: true  // 🔥 Richiede verifica tweet via Flare
  },
  {
    text: "Come hai saputo dell'evento?",
    required: true,
    requiresProof: false
  }
];

await createForm("Form Evento", "Verifica partecipazione social", questions);
```

### 2. Verifica Proof Status
```typescript
// Controlla se tutte le proof sono verificate
const allVerified = await areAllProofsVerified(formId, userAddress);

// Controlla proof specifica
const isVerified = await isProofVerified(formId, userAddress, questionIndex);

// Ottieni requisiti proof per il form
const requirements = await getProofRequirements(formId);
```

### 3. Visualizzazione nell'UI
```jsx
// Mostra badge per domande con proof Twitter
{question.requiresProof && (
  <Badge className="bg-blue-50 text-blue-700">
    <Twitter className="w-3 h-3" />
    Twitter Proof Required
  </Badge>
)}

// Mostra stato verifica tweet
{isProofVerified ? (
  <Badge className="bg-green-50 text-green-700">
    ✅ Tweet Verified
  </Badge>
) : (
  <Badge className="bg-orange-50 text-orange-700">
    ⏳ Verifying Tweet...
  </Badge>
)}

// Componente guida per verifica Twitter
<TwitterProofGuide 
  isVerified={isProofVerified}
  onVerifyClick={() => startTwitterVerification()}
  tweetUrl={userTweetUrl}
/>
```

## 🔄 Flusso di Verifica Tweet

1. **Creazione Form**: Admin crea form con domande che richiedono proof Twitter
2. **User Input**: Utente inserisce URL del tweet da verificare
3. **Twitter API Call**: Sistema Flare FDC chiama API Twitter per verificare esistenza
4. **Proof Generation**: FDC genera proof crittografica della risposta Twitter
5. **Verifica**: Contratto Flare verifica il tweet e salva i dati
6. **Sincronizzazione**: Stato verifica viene comunicato al contratto World Chain
7. **UI Update**: Dashboard mostra tweet verificato con badge verde

## 📊 Funzionalità UI

### Dashboard Amministratore
- ✅ Visualizza forms con requisiti proof
- ✅ Monitora stato verifica submissions
- ✅ Statistiche proof verificate/pending

### Form Pubblico
- ✅ Mostra requisiti proof per ogni domanda
- ✅ Indica stato verifica in tempo reale
- ✅ Guida utente per completare verification

### Modalità Kiosk
- ✅ Display ottimizzato per stand eventi
- ✅ QR code per accesso rapido
- ✅ Istruzioni chiare per verifica

## 🛠️ Funzioni Principali

### SwagFormProofManager.sol
```solidity
// Verifica dati tweet tramite Web2Json
function verifyTweetData(IWeb2Json.Proof memory proof)

// Associa proof tweet verificata a domanda specifica
function linkProofToQuestion(uint256 formId, uint256 questionIndex, bytes32 proofHash)

// Controlla se utente ha tweet verificato
function hasVerifiedProof(address user, uint256 formId, uint256 questionIndex)

// Ottiene dati del tweet verificato
function getVerifiedTweet(bytes32 proofHash) returns (VerifiedTweet memory)
```

### SwagForm.sol (aggiornato)
```solidity
// Crea form con supporto proof
function createForm(string title, string description, string[] questions, bool[] required, bool[] requiresProof)

// Verifica se tutte le proof sono complete
function areAllProofsVerified(uint256 formId, address user)

// Ottieni requisiti proof per form
function getProofRequirements(uint256 formId)
```

## 🔐 Sicurezza

- **Proof Crittografiche**: Utilizzo di Merkle Tree per verificare integrità dati
- **Cross-Chain Verification**: Verifica indipendente su Flare Network
- **API Authentication**: Supporto per chiavi API e autenticazione OAuth
- **Rate Limiting**: Protezione contro abuse delle API calls

## 🌐 Reti Supportate

| Rete | Chain ID | Uso |
|------|----------|-----|
| World Chain | 480 | Produzione |
| World Chain Sepolia | 4801 | Testing |
| Flare Mainnet | 14 | Produzione |
| Flare Coston2 | 114 | Testing |

## 🎯 Casi d'Uso Specifici

### Eventi e Conference
- **Verifica partecipazione**: Richiedi tweet con hashtag evento
- **Giveaway e premi**: Verifica retweet o mention per qualificarsi
- **Networking**: Conferma condivisione contenuti evento

### Marketing e Brand
- **User Generated Content**: Verifica post che menzionano il brand
- **Influencer campaigns**: Conferma pubblicazione contenuti sponsorizzati
- **Contest participation**: Valida entry con tweet specifici

### Community Building
- **Proof of engagement**: Verifica interazione con contenuti
- **Social verification**: Conferma presenza social per vantaggi
- **Content creation**: Validazione di tweet promozionali

## 📚 Risorse

- [Documentazione Flare FDC](https://dev.flare.network/fdc/)
- [Web2Json Guide](https://dev.flare.network/fdc/guides/foundry/web-2-json-for-custom-api)
- [Twitter API Documentation](https://developer.twitter.com/en/docs/api-reference-index)
- [World Chain Documentation](https://docs.worldchain.org/)
- [SwagForm GitHub](https://github.com/your-repo/swagform)

## 🤝 Contribuire

1. Fork il repository
2. Crea un branch per la tua feature (`git checkout -b feature/nuova-feature`)
3. Commit le modifiche (`git commit -m 'Add nuova feature'`)
4. Push al branch (`git push origin feature/nuova-feature`)
5. Apri una Pull Request

## 📄 Licenza

MIT License - vedi il file `LICENSE` per dettagli.

---

**Powered by Flare Network & World Chain** 🌍⚡ 
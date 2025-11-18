import { GoogleGenAI, Type } from "@google/genai";
import type { BillData, OfferData } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const billSchema = {
  type: Type.OBJECT,
  properties: {
    nomeCliente: {
      type: Type.STRING,
      description: "Il nome e cognome completo dell'intestatario della bolletta.",
    },
    gestoreAttuale: {
        type: Type.STRING,
        description: "Il nome del fornitore di energia o gas. Ad esempio 'Enel Energia', 'Servizio Elettrico Nazionale', 'Eni Plenitude'. Cerca il logo o l'intestazione della bolletta.",
    },
    indirizzoFornitura: {
        type: Type.STRING,
        description: "L'indirizzo completo dove viene fornito il servizio (via, numero civico, CAP, città, provincia). Es: 'Via Lequile 21B 73100 LECCE LE'.",
    },
    podPdr: {
        type: Type.STRING,
        description: "Il codice alfanumerico POD (per la luce) o PDR (per il gas).",
    },
    periodoFatturazione: {
        type: Type.STRING,
        description: "Il periodo di riferimento della fattura, ad esempio '01/01/2024 - 29/02/2024' o 'Bimestre: Gen-Feb 2024'.",
    },
    consumoFatturato: {
        type: Type.STRING,
        description: "Il consumo totale fatturato nel periodo della bolletta, includendo l'unità di misura (es. '150 kWh' o '50 Smc').",
    },
    consumoAnnuo: {
        type: Type.STRING,
        description: "Il consumo annuo totale del cliente, includendo l'unità di misura (es. '1800 kWh' o '600 Smc').",
    },
    tipoFornitura: {
      type: Type.STRING,
      description: "Il tipo di servizio, deve essere 'Luce' o 'Gas'. Se non è chiaro, 'Sconosciuto'.",
      enum: ['Luce', 'Gas', 'Sconosciuto'],
    },
    prezzoUnitarioEnergia: {
      type: Type.STRING,
      description: "Il prezzo unitario (€/kWh) associato ESATTAMENTE alla riga di dettaglio 'di cui spesa per la vendita di energia elettrica'. Questa riga è una scomposizione della 'Quota consumi'. Non confonderlo con il prezzo medio generale. Dalla bolletta di esempio fornita, il valore corretto da estrarre è '0,153649 €/kWh'. Se non vedi questa riga esatta, ometti il campo.",
    },
    costoTotaleEnergia: {
        type: Type.STRING,
        description: "Il costo totale in Euro (€) associato ESATTAMENTE alla riga di dettaglio 'di cui spesa per la vendita di energia elettrica', nel riepilogo 'Quota consumi'. È l'importo totale per il periodo, non il prezzo unitario. Includere il simbolo dell'euro. Esempio: '23,05 €'. Se non vedi questa riga esatta, ometti il campo."
    },
    quotaFissaEnergia: {
      type: Type.STRING,
      description: "L'importo in euro TOTALE per il periodo di fatturazione relativo alla 'Quota fissa' della 'Spesa per la materia energia', spesso indicata come 'Corrispettivo di Commercializzazione e Vendita (CCV)' o 'Prezzo di Commercializzazione e Vendita (PCV)'. Se la bolletta mostra un valore mensile (es. 12 €/mese) e un totale per il periodo (es. 24 € per un bimestre), estrai il valore TOTALE (24 €). Includere il simbolo dell'euro. Esempio: '24,00 €'.",
    },
    prezzoUnitarioGas: {
        type: Type.STRING,
        description: "Il prezzo unitario (€/Smc) associato ESATTAMENTE alla riga di dettaglio 'di cui spesa per la vendita di gas naturale'. Questa riga è una scomposizione della 'Quota consumi'. Non confonderlo con il prezzo medio generale. Se non vedi questa riga esatta, ometti il campo.",
    },
    costoTotaleGas: {
        type: Type.STRING,
        description: "Il costo totale in Euro (€) associato ESATTAMENTE alla riga di dettaglio 'di cui spesa per la vendita di gas naturale', nel riepilogo 'Quota consumi'. È l'importo totale per il periodo, non il prezzo unitario. Includere il simbolo dell'euro. Se non vedi questa riga esatta, ometti il campo."
    },
    quotaFissaGas: {
        type: Type.STRING,
        description: "L'importo in euro TOTALE per il periodo di fatturazione relativo alla 'Quota fissa' della 'Spesa per la materia gas naturale', spesso indicata come 'Corrispettivo di Commercializzazione e Vendita (CCV)' o 'Prezzo di Commercializzazione e Vendita (PCV)'. Se la bolletta mostra un valore mensile (es. 6 €/mese) e un totale per il periodo (es. 12 € per un bimestre), estrai il valore TOTALE (12 €). Includere il simbolo dell'euro. Esempio: '12,00 €'.",
    },
    potenzaDisponibile: {
      type: Type.STRING,
      description: "La potenza disponibile in kW (es. '5,5 kW'). Questo campo è applicabile solo per le bollette della luce. Se la bolletta è del gas o il dato non è presente, omettere il campo.",
    },
    tensione: {
      type: Type.STRING,
      description: "La tensione di fornitura in Volt (V), spesso specificata anche con una dicitura come 'Bassa Tensione' (es. '220 V - Bassa Tensione'). Questo campo è applicabile solo per le bollette della luce. Se la bolletta è del gas o il dato non è presente, omettere il campo.",
    },
    tipologiaUso: {
      type: Type.STRING,
      description: "La tipologia di utilizzo del servizio. Può essere 'Domestico', 'Domestico residente', 'Domestico non residente', 'Uso diverso' o 'Altri usi'. Per il gas, può anche specificare l'uso come 'Cottura cibi', 'Produzione acqua calda sanitaria', 'Riscaldamento individuale'. Se non presente, omettere il campo.",
    },
  },
  required: [
    'nomeCliente', 'gestoreAttuale', 'indirizzoFornitura', 'podPdr', 'periodoFatturazione', 'consumoFatturato', 'consumoAnnuo', 'tipoFornitura',
  ],
};

const offerSchema = {
    type: Type.OBJECT,
    properties: {
        nomeOfferta: {
            type: Type.STRING,
            description: "Il nome commerciale dell'offerta. Es: 'Luce Facile' o 'Gas Prezzo Fisso 12 mesi'.",
        },
        prezzoUnitario: {
            type: Type.STRING,
            description: "Il costo totale per unità di consumo (€/kWh o €/Smc). **Se l'offerta è a prezzo FISSO**: è la SOMMA del prezzo della materia prima PIÙ eventuali costi aggiuntivi come 'corrispettivo di dispacciamento', 'costi di sbilanciamento', 'perdite di rete'. **Se l'offerta è a prezzo VARIABILE**: è la SOMMA del solo 'Contributo al consumo (spread)' PIÙ gli stessi eventuali costi aggiuntivi (dispacciamento, sbilanciamento, ecc.). Ignora il valore dell'indice (PUN/PSV) scritto nel documento. Restituisci un unico valore numerico con l'unità di misura. Esempio: se spread è 0.01 €/kWh e dispacciamento è 0.02 €/kWh, restituisci '0.03 €/kWh'.",
        },
        quotaFissa: {
            type: Type.STRING,
            description: "La quota fissa, tipicamente chiamata 'Corrispettivo di commercializzazione e vendita (CCV)' o 'PCV'. Fai attenzione se il valore è annuale o mensile. Se è annuale (es. '144 €/anno'), estrai l'intero valore. Se è mensile (es. '12 €/mese'), estrai quel valore. Includi sempre l'unità di misura temporale.",
        },
        tipoOfferta: {
            type: Type.STRING,
            description: "Identifica se il prezzo dell'offerta è 'Fisso' o 'Variabile'. Un'offerta è 'Fissa' se trovi parole chiave come 'prezzo fisso', 'prezzo bloccato', 'fisso per 12 mesi', o se si fa riferimento a un corrispettivo fisso e invariabile per la materia prima. È 'Variabile' se trovi espliciti riferimenti a indici di mercato come 'PUN' (per la luce) o 'PSV' (per il gas), o termini come 'indicizzato'. Usa 'Sconosciuto' solo se non trovi nessuna di queste indicazioni.",
            enum: ['Fisso', 'Variabile', 'Sconosciuto'],
        }
    },
    required: ['nomeOfferta', 'prezzoUnitario', 'quotaFissa', 'tipoOfferta'],
};


export const extractBillData = async (base64ImageData: string, mimeType: string): Promise<BillData> => {
  const imagePart = { inlineData: { data: base64ImageData, mimeType } };
  const textPart = { text: "Estrai i dati dalla bolletta seguendo lo schema. Presta particolare attenzione a questi campi: 1. **Gestore Attuale**: Identifica il nome del fornitore di energia (es. 'Enel Energia', 'Servizio Elettrico Nazionale'). 2. **Indirizzo di Fornitura**: Deve essere l'indirizzo esatto della fornitura, come 'Via Lequile 21B 73100 LECCE LE' dall'esempio. Non confonderlo con l'indirizzo di fatturazione. 3. **Prezzo Unitario e Costo Totale**: Nella sezione 'Quota Consumi', trova la riga esatta 'di cui spesa per la vendita di energia elettrica' (o gas naturale) e estrai SIA il suo valore unitario in €/kWh (o €/Smc) SIA il costo totale in Euro (€) per il periodo. Dalla bolletta di esempio, il prezzo unitario corretto è '0,153649 €/kWh'. 4. **Dati Tecnici Luce**: Se la bolletta è per l'energia elettrica, estrai anche 'Potenza Disponibile' e 'Tensione'. 5. **Tipologia d'Uso**: Identifica l'uso della fornitura (es. 'Domestico residente', 'Domestico non residente', 'Uso diverso', 'Altri usi' per la luce, o 'Cottura cibi e acqua calda' per il gas)." };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: { responseMimeType: "application/json", responseSchema: billSchema },
    });
    const parsedData = JSON.parse(response.text) as BillData;
    if (!parsedData.nomeCliente || !parsedData.podPdr || !parsedData.gestoreAttuale) {
        throw new Error("Il modello ha restituito un formato di dati inatteso.");
    }
    return parsedData;
  } catch (error) {
    console.error("Errore durante la chiamata all'API Gemini (Bolletta):", error);
    throw new Error("Non è stato possibile elaborare la richiesta con l'API Gemini.");
  }
};


export const extractOfferData = async (base64ImageData: string, mimeType: string): Promise<OfferData> => {
    const imagePart = { inlineData: { data: base64ImageData, mimeType } };
    const textPart = { text: "Dal documento di Condizioni Tecnico Economiche (CTE), estrai i dati seguendo lo schema. Presta la massima attenzione a: 1. **Tipo Offerta**: determina se è 'Fisso' o 'Variabile'. 2. **Prezzo Unitario**: Se è 'Fisso', somma tutte le componenti di costo unitario (€/kWh o €/Smc) come materia prima, dispacciamento, ecc. Se è 'Variabile', somma solo lo 'spread' e le altre componenti accessorie, escludendo il valore dell'indice (PUN/PSV) dal calcolo. 3. **Quota Fissa (CCV/PCV)**: Identifica il 'Corrispettivo di commercializzazione e vendita' e specifica se il valore riportato è mensile o annuale (es. '144 €/anno')." };
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: { responseMimeType: "application/json", responseSchema: offerSchema },
      });
      const parsedData = JSON.parse(response.text) as OfferData;
      if (!parsedData.nomeOfferta || !parsedData.prezzoUnitario || !parsedData.quotaFissa) {
          throw new Error("Il modello ha restituito un formato di dati inatteso per la CTE.");
      }
      return parsedData;
    } catch (error) {
      console.error("Errore durante la chiamata all'API Gemini (CTE):", error);
      throw new Error("Non è stato possibile elaborare la richiesta con l'API Gemini per la CTE.");
    }
};

export const getMarketIndexPrice = async (supplyType: 'Luce' | 'Gas'): Promise<number> => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = yesterday.getMonth();
    const day = yesterday.getDate();

    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const yesterdayDateString = `${day} ${monthNames[month]} ${year}`;

    const indexName = supplyType === 'Luce' ? 'PUN (Prezzo Unico Nazionale)' : 'PSV (Punto di Scambio Virtuale)';
    const unit = supplyType === 'Luce' ? '€/kWh' : '€/Smc';
    
    // Prompt aggiornato per richiedere il valore giornaliero consolidato del giorno precedente.
    const prompt = `Qual è stato il valore giornaliero del ${indexName} per la giornata di ieri, ${yesterdayDateString}? Basati sui dati ufficiali e consolidati del GME (Gestore dei Mercati Energetici). Fornisci esclusivamente il valore numerico in ${unit}, usando il punto come separatore decimale. Se il dato di ieri non è ancora consolidato, fornisci l'ultimo valore giornaliero consolidato disponibile. Esempio: 0.115`;
    
    try {
        const response = await ai.models.generateContent({
           model: "gemini-2.5-flash",
           contents: prompt,
           config: {
             tools: [{googleSearch: {}}],
           },
        });

        const textResponse = response.text.trim();
        const match = textResponse.match(/\d+([,.]\d+)?/);
        
        if (match && match[0]) {
            const priceString = match[0].replace(',', '.');
            const price = parseFloat(priceString);
            
            if (!isNaN(price)) {
                return price;
            }
        }

        console.error(`Google Search ha restituito un valore non numerico:\n${response.text}`);
        throw new Error(`Errore durante il recupero del valore di mercato per ${indexName}:\n${response.text}`);

    } catch (error) {
        console.error(`Errore durante il recupero del valore di mercato per ${indexName}:`, error);
        throw new Error(`Impossibile recuperare il valore di mercato per ${indexName}.`);
    }
}
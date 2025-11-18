export interface BillData {
  nomeCliente: string;
  gestoreAttuale: string;
  indirizzoFornitura: string;
  podPdr: string;
  periodoFatturazione: string;
  consumoFatturato: string;
  consumoAnnuo: string;
  tipoFornitura: 'Luce' | 'Gas' | 'Sconosciuto';
  tipologiaUso?: string;
  prezzoUnitarioEnergia?: string;
  costoTotaleEnergia?: string;
  quotaFissaEnergia?: string;
  prezzoUnitarioGas?: string;
  costoTotaleGas?: string;
  quotaFissaGas?: string;
  potenzaDisponibile?: string;
  tensione?: string;
}

export interface OfferData {
    nomeOfferta: string;
    prezzoUnitario: string; // Per le offerte variabili, questo è il CONTRIBUTO AL CONSUMO (spread).
    quotaFissa: string;
    tipoOfferta: 'Fisso' | 'Variabile' | 'Sconosciuto';
}
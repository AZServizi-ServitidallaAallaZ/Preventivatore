import React from 'react';
import type { BillData } from '../types';

interface ExtractedDataProps {
  data: BillData | null;
  isEditing: boolean;
  editedData: BillData | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDataChange: (field: keyof BillData, value: string) => void;
  editError: string | null;
}

const DataRow: React.FC<{ icon: string; label: string; value?: string | number; children?: React.ReactNode; tooltip?: string; className?: string }> = ({ icon, label, value, children, tooltip, className = '' }) => {
  const content = children ?? value;
  if (!content && content !== 0) {
    return null;
  }

  return (
    <div className={`flex items-start gap-4 p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 ${className}`}>
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-cyan-800 bg-cyan-100">
        <i className={`${icon} text-lg`}></i>
      </div>
      <div className="flex-grow">
         <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            {tooltip && (
                <div className="relative tooltip-container">
                    <i className="fas fa-info-circle text-slate-400 cursor-help"></i>
                    <div className="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-slate-700 rounded-lg shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none z-10 transform -translate-y-2">
                        {tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700"></div>
                    </div>
                </div>
            )}
        </div>
        <p className="text-base font-semibold text-slate-800 break-words mt-1">{content}</p>
      </div>
    </div>
  );
};

const EditableRow: React.FC<{ icon: string; label: string; name: keyof BillData; value: string; onChange: (name: keyof BillData, value: string) => void; required?: boolean; tooltip?: string; }> = ({ icon, label, name, value, onChange, required=false, tooltip }) => (
    <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-300">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-cyan-800 bg-cyan-100">
            <i className={`${icon} text-lg`}></i>
        </div>
        <div className="flex-grow">
            <div className="flex items-center gap-2">
                 <label htmlFor={name} className="text-sm font-medium text-slate-500">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {tooltip && (
                    <div className="relative tooltip-container">
                        <i className="fas fa-info-circle text-slate-400 cursor-help"></i>
                        <div className="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-slate-700 rounded-lg shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none z-10 transform -translate-y-2">
                            {tooltip}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700"></div>
                        </div>
                    </div>
                )}
            </div>
            <input
                id={name}
                type="text"
                value={value || ''}
                onChange={(e) => onChange(name, e.target.value)}
                className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 bg-slate-50"
                required={required}
            />
        </div>
    </div>
);


export const ExtractedData: React.FC<ExtractedDataProps> = ({ data, isEditing, editedData, onEdit, onCancel, onSave, onDataChange, editError }) => {

  const currentData = isEditing ? editedData : data;
  if (!currentData) return null;
  
  const supplyTypeIcon = currentData.tipoFornitura === 'Luce' ? 'fa-solid fa-lightbulb' : currentData.tipoFornitura === 'Gas' ? 'fa-solid fa-fire-flame-simple' : 'fa-solid fa-question-circle';
  const supplyTypeColor = currentData.tipoFornitura === 'Luce' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : currentData.tipoFornitura === 'Gas' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-slate-100 text-slate-800 border-slate-200';

  const tooltips = {
    gestoreAttuale: "Significato: Il nome del fornitore che ha emesso la bolletta (es. 'Enel Energia').\nCome viene estratto: L'IA identifica questo dato cercando il logo o l'intestazione principale del documento.",
    nomeCliente: "Significato: Il nome e cognome completo dell'intestatario del contratto.\nCome viene estratto: L'IA lo cerca nella sezione dei dati anagrafici o dell'intestatario della fattura.",
    indirizzoFornitura: "Significato: L'indirizzo esatto (via, numero, CAP, città) dove viene erogato il servizio.\nCome viene estratto: L'IA lo cerca nella sezione 'Dati Fornitura', distinguendolo dall'indirizzo di spedizione.",
    podPdr: "Significato: Il codice univoco che identifica il punto di fornitura. POD per l'energia elettrica, PDR per il gas.\nCome viene estratto: L'IA ricerca nel documento un codice alfanumerico con il formato tipico di un POD (es. IT001...) o PDR (numerico).",
    periodoFatturazione: "Significato: L'intervallo di tempo (es. bimestre, trimestre) a cui si riferiscono i consumi della bolletta.\nCome viene estratto: L'IA lo cerca nelle sezioni di riepilogo o totali, identificando le date di inizio e fine.",
    consumoFatturato: "Significato: La quantità totale di energia (in kWh) o gas (in Smc) consumata e addebitata nel periodo di fatturazione.\nCome viene estratto: L'IA lo individua nelle sezioni di dettaglio dei consumi o nel riepilogo dei costi.",
    consumoAnnuo: "Significato: Il consumo totale stimato o storico su un periodo di 12 mesi, utile per confronti a lungo termine.\nCome viene estratto: L'IA lo cerca nei riepiloghi dei dati tecnici o di consumo, spesso indicato esplicitamente come 'Consumo Annuo'.",
    tipologiaUso: "Significato: Specifica la natura dell'utilizzo (es. 'Domestico residente', 'Uso diverso').\nCome viene estratto: L'IA lo cerca nei dati contrattuali o tecnici della fornitura.",
    tipoFornitura: "Significato: Indica se la bolletta è per 'Luce' (energia elettrica) o 'Gas'.\nCome viene estratto: L'IA lo deduce dai termini usati (es. kWh, kW, POD vs Smc, PDR) o da indicazioni esplicite nel documento.",
    prezzoUnitarioEnergia: "Significato: Il prezzo pagato per ogni singolo kWh consumato, relativo alla sola 'materia energia'.\nCome viene estratto: L'IA cerca la riga di dettaglio specifica 'spesa per la vendita di energia elettrica' (o simile) e ne estrae il costo unitario.",
    costoTotaleEnergia: "Significato: Il costo totale in Euro (€) della materia prima per il periodo, utile per una verifica.\nCome viene estratto: L'IA estrae l'importo totale dalla stessa riga 'spesa per la vendita di energia elettrica', che corrisponde a (consumo * prezzo unitario).",
    quotaFissaEnergia: "Significato: Il costo fisso mensile per la commercializzazione (noto come CCV/PCV), indipendente dai consumi.\nCome viene estratto: L'IA lo cerca nella sezione 'Spesa per la materia energia', isolando i costi fissi.",
    potenzaDisponibile: "Significato: La potenza massima che il contatore della luce può erogare, espressa in kW.\nCome viene estratto: L'IA lo cerca nei 'Dati Tecnici' della fornitura luce.",
    tensione: "Significato: La tensione di fornitura dell'energia elettrica (es. '220 V' o 'Bassa Tensione').\nCome viene estratto: L'IA lo cerca nei 'Dati Tecnici' della fornitura luce.",
    prezzoUnitarioGas: "Significato: Il prezzo pagato per ogni singolo Smc di gas consumato, relativo alla sola 'materia gas'.\nCome viene estratto: L'IA cerca la riga di dettaglio specifica 'spesa per la vendita di gas naturale' (o simile) e ne estrae il costo unitario.",
    costoTotaleGas: "Significato: Il costo totale in Euro (€) della materia prima gas per il periodo, utile per una verifica.\nCome viene estratto: L'IA estrae l'importo totale dalla stessa riga 'spesa per la vendita di gas naturale'.",
    quotaFissaGas: "Significato: Il costo fisso mensile per la commercializzazione del gas (noto come CCV/PCV), indipendente dai consumi.\nCome viene estratto: L'IA lo cerca nella sezione 'Spesa per la materia gas naturale', isolando i costi fissi.",
  };


  return (
    <div className="animate-fade-in space-y-4 w-full">
      <div className="flex justify-end items-center gap-3 border-b pb-4 mb-4 border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800 mr-auto">{isEditing ? (data ? 'Modifica Dati' : 'Inserisci Dati Manualmente') : 'Dati Bolletta Attuale'}</h2>
        {isEditing ? (
          <>
            <button onClick={onCancel} className="px-4 py-2 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-300">
              Annulla
            </button>
            <button onClick={onSave} className="px-4 py-2 gradient-bg text-white font-semibold rounded-lg shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300">
              Salva Modifiche
            </button>
          </>
        ) : (
          data && <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-300">
            <i className="fas fa-pencil-alt text-sm"></i>
            Modifica
          </button>
        )}
      </div>

      {isEditing && editError && <div className="p-3 mb-3 text-center text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg animate-fade-in">{editError}</div>}

      {isEditing && editedData ? (
        // EDIT MODE
        <div className="space-y-3">
          <EditableRow icon="fa-solid fa-building" label="Gestore Attuale" name="gestoreAttuale" value={editedData.gestoreAttuale} onChange={onDataChange} tooltip={tooltips.gestoreAttuale} />
          <EditableRow icon="fa-solid fa-user" label="Cliente" name="nomeCliente" value={editedData.nomeCliente} onChange={onDataChange} tooltip={tooltips.nomeCliente} />
          <EditableRow icon="fa-solid fa-location-dot" label="Indirizzo Fornitura" name="indirizzoFornitura" value={editedData.indirizzoFornitura} onChange={onDataChange} tooltip={tooltips.indirizzoFornitura} />
          <EditableRow icon="fa-solid fa-barcode" label="POD / PDR" name="podPdr" value={editedData.podPdr} onChange={onDataChange} tooltip={tooltips.podPdr} />
          <EditableRow icon="fa-solid fa-calendar-range" label="Periodo Fatturazione" name="periodoFatturazione" value={editedData.periodoFatturazione} onChange={onDataChange} tooltip={tooltips.periodoFatturazione} />
          <EditableRow icon="fa-solid fa-chart-line" label="Consumo Fatturato" name="consumoFatturato" value={editedData.consumoFatturato} onChange={onDataChange} required tooltip={tooltips.consumoFatturato} />
          <EditableRow icon="fa-solid fa-calendar-days" label="Consumo Annuo" name="consumoAnnuo" value={editedData.consumoAnnuo} onChange={onDataChange} required tooltip={tooltips.consumoAnnuo} />
          <EditableRow icon="fa-solid fa-house-user" label="Tipologia d'Uso" name="tipologiaUso" value={editedData.tipologiaUso || ''} onChange={onDataChange} tooltip={tooltips.tipologiaUso} />
          
          <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-300">
             <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-cyan-800 bg-cyan-100">
                <i className={`${supplyTypeIcon} text-lg`}></i>
            </div>
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <label htmlFor="tipoFornitura" className="text-sm font-medium text-slate-500">Tipo Fornitura</label>
                     <div className="relative tooltip-container">
                        <i className="fas fa-info-circle text-slate-400 cursor-help"></i>
                        <div className="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-slate-700 rounded-lg shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none z-10 transform -translate-y-2">
                            {tooltips.tipoFornitura}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700"></div>
                        </div>
                    </div>
                </div>
                <select
                    id="tipoFornitura"
                    value={editedData.tipoFornitura}
                    onChange={(e) => onDataChange('tipoFornitura', e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 bg-slate-50"
                >
                    <option value="Luce">Luce</option>
                    <option value="Gas">Gas</option>
                    <option value="Sconosciuto">Sconosciuto</option>
                </select>
            </div>
          </div>
          
          {editedData.tipoFornitura === 'Luce' && (
            <>
              <EditableRow icon="fa-solid fa-bolt" label="Costo Energia (prezzo unitario)" name="prezzoUnitarioEnergia" value={editedData.prezzoUnitarioEnergia || ''} onChange={onDataChange} required tooltip={tooltips.prezzoUnitarioEnergia} />
              <EditableRow icon="fa-solid fa-euro-sign" label="Costo Totale Materia Energia (€)" name="costoTotaleEnergia" value={editedData.costoTotaleEnergia || ''} onChange={onDataChange} tooltip={tooltips.costoTotaleEnergia} />
              <EditableRow icon="fa-solid fa-plug-circle-check" label="Quota Fissa Energia (CCV/PCV)" name="quotaFissaEnergia" value={editedData.quotaFissaEnergia || ''} onChange={onDataChange} required tooltip={tooltips.quotaFissaEnergia} />
              <EditableRow icon="fa-solid fa-gauge-high" label="Potenza Disponibile" name="potenzaDisponibile" value={editedData.potenzaDisponibile || ''} onChange={onDataChange} tooltip={tooltips.potenzaDisponibile} />
              <EditableRow icon="fa-solid fa-wave-square" label="Tensione" name="tensione" value={editedData.tensione || ''} onChange={onDataChange} tooltip={tooltips.tensione} />
            </>
          )}
          {editedData.tipoFornitura === 'Gas' && (
            <>
              <EditableRow icon="fa-solid fa-fire" label="Costo Gas (prezzo unitario)" name="prezzoUnitarioGas" value={editedData.prezzoUnitarioGas || ''} onChange={onDataChange} required tooltip={tooltips.prezzoUnitarioGas} />
              <EditableRow icon="fa-solid fa-coins" label="Costo Totale Materia Gas (€)" name="costoTotaleGas" value={editedData.costoTotaleGas || ''} onChange={onDataChange} tooltip={tooltips.costoTotaleGas} />
              <EditableRow icon="fa-solid fa-fire-burner" label="Quota Fissa Gas (CCV/PCV)" name="quotaFissaGas" value={editedData.quotaFissaGas || ''} onChange={onDataChange} required tooltip={tooltips.quotaFissaGas} />
            </>
          )}
        </div>
      ) : (
        // VIEW MODE
        data && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DataRow icon="fa-solid fa-building" label="Gestore Attuale" value={data.gestoreAttuale} tooltip={tooltips.gestoreAttuale} className="sm:col-span-2" />
          <DataRow icon="fa-solid fa-user" label="Cliente" value={data.nomeCliente} tooltip={tooltips.nomeCliente} className="sm:col-span-2" />
          <DataRow icon="fa-solid fa-location-dot" label="Indirizzo Fornitura" value={data.indirizzoFornitura} tooltip={tooltips.indirizzoFornitura} className="sm:col-span-2" />
          <DataRow icon="fa-solid fa-barcode" label="POD / PDR" value={data.podPdr} tooltip={tooltips.podPdr} />
          <DataRow icon="fa-solid fa-calendar-range" label="Periodo Fatturazione" value={data.periodoFatturazione} tooltip={tooltips.periodoFatturazione} />
          <DataRow icon="fa-solid fa-chart-line" label="Consumo Fatturato" value={data.consumoFatturato} tooltip={tooltips.consumoFatturato} />
          <DataRow icon="fa-solid fa-calendar-days" label="Consumo Annuo" value={data.consumoAnnuo} tooltip={tooltips.consumoAnnuo} />
          <DataRow icon="fa-solid fa-house-user" label="Tipologia d'Uso" value={data.tipologiaUso} tooltip={tooltips.tipologiaUso} />
          <DataRow icon={supplyTypeIcon} label="Tipo Fornitura" tooltip={tooltips.tipoFornitura}>
              <span className={`px-3 py-1 text-sm font-bold rounded-full ${supplyTypeColor} border`}>
                  {data.tipoFornitura}
              </span>
          </DataRow>
           {data.tipoFornitura === 'Luce' && (
            <>
              <DataRow icon="fa-solid fa-bolt" label="Costo Energia (prezzo unitario)" value={data.prezzoUnitarioEnergia} tooltip={tooltips.prezzoUnitarioEnergia} />
              <DataRow icon="fa-solid fa-euro-sign" label="Costo Totale Materia Energia (€)" value={data.costoTotaleEnergia} tooltip={tooltips.costoTotaleEnergia} />
              <DataRow icon="fa-solid fa-plug-circle-check" label="Quota Fissa Energia (CCV/PCV)" value={data.quotaFissaEnergia} tooltip={tooltips.quotaFissaEnergia} />
              <DataRow icon="fa-solid fa-gauge-high" label="Potenza Disponibile" value={data.potenzaDisponibile} tooltip={tooltips.potenzaDisponibile} />
              <DataRow icon="fa-solid fa-wave-square" label="Tensione" value={data.tensione} tooltip={tooltips.tensione} />
            </>
          )}
          {data.tipoFornitura === 'Gas' && (
            <>
              <DataRow icon="fa-solid fa-fire" label="Costo Gas (prezzo unitario)" value={data.prezzoUnitarioGas} tooltip={tooltips.prezzoUnitarioGas} />
              <DataRow icon="fa-solid fa-coins" label="Costo Totale Materia Gas (€)" value={data.costoTotaleGas} tooltip={tooltips.costoTotaleGas} />
              <DataRow icon="fa-solid fa-fire-burner" label="Quota Fissa Gas (CCV/PCV)" value={data.quotaFissaGas} tooltip={tooltips.quotaFissaGas} />
            </>
          )}
        </div>
      )}
    </div>
  );
};
import React from 'react';
import type { OfferData, BillData } from '../types';

interface OfferDataDisplayProps {
  data: OfferData | null;
  isEditing: boolean;
  editedData: OfferData | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDataChange: (field: keyof OfferData, value: string) => void;
  editError: string | null;
  isManualEntry: boolean;
  billData: BillData | null;
}

const DataRow: React.FC<{ icon: string; label: string; value?: string; children?: React.ReactNode; tooltip?: string; className?: string }> = ({ icon, label, value, children, tooltip, className = '' }) => {
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

const EditableRow: React.FC<{ icon: string; label: string; name: keyof OfferData; value: string; onChange: (name: keyof OfferData, value: string) => void; required?: boolean; tooltip?: string; }> = ({ icon, label, name, value, onChange, required=false, tooltip }) => (
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

// Funzioni helper per i calcoli
const getBillingPeriodMonths = (periodoFatturazione?: string): number => {
    if (!periodoFatturazione) return 2;
    const lowerPeriod = periodoFatturazione.toLowerCase();
    if (lowerPeriod.includes('bimestr')) return 2;
    if (lowerPeriod.includes('trimestr')) return 3;
    if (lowerPeriod.includes('mensil')) return 1;
    if (lowerPeriod.includes('annuale')) return 12;

    const dateMatches = periodoFatturazione.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g);
    if (dateMatches && dateMatches.length === 2) {
        try {
            const [_startDay, startMonth, startYear] = dateMatches[0].split('/').map(Number);
            const [_endDay, endMonth, endYear] = dateMatches[1].split('/').map(Number);
            const monthDiff = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
            if (monthDiff > 0 && monthDiff <= 12) return monthDiff;
        } catch (e) { /* Ignora errori */ }
    }
    return 2;
};

const getOfferMonthlyFixedFee = (feeString?: string): number => {
    if (!feeString) return 0;
    const value = parseFloat(feeString.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    const lowerFeeString = feeString.toLowerCase();
    if (lowerFeeString.includes('mese') || lowerFeeString.includes('mensil')) return value;
    if (lowerFeeString.includes('trimestr')) return value / 3;
    if (lowerFeeString.includes('bimestr')) return value / 2;
    return value / 12; // Default: annuale
};

export const OfferDataDisplay: React.FC<OfferDataDisplayProps> = ({ data, isEditing, editedData, onEdit, onCancel, onSave, onDataChange, editError, isManualEntry, billData }) => {

  const currentData = isEditing ? editedData : data;
  if (!currentData) return null;
  
  const offerTypeIcon = currentData.tipoOfferta === 'Fisso' ? 'fa-solid fa-lock' : currentData.tipoOfferta === 'Variabile' ? 'fa-solid fa-chart-line' : 'fa-solid fa-question-circle';
  const offerTypeColor = currentData.tipoOfferta === 'Fisso' ? 'bg-blue-100 text-blue-800 border-blue-200' : currentData.tipoOfferta === 'Variabile' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-slate-100 text-slate-800 border-slate-200';

  const tooltips = {
    nomeOfferta: "Il nome commerciale dell'offerta, es. 'Luce Facile 12'.",
    prezzoUnitario: "Il costo per unità di consumo (€/kWh o €/Smc). Se l'offerta è a prezzo fisso, è il costo finale. Se è variabile, rappresenta il solo 'contributo al consumo' (spread) da sommare all'indice di mercato (PUN o PSV).",
    quotaFissa: "La quota fissa per i servizi di commercializzazione e vendita (CCV/PCV), solitamente espressa in €/mese o €/anno. Il valore visualizzato viene calcolato per il periodo di fatturazione della bolletta.",
    tipoOfferta: "Indica se il prezzo è fisso per un determinato periodo di tempo o se è variabile (indicizzato) in base agli indici di mercato come PUN per la luce e PSV per il gas."
  };

  // Calcola la quota fissa da visualizzare (solo in modalità di visualizzazione)
  let displayedFixedFee = currentData.quotaFissa;
  let fixedFeeLabel = "Quota Fissa (CCV/PCV)";

  if (!isEditing && billData && data) {
    const billingPeriodInMonths = getBillingPeriodMonths(billData.periodoFatturazione);
    const monthlyFee = getOfferMonthlyFixedFee(data.quotaFissa);
    const feeForPeriod = monthlyFee * billingPeriodInMonths;

    if (feeForPeriod > 0) {
      displayedFixedFee = `${feeForPeriod.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
      fixedFeeLabel = `Quota Fissa (per ${billingPeriodInMonths} ${billingPeriodInMonths > 1 ? 'mesi' : 'mese'})`;
    }
  }


  return (
    <div className="animate-fade-in space-y-4 w-full">
      <div className="flex justify-end items-center gap-3 border-b pb-4 mb-4 border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800 mr-auto">{isEditing ? (isManualEntry ? 'Inserisci Offerta' : 'Modifica Offerta') : 'Dati Nuova Offerta'}</h2>
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
          <EditableRow icon="fa-solid fa-file-signature" label="Nome Offerta" name="nomeOfferta" value={editedData.nomeOfferta} onChange={onDataChange} required tooltip={tooltips.nomeOfferta} />
          <EditableRow icon="fa-solid fa-tag" label="Prezzo Unitario" name="prezzoUnitario" value={editedData.prezzoUnitario} onChange={onDataChange} required tooltip={tooltips.prezzoUnitario} />
          <EditableRow icon="fa-solid fa-hand-holding-dollar" label="Quota Fissa (CCV/PCV)" name="quotaFissa" value={editedData.quotaFissa} onChange={onDataChange} required tooltip={tooltips.quotaFissa} />
          
          <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-300">
             <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-cyan-800 bg-cyan-100">
                <i className={`${offerTypeIcon} text-lg`}></i>
            </div>
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <label htmlFor="tipoOfferta" className="text-sm font-medium text-slate-500">Tipo Offerta</label>
                     <div className="relative tooltip-container">
                        <i className="fas fa-info-circle text-slate-400 cursor-help"></i>
                        <div className="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-slate-700 rounded-lg shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none z-10 transform -translate-y-2">
                            {tooltips.tipoOfferta}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700"></div>
                        </div>
                    </div>
                </div>
                <select
                    id="tipoOfferta"
                    value={editedData.tipoOfferta}
                    onChange={(e) => onDataChange('tipoOfferta', e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 bg-slate-50"
                >
                    <option value="Fisso">Fisso</option>
                    <option value="Variabile">Variabile</option>
                    <option value="Sconosciuto">Sconosciuto</option>
                </select>
            </div>
          </div>
        </div>
      ) : (
        // VIEW MODE
        data && <div className="space-y-4">
          <DataRow icon="fa-solid fa-file-signature" label="Nome Offerta" value={data.nomeOfferta} tooltip={tooltips.nomeOfferta} />
          <DataRow icon="fa-solid fa-tag" label="Prezzo Unitario" value={data.prezzoUnitario} tooltip={tooltips.prezzoUnitario} />
          <DataRow icon="fa-solid fa-hand-holding-dollar" label={fixedFeeLabel} value={displayedFixedFee} tooltip={tooltips.quotaFissa} />
          <DataRow icon={offerTypeIcon} label="Tipo Offerta" tooltip={tooltips.tipoOfferta}>
              <span className={`px-3 py-1 text-sm font-bold rounded-full ${offerTypeColor} border`}>
                  {data.tipoOfferta}
              </span>
          </DataRow>
        </div>
      )}
    </div>
  );
};
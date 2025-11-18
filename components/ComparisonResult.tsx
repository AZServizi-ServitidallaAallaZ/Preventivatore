import React, { useState, useEffect } from 'react';
import type { BillData, OfferData } from '../types';
import { getMarketIndexPrice } from '../services/geminiService';
import { Loader } from './Loader';

interface ComparisonResultProps {
  currentBill: BillData;
  newOffer: OfferData;
  onReset: () => void;
}

// Funzione helper per estrarre valori numerici da stringhe come "12,50 €/mese" o "0.15 kWh"
const parseNumericValue = (value?: string): number => {
    if (!value) return 0;
    // Gestisce sia la virgola che il punto come separatore decimale
    return parseFloat(value.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
};

// Funzione per determinare la durata in mesi del periodo di fatturazione
const getBillingPeriodMonths = (periodoFatturazione?: string): number => {
    if (!periodoFatturazione) return 2; // Default comune in Italia: bimestrale
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
        } catch (e) { /* Ignora errori e procede al default */ }
    }
    
    return 2; // Fallback di sicurezza a bimestrale
};

// Normalizza la quota fissa di una NUOVA OFFERTA (CCV/PCV) a un valore mensile.
// È potenziata per riconoscere diversi periodi (mensile, bimestrale, trimestrale)
// e assume di default che il valore sia annuale, come prassi comune nelle CTE.
const getOfferMonthlyFixedFee = (feeString?: string): number => {
    if (!feeString) return 0;
    const value = parseNumericValue(feeString);
    const lowerFeeString = feeString.toLowerCase();

    if (lowerFeeString.includes('mese') || lowerFeeString.includes('mensil')) {
        return value;
    }
    if (lowerFeeString.includes('trimestr')) {
        return value / 3;
    }
    if (lowerFeeString.includes('bimestr')) {
        return value / 2;
    }
    
    // Assunzione di default: il valore è annuale (es. "144 €/anno" o solo "144 €").
    // Questo è il caso più comune per le CTE in Italia.
    return value / 12;
};


export const ComparisonResult: React.FC<ComparisonResultProps> = ({ currentBill, newOffer, onReset }) => {
    const [marketIndexPrice, setMarketIndexPrice] = useState<number | null>(null);
    const [isFetchingIndex, setIsFetchingIndex] = useState<boolean>(false);
    const [fetchIndexError, setFetchIndexError] = useState<string | null>(null);
    
    const { tipoFornitura, consumoFatturato, periodoFatturazione } = currentBill;
    const isLuce = tipoFornitura === 'Luce';
    const isVariabile = newOffer.tipoOfferta === 'Variabile';
    
    useEffect(() => {
        if (isVariabile) {
            const fetchPrice = async () => {
                setIsFetchingIndex(true);
                setFetchIndexError(null);
                setMarketIndexPrice(null);
                try {
                    if (tipoFornitura === 'Sconosciuto') throw new Error("Tipo fornitura non specificato nella bolletta.");
                    const price = await getMarketIndexPrice(tipoFornitura);
                    setMarketIndexPrice(price);
                } catch (e: any) {
                    setFetchIndexError(e.message || 'Errore nel recupero del dato di mercato.');
                } finally {
                    setIsFetchingIndex(false);
                }
            };
            fetchPrice();
        }
    }, [isVariabile, tipoFornitura]);

    // --- LOGICA DI CALCOLO SUL PERIODO FATTURATO ---
    const billedConsumption = parseNumericValue(consumoFatturato);
    const billingPeriodInMonths = getBillingPeriodMonths(periodoFatturazione);

    // Costo attuale per il periodo
    const currentPriceUnit = parseNumericValue(isLuce ? currentBill.prezzoUnitarioEnergia : currentBill.prezzoUnitarioGas);
    const currentFixedFeeForPeriod = parseNumericValue(isLuce ? currentBill.quotaFissaEnergia : currentBill.quotaFissaGas);
    const currentCostForPeriod = (currentPriceUnit * billedConsumption) + currentFixedFeeForPeriod;

    // Costo nuova offerta per il periodo
    const offerSpread = parseNumericValue(newOffer.prezzoUnitario);
    const newMonthlyFixedFee = getOfferMonthlyFixedFee(newOffer.quotaFissa);
    const newFixedFeeForPeriod = newMonthlyFixedFee * billingPeriodInMonths;
    
    const newPriceUnit = isVariabile ? (marketIndexPrice !== null ? marketIndexPrice + offerSpread : null) : offerSpread;
    const newCostForPeriod = newPriceUnit !== null ? (newPriceUnit * billedConsumption) + newFixedFeeForPeriod : null;
    
    // Risparmio calcolato sul periodo
    const savings = newCostForPeriod !== null ? currentCostForPeriod - newCostForPeriod : null;
    const savingsPercentage = savings !== null && currentCostForPeriod > 0 ? (savings / currentCostForPeriod) * 100 : null;
    
    const isSavings = savings !== null && savings > 0;
    const isLoss = savings !== null && savings < 0;

    const indexName = isLuce ? "PUN" : "PSV";
    const unitMeasure = isLuce ? "€/kWh" : "€/Smc";

    if (isFetchingIndex) {
        return <Loader message={`Recupero il valore di mercato ${indexName}...`} />;
    }
    if (fetchIndexError) {
        return <div className="p-4 text-center text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-xl">{fetchIndexError}</div>;
    }

    return (
        <div className="animate-fade-in space-y-6 w-full">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">3. Risultato del Confronto</h2>
            <div className={`p-8 rounded-xl text-center ${isSavings ? 'bg-green-100 border-green-300' : isLoss ? 'bg-red-100 border-red-300' : 'bg-slate-100 border-slate-300'} border`}>
                <div className={`text-4xl mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center ${isSavings ? 'bg-green-200 text-green-600' : isLoss ? 'bg-red-200 text-red-600' : 'bg-slate-200 text-slate-600'}`}>
                    {isSavings ? <i className="fas fa-piggy-bank"></i> : isLoss ? <i className="fas fa-sad-tear"></i> : <i className="fas fa-calculator"></i>}
                </div>
                <p className="text-lg font-semibold text-slate-600">Basato sul consumo di <span className="font-bold">{consumoFatturato}</span>:</p>
                {currentCostForPeriod > 0 && newCostForPeriod !== null && savings !== null ? (
                    <>
                    <p className={`text-5xl font-bold my-2 ${isSavings ? 'text-green-600' : 'text-red-600'}`}>
                        {isSavings ? `Risparmio di ${savings.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : `Costo extra di ${Math.abs(savings).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                    </p>
                     {savingsPercentage !== null && (
                        <p className={`text-2xl font-semibold mb-2 ${isSavings ? 'text-green-600' : 'text-red-600'}`}>
                            ({isSavings ? '-' : '+'}{Math.abs(savingsPercentage).toFixed(1).replace('.',',')}%)
                        </p>
                    )}
                    <p className="font-semibold text-slate-700">nel periodo di fatturazione!</p>
                    </>
                ) : (
                    <p className="text-2xl font-bold my-2 text-slate-800">
                        Dati insufficienti per un calcolo preciso.
                    </p>
                )}
            </div>

            {/* Riepilogo Dati */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-5 border rounded-xl bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-600 mb-3 text-center">Riepilogo Offerta Attuale</h3>
                    <div className="space-y-3">
                         <DataItem label="Costo Materia Prima" value={`${isLuce ? currentBill.prezzoUnitarioEnergia : currentBill.prezzoUnitarioGas}`} />
                         <DataItem label="Quota Fissa (periodo)" value={`${isLuce ? currentBill.quotaFissaEnergia : currentBill.quotaFissaGas}`} />
                         <DataItem label="Costo Totale Stimato" value={`${currentCostForPeriod.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`} isTotal={true}/>
                    </div>
                </div>

                <div className="p-5 border-2 border-cyan-500 rounded-xl bg-cyan-50/40">
                    <h3 className="text-lg font-bold text-cyan-700 mb-3 text-center">Riepilogo Nuova Offerta</h3>
                    <div className="space-y-3">
                        {isVariabile && marketIndexPrice && <DataItem label={`Valore ${indexName} aggiornato`} value={`${marketIndexPrice.toFixed(5)} ${unitMeasure}`} />}
                        <DataItem label={isVariabile ? 'Contributo al consumo (Spread)' : 'Costo Materia Prima'} value={newOffer.prezzoUnitario} />
                        <DataItem label="Quota Fissa (periodo)" value={`${newFixedFeeForPeriod.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`} />
                        <DataItem label="Costo Totale Stimato" value={newCostForPeriod !== null ? `${newCostForPeriod.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : 'N/D'} isTotal={true}/>
                    </div>
                </div>
            </div>

            <div className="text-center pt-6">
                <button onClick={onReset} className="flex items-center gap-2 mx-auto px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-300">
                   <i className="fas fa-redo-alt text-sm"></i> Esegui una Nuova Analisi
                </button>
            </div>
            <p className="text-xs text-center text-slate-400 mt-2">* Il calcolo è una stima basata sui costi della materia prima e le quote fisse. Non include tasse, imposte e altri oneri.</p>
        </div>
    );
};

const DataItem: React.FC<{ label: string; value?: string; isTotal?: boolean }> = ({ label, value, isTotal = false }) => (
    <div className={`p-3 bg-white rounded-lg shadow-sm border border-slate-200/70 ${isTotal ? 'bg-slate-200' : ''}`}>
        <p className={`text-sm font-medium ${isTotal ? 'text-slate-600' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-base font-semibold ${isTotal ? 'text-slate-900 text-lg' : 'text-slate-800'}`}>{value || 'N/D'}</p>
    </div>
);
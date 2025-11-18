import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FileUpload } from './components/FileUpload';
import { ExtractedData } from './components/ExtractedData';
import { Loader } from './components/Loader';
import { extractBillData, extractOfferData } from './services/geminiService';
import type { BillData, OfferData } from './types';
import { ComparisonResult } from './components/ComparisonResult';
import { FilePreview } from './components/FilePreview';
import { OfferDataDisplay } from './components/OfferDataDisplay';
import { Logo } from './components/Logo';

const App: React.FC = () => {
  // State per la bolletta attuale
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<BillData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State per la modifica manuale bolletta
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedData, setEditedData] = useState<BillData | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // State per la nuova offerta (CTE)
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [offerFileDataUrl, setOfferFileDataUrl] = useState<string | null>(null);
  const [extractedOfferData, setExtractedOfferData] = useState<OfferData | null>(null);
  const [isExtractingOffer, setIsExtractingOffer] = useState<boolean>(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // State per la modifica manuale offerta
  const [isEditingOffer, setIsEditingOffer] = useState<boolean>(false);
  const [editedOfferData, setEditedOfferData] = useState<OfferData | null>(null);
  const [editOfferError, setEditOfferError] = useState<string | null>(null);
  
  // State per visualizzare il risultato finale
  const [showComparisonResult, setShowComparisonResult] = useState<boolean>(false);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) { // 10 MB limit
      resetState();
      setError("La dimensione del file non deve superare i 10MB.");
      return;
    }
    resetState();
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setFileDataUrl(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleOfferFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) { // 10 MB limit
      setComparisonError("La dimensione del file non deve superare i 10MB.");
      return;
    }
    setOfferFile(selectedFile);
    setExtractedOfferData(null);
    setComparisonError(null);
    setShowComparisonResult(false);
    const reader = new FileReader();
    reader.onloadend = () => setOfferFileDataUrl(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };


  const handleExtract = useCallback(async () => {
    if (!fileDataUrl) {
      setError("Per favore, carica un file della bolletta prima di procedere.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    setIsEditing(false);

    try {
      const [header, base64Data] = fileDataUrl.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      const data = await extractBillData(base64Data, mimeType);
      setExtractedData(data);
    } catch (e) {
      console.error(e);
      setError("Impossibile estrarre i dati. Per favore, prova con un file più chiaro o inserisci i dati manualmente.");
    } finally {
      setIsLoading(false);
    }
  }, [fileDataUrl]);

  const handleExtractOffer = useCallback(async () => {
    if (!offerFileDataUrl) {
        setComparisonError("Per favore, carica un file CTE prima di procedere.");
        return;
    }
    setIsExtractingOffer(true);
    setComparisonError(null);
    setExtractedOfferData(null);

    try {
        const [header, base64Data] = offerFileDataUrl.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        const data = await extractOfferData(base64Data, mimeType);
        setExtractedOfferData(data);
    } catch (e) {
        console.error(e);
        setComparisonError("Impossibile estrarre i dati dalla CTE. Prova con un file più chiaro o inserisci i dati manualmente.");
    } finally {
        setIsExtractingOffer(false);
    }
  }, [offerFileDataUrl]);

  const resetState = () => {
    setFile(null);
    setFileDataUrl(null);
    setExtractedData(null);
    setIsLoading(false);
    setError(null);
    setIsEditing(false);
    setEditedData(null);
    setEditError(null);
    setOfferFile(null);
    setOfferFileDataUrl(null);
    setExtractedOfferData(null);
    setIsExtractingOffer(false);
    setComparisonError(null);
    setIsEditingOffer(false);
    setEditedOfferData(null);
    setEditOfferError(null);
    setShowComparisonResult(false);
  };

  // Handlers per modifica Bolletta
  const handleEdit = () => {
    setEditedData({ ...extractedData! });
    setIsEditing(true);
    setEditError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
    setEditError(null);
  };

  const handleSave = () => {
    if (!editedData) return;
    const { gestoreAttuale, consumoAnnuo, consumoFatturato, tipoFornitura, prezzoUnitarioEnergia, quotaFissaEnergia, prezzoUnitarioGas, quotaFissaGas } = editedData;
    if (!gestoreAttuale || !consumoAnnuo || !consumoFatturato) {
      setEditError("I campi 'Gestore Attuale', 'Consumo Annuo' e 'Consumo Fatturato' sono obbligatoriori.");
      return;
    }
    if (tipoFornitura === 'Luce' && (!prezzoUnitarioEnergia || !quotaFissaEnergia)) {
      setEditError("Per la fornitura 'Luce', i campi 'Costo Energia' e 'Quota Fissa' sono obbligatori.");
      return;
    }
    if (tipoFornitura === 'Gas' && (!prezzoUnitarioGas || !quotaFissaGas)) {
      setEditError("Per la fornitura 'Gas', i campi 'Costo Gas' e 'Quota Fissa' sono obbligatori.");
      return;
    }
    setExtractedData(editedData);
    setIsEditing(false);
    setEditedData(null);
    setEditError(null);
    setError(null);
  };

  const handleDataChange = (field: keyof BillData, value: string) => {
    setEditedData(prev => prev ? { ...prev, [field]: value } : null);
    if (editError) setEditError(null);
  };

  const handleManualEntry = () => {
    resetState();
    const blankData: BillData = {
        nomeCliente: '', gestoreAttuale: '', indirizzoFornitura: '', podPdr: '', periodoFatturazione: '',
        consumoFatturato: '', consumoAnnuo: '', tipoFornitura: 'Luce', tipologiaUso: '', prezzoUnitarioEnergia: '',
        costoTotaleEnergia: '', quotaFissaEnergia: '', potenzaDisponibile: '', tensione: '', prezzoUnitarioGas: '',
        costoTotaleGas: '', quotaFissaGas: '',
    };
    setEditedData(blankData);
    setExtractedData(blankData); // Set extracted data to enable next step
    setIsEditing(true);
  };

  // Handlers per modifica Offerta
    const handleEditOffer = () => {
        setEditedOfferData({ ...extractedOfferData! });
        setIsEditingOffer(true);
        setEditOfferError(null);
    };

    const handleCancelOfferEdit = () => {
        if (!extractedOfferData) {
            setEditedOfferData(null);
        }
        setIsEditingOffer(false);
        setEditOfferError(null);
    };

    const handleSaveOfferEdit = () => {
        if (!editedOfferData) return;
        const { nomeOfferta, prezzoUnitario, quotaFissa } = editedOfferData;
        if (!nomeOfferta || !prezzoUnitario || !quotaFissa) {
            setEditOfferError("Tutti i campi della nuova offerta sono obbligatori.");
            return;
        }
        setExtractedOfferData(editedOfferData);
        setIsEditingOffer(false);
        setEditOfferError(null);
        setComparisonError(null);
    };

    const handleOfferDataChange = (field: keyof OfferData, value: string) => {
        setEditedOfferData(prev => prev ? { ...prev, [field]: value } : null);
        if (editOfferError) setEditOfferError(null);
    };
    
    const handleManualOfferEntry = () => {
        setOfferFile(null);
        setOfferFileDataUrl(null);
        setExtractedOfferData(null);
        setComparisonError(null);
        const blankOffer: OfferData = {
            nomeOfferta: '', prezzoUnitario: '', quotaFissa: '', tipoOfferta: 'Fisso',
        };
        setEditedOfferData(blankOffer);
        setExtractedOfferData(blankOffer); // Set extracted data to enable next step
        setIsEditingOffer(true);
    };
  
  const hasExtractedBillData = extractedData || (isEditing && editedData);
  const hasExtractedOfferData = extractedOfferData || (isEditingOffer && editedOfferData);

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-800">
      <Header />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
         <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight gradient-text sm:text-5xl md:text-6xl">Analizza e Risparmia</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">Un processo guidato in 3 semplici passi per scoprire il tuo risparmio potenziale.</p>
          </div>

        {/* --- SEZIONE 1: BOLLETTA --- */}
        <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-slate-200/50">
           <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">1. Analisi Bolletta Attuale</h2>
           <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Colonna Sinistra Bolletta */}
              <div className="flex flex-col gap-6">
                <FileUpload id="bill-upload" onFileSelect={handleFileSelect} disabled={isLoading || isExtractingOffer || !!file} />
                {fileDataUrl && file ? <FilePreview title="Anteprima Bolletta" file={file} fileDataUrl={fileDataUrl} /> : (
                  <div className="w-full h-48 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-500 border-2 border-dashed border-slate-200">
                    <p>L'anteprima del file apparirà qui</p>
                  </div>
                )}
                 {fileDataUrl && !extractedData && (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button onClick={handleExtract} disabled={isLoading || isExtractingOffer || !!extractedData} className="w-full flex items-center justify-center gap-3 px-6 py-3 gradient-bg text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {isLoading ? 'Estrazione in corso...' : 'Analizza Bolletta'} {!isLoading && <Logo className="h-6 w-auto" />}
                      </button>
                      <button onClick={resetState} disabled={isLoading || isExtractingOffer} className="w-full sm:w-auto px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-300 hover:bg-slate-100 transition-all duration-300">Annulla</button>
                    </div>
                )}
              </div>
              {/* Colonna Destra Bolletta */}
              <div className="flex flex-col">
                {isLoading && <Loader message="Analisi della bolletta in corso..." />}
                {error && !isEditing && (
                    <div className="p-4 text-center text-red-700 bg-red-100 border border-red-300 rounded-xl h-full flex flex-col justify-center">
                        <p>{error}</p>
                        <button onClick={handleManualEntry} className="mt-4 px-5 py-2 text-sm bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700"> Inserisci Dati Manualmente </button>
                    </div>
                )}
                {!isLoading && !error && !hasExtractedBillData && (
                    <div className="flex flex-col items-center justify-center text-center text-slate-500 h-full p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <i className="fas fa-file-invoice text-5xl mb-4 text-slate-300"></i>
                        <p className="font-semibold text-slate-600">I dati estratti dalla bolletta appariranno qui.</p>
                        <div className="mt-6 border-t pt-4 text-xs text-slate-400">
                          <p>Oppure <button onClick={handleManualEntry} className="underline font-semibold text-slate-500 hover:text-cyan-600">inseriscili manualmente</button>.</p>
                        </div>
                    </div>
                )}
                 {hasExtractedBillData && <ExtractedData data={extractedData} isEditing={isEditing} editedData={editedData} onEdit={handleEdit} onCancel={handleCancel} onSave={handleSave} onDataChange={handleDataChange} editError={editError}/>}
              </div>
           </div>
        </div>

        {/* --- SEZIONE 2: NUOVA OFFERTA (CTE) --- */}
        {hasExtractedBillData && !isEditing && (
            <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-slate-200/50 animate-fade-in">
                <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">2. Analisi Nuova Offerta (CTE)</h2>
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                    {/* Colonna Sinistra CTE */}
                    <div className="flex flex-col gap-6">
                        <FileUpload id="offer-upload" onFileSelect={handleOfferFileSelect} disabled={isExtractingOffer} />
                        {offerFile && offerFileDataUrl ? <FilePreview title="Anteprima Nuova Offerta" file={offerFile} fileDataUrl={offerFileDataUrl} /> : (
                             <div className="w-full h-48 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-500 border-2 border-dashed border-slate-200">
                                <p>L'anteprima della CTE apparirà qui</p>
                            </div>
                        )}
                        {offerFileDataUrl && !extractedOfferData && (
                          <div className="flex flex-col sm:flex-row gap-4">
                              <button onClick={handleExtractOffer} disabled={isExtractingOffer || !!extractedOfferData} className="w-full flex items-center justify-center gap-3 px-6 py-3 gradient-bg text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                  {isExtractingOffer ? 'Estrazione in corso...' : 'Analizza Offerta'} {!isExtractingOffer && <Logo className="h-6 w-auto" />}
                              </button>
                          </div>
                        )}
                    </div>
                    {/* Colonna Destra CTE */}
                    <div className="flex flex-col">
                        {isExtractingOffer && <Loader message="Analisi della nuova offerta in corso..." />}
                        {comparisonError && !isEditingOffer && (
                          <div className="p-4 text-center text-red-700 bg-red-100 border border-red-300 rounded-xl h-full flex flex-col justify-center">
                              <p>{comparisonError}</p>
                              <button onClick={handleManualOfferEntry} className="mt-4 px-5 py-2 text-sm bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700">Inserisci Dati Manualmente</button>
                          </div>
                        )}
                         {!isExtractingOffer && !comparisonError && !hasExtractedOfferData && (
                            <div className="flex flex-col items-center justify-center text-center text-slate-500 h-full p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <i className="fas fa-file-signature text-5xl mb-4 text-slate-300"></i>
                                <p className="font-semibold text-slate-600">I dati estratti dalla nuova offerta appariranno qui.</p>
                                <div className="mt-6 border-t pt-4 text-xs text-slate-400">
                                  <p>Oppure <button onClick={handleManualOfferEntry} className="underline font-semibold text-slate-500 hover:text-cyan-600">inseriscili manualmente</button>.</p>
                                </div>
                            </div>
                        )}
                         {hasExtractedOfferData && <OfferDataDisplay data={extractedOfferData} isEditing={isEditingOffer} editedData={editedOfferData} onEdit={handleEditOffer} onCancel={handleCancelOfferEdit} onSave={handleSaveOfferEdit} onDataChange={handleOfferDataChange} editError={editOfferError} isManualEntry={!extractedOfferData && !!editedOfferData} billData={extractedData}/>}
                    </div>
                </div>
            </div>
        )}
        
        {/* --- SEZIONE 3: PULSANTE CONFRONTA E RISULTATO --- */}
        {hasExtractedBillData && hasExtractedOfferData && !isEditing && !isEditingOffer && (
             <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-slate-200/50 animate-fade-in">
                 {!showComparisonResult ? (
                    <>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">Pronto per il Confronto?</h2>
                        <p className="text-slate-600 mb-6">Tutti i dati sono stati raccolti. Clicca qui sotto per calcolare il tuo risparmio potenziale.</p>
                        <button onClick={() => setShowComparisonResult(true)} className="px-10 py-4 text-xl flex items-center justify-center gap-3 mx-auto gradient-bg text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300">
                            Calcola Risparmio <i className="fas fa-calculator"></i>
                        </button>
                    </>
                 ) : (
                    <ComparisonResult
                        currentBill={extractedData!}
                        newOffer={editedOfferData || extractedOfferData!}
                        onReset={resetState}
                    />
                 )}
             </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
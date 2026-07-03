/**
 * FiltroContext - Contexto global de filtro de período
 * Compartilhado entre Dashboard e Relatórios para manter consistência
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

export type TipoPeriodo = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';

export interface FiltroState {
  tipoPeriodo: TipoPeriodo;
  dataInicio: Date;
  dataFim: Date;
  dataInicioCustom: string; // YYYY-MM-DD para input[type=date]
  dataFimCustom: string;    // YYYY-MM-DD para input[type=date]
}

interface FiltroContextType extends FiltroState {
  setTipoPeriodo: (tipo: TipoPeriodo) => void;
  setDataInicioCustom: (data: string) => void;
  setDataFimCustom: (data: string) => void;
  aplicarPersonalizado: () => void;
  labelPeriodo: string;
}

const hoje = new Date();
const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

function calcularIntervalo(tipo: TipoPeriodo, inicioCustom: string, fimCustom: string): { inicio: Date; fim: Date } {
  const now = new Date();
  switch (tipo) {
    case 'hoje':
      return { inicio: startOfDay(now), fim: endOfDay(now) };
    case 'semana':
      return { inicio: startOfWeek(now, { weekStartsOn: 0 }), fim: endOfWeek(now, { weekStartsOn: 0 }) };
    case 'mes':
      return { inicio: startOfMonth(now), fim: endOfMonth(now) };
    case 'ano':
      return { inicio: startOfYear(now), fim: endOfYear(now) };
    case 'personalizado':
      return {
        inicio: inicioCustom ? startOfDay(new Date(inicioCustom + 'T00:00:00')) : startOfDay(subDays(now, 30)),
        fim: fimCustom ? endOfDay(new Date(fimCustom + 'T00:00:00')) : endOfDay(now),
      };
    default:
      return { inicio: startOfMonth(now), fim: endOfMonth(now) };
  }
}

const defaultInicio = toDateStr(subDays(hoje, 30));
const defaultFim = toDateStr(hoje);

const FiltroContext = createContext<FiltroContextType | null>(null);

export function FiltroProvider({ children }: { children: React.ReactNode }) {
  const [tipoPeriodo, setTipoPeriodoState] = useState<TipoPeriodo>('mes');
  const [dataInicioCustom, setDataInicioCustom] = useState(defaultInicio);
  const [dataFimCustom, setDataFimCustom] = useState(defaultFim);

  const { inicio, fim } = calcularIntervalo(tipoPeriodo, dataInicioCustom, dataFimCustom);

  const setTipoPeriodo = useCallback((tipo: TipoPeriodo) => {
    setTipoPeriodoState(tipo);
  }, []);

  const aplicarPersonalizado = useCallback(() => {
    setTipoPeriodoState('personalizado');
  }, []);

  const labelMap: Record<TipoPeriodo, string> = {
    hoje: 'Hoje',
    semana: 'Esta semana',
    mes: 'Este mês',
    ano: 'Este ano',
    personalizado: `${dataInicioCustom.split('-').reverse().join('/')} – ${dataFimCustom.split('-').reverse().join('/')}`,
  };

  return (
    <FiltroContext.Provider
      value={{
        tipoPeriodo,
        dataInicio: inicio,
        dataFim: fim,
        dataInicioCustom,
        dataFimCustom,
        setTipoPeriodo,
        setDataInicioCustom,
        setDataFimCustom,
        aplicarPersonalizado,
        labelPeriodo: labelMap[tipoPeriodo],
      }}
    >
      {children}
    </FiltroContext.Provider>
  );
}

export function useFiltro() {
  const ctx = useContext(FiltroContext);
  if (!ctx) throw new Error('useFiltro deve ser usado dentro de FiltroProvider');
  return ctx;
}

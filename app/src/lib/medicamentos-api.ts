import type { Database, Medicamento, Toma } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type MedicamentoInput = Omit<Database['public']['Tables']['medicamentos']['Insert'], 'id' | 'user_id'>;

export async function listarMedicamentos(): Promise<Medicamento[]> {
  const { data, error } = await supabase.from('medicamentos').select('*').order('nombre');
  if (error) throw error;
  return data;
}

export async function crearMedicamento(input: MedicamentoInput) {
  const { data, error } = await supabase.from('medicamentos').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function actualizarMedicamento(id: string, cambios: Partial<MedicamentoInput>) {
  const { data, error } = await supabase.from('medicamentos').update(cambios).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function eliminarMedicamento(id: string) {
  const { error } = await supabase.from('medicamentos').delete().eq('id', id);
  if (error) throw error;
}

/** Tomas registradas desde una fecha */
export async function listarTomas(desde: Date): Promise<Toma[]> {
  const { data, error } = await supabase
    .from('tomas')
    .select('*')
    .gte('programada_para', desde.toISOString())
    .order('programada_para');
  if (error) throw error;
  return data;
}

/** Marca una dosis como tomada (idempotente gracias al unique medicamento_id + programada_para) */
export async function marcarTomada(medicamentoId: string, programada: Date) {
  const { data, error } = await supabase
    .from('tomas')
    .upsert(
      {
        medicamento_id: medicamentoId,
        programada_para: programada.toISOString(),
        tomada_en: new Date().toISOString(),
        omitida: false,
      },
      { onConflict: 'medicamento_id,programada_para' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function desmarcarToma(tomaId: string) {
  const { error } = await supabase.from('tomas').delete().eq('id', tomaId);
  if (error) throw error;
}

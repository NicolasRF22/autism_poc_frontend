export const PDI_SUBJECTS_INFANTIL = [
  { id: 'eu_o_outro_e_o_nos', name: 'Eu, o outro e o nós' },
  { id: 'corpo_gestos_e_movimentos', name: 'Corpo, gestos e movimentos' },
  { id: 'tracos_sons_cores_e_formas', name: 'Traços, sons, cores e formas' },
  { id: 'escuta_faca_pensamento_e_imaginacao', name: 'Escuta, faça, pensamento e imaginação' },
  { id: 'espacos_tempos_relacoes_e_transformacoes', name: 'Espaços, tempos, relações e transformações' },
];

export const PDI_SUBJECTS_FUNDAMENTAL_I = [
  { id: 'lingua_portuguesa', name: 'Língua Portuguesa' },
  { id: 'matematica', name: 'Matemática' },
  { id: 'historia', name: 'História' },
  { id: 'geografia', name: 'Geografia' },
  { id: 'ciencias', name: 'Ciências' },
  { id: 'ensino_religioso', name: 'Ensino Religioso' },
  { id: 'arte', name: 'Arte' },
  { id: 'educacao_fisica', name: 'Educação Física' },
];

export const PDI_SUBJECTS_BY_LEVEL = {
  infantil: PDI_SUBJECTS_INFANTIL,
  fundamental_i: PDI_SUBJECTS_FUNDAMENTAL_I,
};

export const INFANTIL_GRADES = new Set([
  '1° Ano do Infantil',
  '2° Ano do Infantil',
  '3° Ano do Infantil',
]);

export const FUNDAMENTAL_I_GRADES = new Set([
  '1° Ano do Fundamental I',
  '2° Ano do Fundamental I',
  '3° Ano do Fundamental I',
  '4° Ano do Fundamental I',
  '5° Ano do Fundamental I',
]);

export function getPdiSubjectLevel(grade) {
  const normalizedGrade = String(grade || '').trim();
  if (INFANTIL_GRADES.has(normalizedGrade)) return 'infantil';
  if (FUNDAMENTAL_I_GRADES.has(normalizedGrade)) return 'fundamental_i';
  return 'fundamental_i';
}

export function getPdiSubjectsForGrade(grade) {
  return PDI_SUBJECTS_BY_LEVEL[getPdiSubjectLevel(grade)] || PDI_SUBJECTS_FUNDAMENTAL_I;
}

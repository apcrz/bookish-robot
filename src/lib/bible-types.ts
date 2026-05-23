export type Translation = "aa" | "acf" | "nvi";

export interface BibleBook {
  description: string;
  book: string;
  chaptersCount: number;
  chapters: string[][];
}

export interface BookMeta {
  id: string;
  name: string;
  testament: "AT" | "NT";
}

export const TRANSLATIONS: { id: Translation; label: string }[] = [
  { id: "aa", label: "Almeida Atualizada" },
  { id: "acf", label: "Almeida Corrigida Fiel" },
  { id: "nvi", label: "Nova Versão Internacional" },
];

export const BOOKS: BookMeta[] = [
  // Antigo Testamento
  { id: "gn", name: "Gênesis", testament: "AT" },
  { id: "ex", name: "Êxodo", testament: "AT" },
  { id: "lv", name: "Levítico", testament: "AT" },
  { id: "nm", name: "Números", testament: "AT" },
  { id: "dt", name: "Deuteronômio", testament: "AT" },
  { id: "js", name: "Josué", testament: "AT" },
  { id: "jz", name: "Juízes", testament: "AT" },
  { id: "rt", name: "Rute", testament: "AT" },
  { id: "1sm", name: "1 Samuel", testament: "AT" },
  { id: "2sm", name: "2 Samuel", testament: "AT" },
  { id: "1rs", name: "1 Reis", testament: "AT" },
  { id: "2rs", name: "2 Reis", testament: "AT" },
  { id: "1cr", name: "1 Crônicas", testament: "AT" },
  { id: "2cr", name: "2 Crônicas", testament: "AT" },
  { id: "ed", name: "Esdras", testament: "AT" },
  { id: "ne", name: "Neemias", testament: "AT" },
  { id: "et", name: "Ester", testament: "AT" },
  { id: "jó", name: "Jó", testament: "AT" },
  { id: "sl", name: "Salmos", testament: "AT" },
  { id: "pv", name: "Provérbios", testament: "AT" },
  { id: "ec", name: "Eclesiastes", testament: "AT" },
  { id: "ct", name: "Cânticos", testament: "AT" },
  { id: "is", name: "Isaías", testament: "AT" },
  { id: "jr", name: "Jeremias", testament: "AT" },
  { id: "lm", name: "Lamentações", testament: "AT" },
  { id: "ez", name: "Ezequiel", testament: "AT" },
  { id: "dn", name: "Daniel", testament: "AT" },
  { id: "os", name: "Oséias", testament: "AT" },
  { id: "jl", name: "Joel", testament: "AT" },
  { id: "am", name: "Amós", testament: "AT" },
  { id: "ob", name: "Obadias", testament: "AT" },
  { id: "jn", name: "Jonas", testament: "AT" },
  { id: "mq", name: "Miquéias", testament: "AT" },
  { id: "na", name: "Naum", testament: "AT" },
  { id: "hc", name: "Habacuque", testament: "AT" },
  { id: "sf", name: "Sofonias", testament: "AT" },
  { id: "ag", name: "Ageu", testament: "AT" },
  { id: "zc", name: "Zacarias", testament: "AT" },
  { id: "ml", name: "Malaquias", testament: "AT" },
  // Novo Testamento
  { id: "mt", name: "Mateus", testament: "NT" },
  { id: "mc", name: "Marcos", testament: "NT" },
  { id: "lc", name: "Lucas", testament: "NT" },
  { id: "jo", name: "João", testament: "NT" },
  { id: "at", name: "Atos", testament: "NT" },
  { id: "rm", name: "Romanos", testament: "NT" },
  { id: "1co", name: "1 Coríntios", testament: "NT" },
  { id: "2co", name: "2 Coríntios", testament: "NT" },
  { id: "gl", name: "Gálatas", testament: "NT" },
  { id: "ef", name: "Efésios", testament: "NT" },
  { id: "fp", name: "Filipenses", testament: "NT" },
  { id: "cl", name: "Colossenses", testament: "NT" },
  { id: "1ts", name: "1 Tessalonicenses", testament: "NT" },
  { id: "2ts", name: "2 Tessalonicenses", testament: "NT" },
  { id: "1tm", name: "1 Timóteo", testament: "NT" },
  { id: "2tm", name: "2 Timóteo", testament: "NT" },
  { id: "tt", name: "Tito", testament: "NT" },
  { id: "fm", name: "Filemom", testament: "NT" },
  { id: "hb", name: "Hebreus", testament: "NT" },
  { id: "tg", name: "Tiago", testament: "NT" },
  { id: "1pe", name: "1 Pedro", testament: "NT" },
  { id: "2pe", name: "2 Pedro", testament: "NT" },
  { id: "1jo", name: "1 João", testament: "NT" },
  { id: "2jo", name: "2 João", testament: "NT" },
  { id: "3jo", name: "3 João", testament: "NT" },
  { id: "jd", name: "Judas", testament: "NT" },
  { id: "ap", name: "Apocalipse", testament: "NT" },
];

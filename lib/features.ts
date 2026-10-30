export type FeatureCode =
  | "importacao-anilha" | "gestao-anilhas" | "gestao-ave" | "galeria-fotos"
  | "gestao-documentos" | "gestao-gaiola" | "historico-ave" | "comportamento"
  | "genealogia" | "painel" | "cartao-gaiola" | "imprimir-ficha" | "imprimir-plantel" | "certificado-genealogia" | "sms" | "reproducao" | "doencas"
  | "medicamentos" | "genotipagem" | "sexagem" | "agendar-veterinario" | "consulta-veterinaria-inclusa" | "modulo-veterinario";

export const FEATURES: {code: FeatureCode; title: string; description: string; tier: "free" | "amador" | "profissional" | "lenda"}[] = [
 {code:"importacao-anilha",title:"Importação de Anilha",description:"Importe registros por CSV para acelerar o cadastro do plantel.",tier:"amador"},
 {code:"gestao-anilhas",title:"Gestão de Anilhas",description:"Controle números de anilha e associe cada identificação à ave.",tier:"amador"},
 {code:"gestao-ave",title:"Gestão de Ave",description:"Ficha completa da ave, status, datas, registros, pais e genética.",tier:"free"},
 {code:"galeria-fotos",title:"Galeria de Fotos",description:"Organize fotos por ave usando o armazenamento do projeto.",tier:"amador"},
 {code:"gestao-documentos",title:"Gestão de Documentos",description:"Guarde referências de documentos e anexos da ave.",tier:"amador"},
 {code:"gestao-gaiola",title:"Gestão de Gaiola",description:"Associe localização e identificação da gaiola às aves.",tier:"amador"},
 {code:"historico-ave",title:"Histórico de Ave",description:"Registre acontecimentos, transferências, falecimento e observações.",tier:"free"},
 {code:"comportamento",title:"Gestão de Comportamento",description:"Registre comportamento e observações periódicas.",tier:"amador"},
 {code:"genealogia",title:"Genealogia para Crachá e Folha A4",description:"Visualize a família e imprima a árvore genealógica.",tier:"free"},
 {code:"painel",title:"Painel de Dados",description:"Indicadores do plantel, espécies, sexo e status.",tier:"free"},
 {code:"cartao-gaiola",title:"Cartão de Gaiola",description:"Pré-visualize o cartão gratuitamente; a impressão é liberada nos planos pagos.",tier:"free"},
 {code:"imprimir-ficha",title:"Imprimir ficha da ave",description:"Ficha completa em formato A4, com identidade do criatório, genealogia e histórico veterinário.",tier:"amador"},
 {code:"imprimir-plantel",title:"Imprimir plantel",description:"Lista organizada de todo o plantel para impressão.",tier:"amador"},
 {code:"certificado-genealogia",title:"Certificado genealógico",description:"Certificado individual A4 com árvore genealógica ampliada até trisavós. Disponível a partir do Criatório Amador.",tier:"amador"},
 {code:"sms",title:"Notificação por SMS",description:"Prepare notificações e lembretes; o envio depende de um provedor configurado.",tier:"profissional"},
 {code:"reproducao",title:"Gestão de Reprodução",description:"Registre casais, acasalamentos, ninhadas e eventos reprodutivos.",tier:"profissional"},
 {code:"doencas",title:"Gestão de Doença",description:"Registre ocorrências, diagnóstico informado e acompanhamento.",tier:"profissional"},
 {code:"medicamentos",title:"Gestão de Medicamentos",description:"Controle tratamentos e histórico de medicamentos.",tier:"profissional"},
 {code:"genotipagem",title:"Gestão de Genotipagem",description:"Registre exames e resultados genéticos da ave.",tier:"profissional"},
 {code:"sexagem",title:"Gestão de Sexagem",description:"Registre método, data, resultado e documento da sexagem.",tier:"profissional"},
 {code:"agendar-veterinario",title:"Agendar veterinário",description:"Solicite atendimento ao veterinário parceiro. A consulta é combinada diretamente com ele.",tier:"free"},
 {code:"consulta-veterinaria-inclusa",title:"1 consulta veterinária inclusa",description:"Uma consulta para uma ave por período anual pago do Criador Lenda.",tier:"lenda"},
 {code:"modulo-veterinario",title:"Módulo Veterinário Completo",description:"Prontuários, receitas, histórico clínico e documentos veterinários vinculados a cada ave. Novos usuários podem testar os recursos do Criatório Amador por 30 dias no primeiro uso. Depois, o módulo é bloqueado até a contratação do plano.",tier:"profissional"},
];

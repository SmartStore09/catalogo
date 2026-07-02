'use strict';
/* ================= CONFIG ================= */
// SHEET_ID atualizado em 02/07/2026: o arquivo antigo era um .xlsx só "aberto" no Sheets
// (nunca convertido de verdade), o que fazia a exportação CSV falhar com erro 400.
// O usuário converteu via Arquivo → "Salvar como Planilhas Google", gerando este novo arquivo.
const SHEET_ID  = '1g37KoM93BgpbC0GJnFYj_423RKxbFt2mHWscnfWYUBA';
const GID       = '794665000'; // gid da aba CATÁLOGO — usado só pro botão "Planilha" abrir na aba certa
const URL_PLANILHA = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${GID}`;
const LOJA = {nome:'SMART STORE 09', fone:'(89) 98809-8980', cidade:'Paraibano-MA', site:'smartstore09.github.io/catalogo'};
const EMOJI = {'Assistência':'🔧','iPhones':'📱','Acessórios':'🔌','Beleza':'💄','Presentes':'🎁','Educação':'🎓','Peças/Frontais':'📲','Componentes':'⚙️','Capinhas':'📱','Películas':'🎬'};

/* Nomes de abas usados para buscar por NOME em vez de gid — gids não são estáveis (mudam se o
   arquivo for convertido/recriado), nome da aba é bem mais confiável. */
const NOMES_ABA_CATALOGO  = ['CATÁLOGO','CATALOGO'];
const NOMES_ABA_CAPINHAS  = ['CAPINHAS','📱 CAPINHAS','Capinhas','CAPINHA'];
const NOMES_ABA_PELICULAS = ['PELÍCULAS','PELICULAS','Películas','🎬 PELÍCULAS'];

/* Preço padrão quando a aba CAPINHAS/PELÍCULAS não traz preço próprio na linha */
const precoCapinha = () => ({venda:15, pix:13.5});
const precoPelicula = (tipo) => {
  const t=String(tipo||'').toLowerCase();
  if(t.includes('privacid')) return {venda:15, pix:13.5};
  if(t.includes('hidrogel')) return {venda:8, pix:7.2};
  return {venda:10, pix:9}; // 3D (padrão)
};

/* ============ CATÁLOGO EMBUTIDO (fallback offline — 07/06/2026) ============ */
/* [código, categoria, produto, marca, especificações, preço, pix, custo, estoque, status, obs] */
const EMBUTIDO = [
["SS-001","Assistência","Troca de Tela Frontal","Smart Store 09","Apple e Android · Todos os modelos",180,162,null,null,"Ativo","Mais procurado"],
["SS-002","Assistência","Troca de Placa de Carga","Smart Store 09","Apple e Android · Todos os modelos",100,90,null,null,"Ativo",""],
["SS-003","Assistência","Troca de Conector de Carga","Smart Store 09","USB-C e Lightning",100,90,null,null,"Ativo",""],
["SS-004","Assistência","Diagnóstico Técnico","Smart Store 09","Identificação de falhas",0,0,null,null,"Ativo","Grátis"],
["SS-005","Assistência","Outros Reparos","Smart Store 09","Bateria · Alto-falante · Câmera",null,null,null,null,"Ativo","Sob consulta"],
["IP-16E-128-BR","iPhones","iPhone 16e 128GB","Apple","128GB · Branco · Chip A16 · Novo",3498.99,3148.99,null,null,"Ativo",""],
["IP-17-256-PT","iPhones","iPhone 17 256GB","Apple","256GB · Preto · Chip A19 · Novo",5999.00,5399.10,null,null,"Ativo",""],
["IP-16-128-PT","iPhones","iPhone 16 128GB","Apple","128GB · Preto · Chip A18 · Novo",4899.00,4409.10,null,null,"Ativo",""],
["IP-15-128-AZ","iPhones","iPhone 15 128GB","Apple","128GB · Azul · Chip A16 · Novo",4298.99,3869.09,null,1,"Último","Último em estoque"],
["AC-001","Acessórios","Capinha Protetora","Diversas","Silicone e acrílico · Vários modelos",15,13.50,null,null,"Ativo",""],
["AC-002","Acessórios","Película 3D Original","Diversas","Vidro temperado · Vários modelos",10,9,null,null,"Ativo",""],
["AC-003","Acessórios","Película 3D Privacidade","Diversas","Anti-espião · Vidro temperado",15,13.50,null,null,"Ativo",""],
["AC-004","Acessórios","Cabo H'Maston USB-C","H'Maston","USB-C · 1m · Turbo",25,22.50,null,null,"Ativo",""],
["AC-005","Acessórios","Carregador H'Maston Turbo","H'Maston","Turbo · USB-C",45,40.50,null,null,"Ativo",""],
["AC-006","Acessórios","Carregador Kaidi QC 3.0","Kaidi","Quick Charge 3.0",35,31.50,null,null,"Ativo",""],
["AC-007","Acessórios","Carregador Kaidi 20W","Kaidi","20W · USB-C",30,27,null,null,"Ativo",""],
["AC-008","Acessórios","Carregador Veicular H'Maston","H'Maston","Veicular · Turbo",35,31.50,null,null,"Ativo",""],
["AC-009","Acessórios","Carregador Turbo Genérico","Genérico","Turbo · Universal",20,18,null,null,"Ativo",""],
["AC-010","Acessórios","Fonte de Carregamento","Diversas","Universal · USB-A/C",25,22.50,null,null,"Ativo",""],
["AC-011","Acessórios","Power Bank","Diversas","10.000mAh · Turbo",45,40.50,null,null,"Ativo",""],
["AC-012","Acessórios","Cabo de Dados","Diversas","USB-C/Micro · 1m",20,18,null,null,"Ativo",""],
["AC-013","Acessórios","Suporte Veicular","Diversas","Magnético · Universal",35,31.50,null,null,"Ativo",""],
["AC-014","Acessórios","Fone de Ouvido","Diversas","Bluetooth e com fio",29,26.10,null,null,"Ativo",""],
["75.792","Beleza","Floratta Flores Secretas","O Boticário","Desodorante Colônia · 75ml",164.90,148.41,null,null,"Ativo",""],
["77.183","Beleza","Creme Hidratante Liz","O Boticário","Corporal · 250g",74.90,67.41,null,null,"Ativo",""],
["85.124","Beleza","Loção Hidratante Deleite","O Boticário","400ml · Vegana",74.90,37.45,null,null,"Ativo",""],
["BL-BS1","Beleza","Body Splash Deleite","O Boticário","200ml · Vegana",92.90,78.96,null,null,"Ativo",""],
["51.130","Beleza","Body Splash Beijinho","O Boticário","200ml · Vegana",92.90,78.96,null,null,"Ativo",""],
["85.120","Beleza","Sabonete Deleite","O Boticário","2un · 80g",23.90,13.52,null,null,"Ativo",""],
["52.381","Beleza","Sabonete Cereja e Amêndoas","Eudora","4 sabonetes · 80g",32.99,26.39,null,null,"Ativo",""],
["58.181","Beleza","Batom Cremoso Cor 120","QDB","Longa duração",29.90,25.42,null,null,"Ativo",""],
["56.672","Beleza","Pincel Blush Niina Secrets","Niina Secrets","Profissional",69.99,55.99,null,null,"Ativo",""],
["95.018","Beleza","Paleta Sombras Diabo Veste Prada","Eudora","24 cores · Alta pigmentação",234.99,147.91,null,null,"Ativo",""],
["BL-007","Beleza","Kit Pincéis Maquiagem","Genérico","12 pincéis · Com estojo",45,null,null,null,"Ativo",""],
["PR-001","Presentes","Balão Metalizado Coração","Artesanal","Brilho premium",5,4.50,null,null,"Ativo",""],
["PR-002","Presentes","Caixa de Madeira Te Amo","Artesanal","Decorativa · Romântico",18,16.20,null,null,"Ativo",""],
["PR-003","Presentes","Flores com Ursinho","Artesanal","Rosa de tecido · Chaveiro",5,4.50,null,null,"Ativo",""],
["PR-004","Presentes","Colar Semijóia Personalizado","Artesanal","Medalha com gravação · Ouro",160,144,null,null,"Ativo","Sob encomenda"],
["PR-005","Presentes","Colar Relicário Personalizado","Artesanal","Coração abre e fecha",200,180,null,null,"Ativo","Sob encomenda"],
["PR-006","Presentes","Pulseira Infantil Personalizada","Artesanal","Nome gravado · Ouro",125,112.50,null,null,"Ativo","Sob encomenda"],
["PR-007","Presentes","Colar Nome Personalizado","Artesanal","Nome + coração · Ouro",160,144,null,null,"Ativo","Sob encomenda"],
["PR-008","Presentes","Luminária Rosa Eterna","Genérico","Cúpula vidro · LED",45,40.50,null,null,"Ativo",""],
["PR-009","Presentes","Luminária I Love You","Genérico","Placa acrílica LED",45,40.50,null,null,"Ativo",""],
["ED-001","Educação","Quiz Interativo Digital","Prof. Jânio","Física · Mat · Bio · Geo",null,null,null,null,"Ativo","Consultar"],
["ED-002","Educação","Atividade Avaliativa","Prof. Jânio","PDF e Word · Personalizadas",null,null,null,null,"Ativo","Consultar"],
["ED-003","Educação","Aula Particular / Reforço","Prof. Jânio","Física · Matemática",null,null,null,null,"Ativo","Consultar"],
["ED-004","Educação","Material de Estudo","Prof. Jânio","Apostilas · Resumos",null,null,null,null,"Ativo","Consultar"],
["PC-SA-A02","Peças/Frontais","Frontal Samsung A02/A12/M12","Samsung","Sem aro · OEM",120,108,71,null,"Ativo",""],
["PC-SA-A02S","Peças/Frontais","Frontal Samsung A02S/A03/A03S","Samsung","Sem aro · OEM",120,108,71,null,"Ativo",""],
["PC-SA-A04","Peças/Frontais","Frontal Samsung A04/A04S/A04E","Samsung","OEM",120,108,76,null,"Ativo",""],
["PC-SA-A05","Peças/Frontais","Frontal Samsung A05","Samsung","OEM",120,108,88,null,"Ativo",""],
["PC-SA-A06","Peças/Frontais","Frontal Samsung A06","Samsung","Sem aro · OEM",120,108,83,null,"Ativo",""],
["PC-SA-A10","Peças/Frontais","Frontal Samsung A10","Samsung","OEM",120,108,68,null,"Ativo",""],
["PC-SA-A13","Peças/Frontais","Frontal Samsung A13/A23/M13/M33","Samsung","OEM",120,108,88,null,"Ativo",""],
["PC-SA-A13-5G","Peças/Frontais","Frontal Samsung A13 5G/A04S","Samsung","OEM",120,108,88,null,"Ativo",""],
["PC-SA-A14","Peças/Frontais","Frontal Samsung A14 4G","Samsung","OEM",120,108,88,null,"Ativo",""],
["PC-SA-A14-5G","Peças/Frontais","Frontal Samsung A14 5G/M14","Samsung","OEM",120,108,98,null,"Ativo",""],
["PC-SA-A15","Peças/Frontais","Frontal Samsung A15 4G/5G","Samsung","Super LED com aro · OEM",120,108,103,null,"Ativo",""],
["PC-SA-A16","Peças/Frontais","Frontal Samsung A16 4G/5G","Samsung","OEM",120,108,103,null,"Ativo",""],
["PC-SA-A17","Peças/Frontais","Frontal Samsung A17","Samsung","Sem aro · OEM",120,108,100,null,"Ativo",""],
["PC-SA-A20","Peças/Frontais","Frontal Samsung A20","Samsung","OEM",120,108,80,null,"Ativo",""],
["PC-SA-A20S","Peças/Frontais","Frontal Samsung A20S","Samsung","OEM",120,108,68,null,"Ativo",""],
["PC-SA-A21","Peças/Frontais","Frontal Samsung A21 4G","Samsung","OEM",120,108,85,null,"Ativo",""],
["PC-SA-A21S","Peças/Frontais","Frontal Samsung A21S/A23 5G","Samsung","Super AMOLED · OEM",120,108,93,null,"Ativo",""],
["PC-SA-A22","Peças/Frontais","Frontal Samsung A22 4G/F22","Samsung","OEM",120,108,90,null,"Ativo",""],
["PC-SA-A22-5G","Peças/Frontais","Frontal Samsung A22 5G","Samsung","OEM",120,108,90,null,"Ativo",""],
["PC-SA-A23","Peças/Frontais","Frontal Samsung A23 4G","Samsung","OEM",120,108,95,null,"Ativo",""],
["PC-SA-A24","Peças/Frontais","Frontal Samsung A24 4G","Samsung","AMOLED · OEM",120,108,103,null,"Ativo",""],
["PC-SA-A24-5G","Peças/Frontais","Frontal Samsung A24 5G","Samsung","OEM",120,108,108,null,"Ativo",""],
["PC-SA-A25","Peças/Frontais","Frontal Samsung A25/A24/M34","Samsung","AMOLED · OEM",120,108,110,null,"Ativo",""],
["PC-SA-A26","Peças/Frontais","Frontal Samsung A26 4G/A16","Samsung","OEM",120,108,110,null,"Ativo",""],
["PC-SA-A26-5G","Peças/Frontais","Frontal Samsung A26 5G","Samsung","AMOLED · OEM",120,108,114,null,"Ativo",""],
["PC-SA-A30S","Peças/Frontais","Frontal Samsung A30/A30S/A50","Samsung","Super LED com aro · OEM",120,108,91,null,"Ativo",""],
["PC-SA-J7","Peças/Frontais","Frontal Samsung J7 Prime","Samsung","OEM",120,108,76,null,"Ativo",""],
["PC-AP-IP7P","Peças/Frontais","Frontal iPhone 7 Plus","Apple","NN · Branco e Preto",120,108,90,null,"Ativo",""],
["PC-AP-IP8P","Peças/Frontais","Frontal iPhone 8 Plus","Apple","NN · Branco e Preto",120,108,100,null,"Ativo",""],
["PC-AP-IPXR","Peças/Frontais","Frontal iPhone XR","Apple","LC Mecânico · Importação Própria",120,108,100,null,"Ativo",""],
["PC-AP-IP11","Peças/Frontais","Frontal iPhone 11","Apple","Sem CI WK · Compatível CI e Sem CI",166.40,149.76,128,null,"Ativo",""],
["PC-AP-IP11P","Peças/Frontais","Frontal iPhone 11 Pro","Apple","Super LED sem EPRON WK",205.40,184.86,158,null,"Ativo",""],
["PC-AP-IP12","Peças/Frontais","Frontal iPhone 12/12 Pro","Apple","Super LED sem EPRON NN",166.40,149.76,128,null,"Ativo",""],
["PC-AP-IP13","Peças/Frontais","Frontal iPhone 13 OLED","Apple","OLED VIVID sem EPRON WK",497.90,448.11,383,null,"Ativo",""],
["PC-AP-TAMP","Peças/Frontais","Tampa Traseira Apple","Apple","Toda a linha iPhone",null,null,null,null,"Ativo","Consultar"],
["PC-MT-G14","Peças/Frontais","Frontal Moto G14/G54","Motorola","SEM ARO · OEM · Cód:1963",120,108,83,null,"Ativo",""],
["PC-MT-G8P","Peças/Frontais","Frontal Moto G8 Power","Motorola","COM ARO Nacional · OEM · Cód:709",120,108,76,null,"Ativo",""],
["PC-MT-E7","Peças/Frontais","Frontal Moto E7/E7 Power","Motorola","SEM ARO Mecânico · OEM · Cód:644",120,108,81,null,"Ativo",""],
["PC-MT-G9P","Peças/Frontais","Frontal Moto G9 Play","Motorola","SEM ARO · OEM · Cód:649",120,108,83,null,"Ativo",""],
["PC-IF-HOT10S","Peças/Frontais","Frontal Infinix HOT 10S","Infinix","Sem aro · OEM · Cód:1595",120,108,100,null,"Ativo",""],
["PC-IF-HOT11S","Peças/Frontais","Frontal Infinix HOT 11S","Infinix","Sem aro · OEM · Cód:1265",120,108,103,null,"Ativo",""],
["PC-IF-SM6","Peças/Frontais","Frontal Infinix Smart 6","Infinix","Nacional S/Aro · OEM · Cód:982",120,108,88,null,"Ativo",""],
["PC-IF-SM7","Peças/Frontais","Frontal Infinix Smart 7/Intel A70","Infinix","S/Aro · OEM · Cód:3144",120,108,93,null,"Ativo",""],
["PC-IF-SM11","Peças/Frontais","Frontal Infinix Smart 11","Infinix","Sem aro · OEM · Cód:1264",120,108,110,null,"Ativo",""],
["PC-IF-HOT50I","Peças/Frontais","Frontal Infinix HOT 50i/Smart 9","Infinix","Sem aro · OEM · Cód:6180",120,108,114,null,"Ativo",""],
["PC-RM-C55","Peças/Frontais","Frontal Realme C55/11X/11","Realme","Sem aro NN · OEM · Cód:1081",120,108,103,null,"Ativo",""],
["PC-RM-C61","Peças/Frontais","Frontal Realme C61/C63","Realme","NN · OEM · Cód:5355",120,108,108,null,"Ativo",""],
["PC-RM-C11","Peças/Frontais","Frontal Realme C11","Realme","NN S/Aro · OEM · Cód:1886",120,108,88,null,"Ativo",""],
["PC-RD-N8","Peças/Frontais","Frontal Redmi Note 8","Redmi","NN S/ARO · OEM · Cód:1924",120,108,75,null,"Ativo",""],
["PC-RD-13C","Peças/Frontais","Frontal Redmi 13C","Redmi","Sem aro · OEM · Cód:2264",120,108,88,null,"Ativo",""],
["PC-RD-N10","Peças/Frontais","Frontal Redmi Note 10/11/11S","Redmi","Super LED S/ARO · OEM · Cód:1982",120,108,83,null,"Ativo",""],
["PC-RD-12","Peças/Frontais","Frontal Redmi 12/13","Redmi","Sem aro WK · OEM · Cód:1910",120,108,108,null,"Ativo",""],
["PC-RD-12C","Peças/Frontais","Frontal Redmi 12C","Redmi","Sem aro NN · OEM · Cód:1124",120,108,83,null,"Ativo",""],
["COMP-22","Componentes","Placa Carga Samsung A12/AAA","Samsung","A12 · M12 · AAA",25.95,23.36,5.19,null,"Ativo",""],
["COMP-35","Componentes","Placa Carga Samsung A20S/M12","Samsung","A20S · M12 · AAA",26.15,23.54,5.23,null,"Ativo",""],
["COMP-54","Componentes","Placa Carga Samsung A03S","Samsung","A03S · AAA",23.95,21.56,4.79,null,"Ativo",""],
["COMP-117","Componentes","Placa Carga Samsung A22 4G","Samsung","A22 4G",25.10,22.59,5.02,null,"Ativo",""],
["COMP-119","Componentes","Placa Carga Samsung A02S","Samsung","A02S",29.55,26.60,5.91,null,"Ativo",""],
["COMP-2208","Componentes","Placa Carga Samsung A10S M16","Samsung","A10S · Versão M16",23.15,20.84,4.63,null,"Ativo",""],
["COMP-3266","Componentes","Placa Carga Samsung A10S M15","Samsung","A10S · Versão M15 AAA",21.40,19.26,4.28,null,"Ativo",""],
["COMP-3329","Componentes","Placa Carga Samsung A03 Core","Samsung","A03 Core · AAA",25.90,23.31,5.18,null,"Ativo",""],
["COMP-7436","Componentes","Placa Carga Samsung A13 4G","Samsung","A13 4G · AAA",25.30,22.77,5.06,null,"Ativo",""],
["COMP-13854","Componentes","Placa Carga Samsung A23 4G Original","Samsung","A23 4G · Original 1:1",95.80,86.22,19.16,null,"Ativo",""],
["COMP-13863","Componentes","Placa Carga Samsung A14 4G","Samsung","A14 4G · AAA",24.45,22.01,4.89,null,"Ativo",""],
["COMP-47","Componentes","Placa Carga Moto G9 Play","Motorola","Moto G9 Play",36.25,32.63,7.25,null,"Ativo",""],
["COMP-10780","Componentes","Placa Carga Moto E22","Motorola","Moto E22",52.15,46.94,10.43,null,"Ativo",""],
["COMP-10781","Componentes","Placa Carga Moto G22","Motorola","Moto G22",46.75,42.08,9.35,null,"Ativo",""],
["COMP-11289","Componentes","Placa Carga Moto G31","Motorola","Moto G31",43.00,38.70,8.60,null,"Ativo",""],
["COMP-7435","Componentes","Placa Carga Xiaomi Note 11 4G","Xiaomi","Note 11 4G · M4 Pro · Note 12/12S",30.30,27.27,6.06,null,"Ativo",""],
["COMP-12848","Componentes","Placa Carga Xiaomi Redmi 9A","Xiaomi","Redmi 9A · AAA",27.30,24.57,5.46,null,"Ativo",""],
["COMP-13861","Componentes","Placa Carga Xiaomi Note 12 4G","Xiaomi","Note 12 4G · AAA",27.90,25.11,5.58,null,"Ativo",""],
["COMP-11481","Componentes","Placa Carga Realme C11/C12/C15","Realme","C11 · C12 · C15 2020",29.80,26.82,5.96,null,"Ativo",""],
["COMP-325","Componentes","Flex Power Samsung A10/M10","Samsung","A10 · M10",20,18,1.29,null,"Ativo",""],
["COMP-366","Componentes","Flex Power Samsung A02/A32/M32","Samsung","A02 · A32 4G · M32",20,18,1.25,null,"Ativo",""],
["COMP-11281","Componentes","Flex Power Xiaomi Note 11 4G/11S","Xiaomi","Note 11 4G · Note 11S · M4 Pro 4G",20,18,1.52,null,"Ativo",""],
["COMP-11283","Componentes","Flex Power Xiaomi Note 12 4G","Xiaomi","Note 12 4G",20,18,1.63,null,"Ativo",""],
["COMP-412","Componentes","Lente Câmera Samsung A20S","Samsung","A20S",20,18,1.00,null,"Ativo",""],
["COMP-442","Componentes","Lente Câmera Samsung A10S","Samsung","A10S",20,18,1.00,null,"Ativo",""],
["COMP-478","Componentes","Lente Câmera Samsung A22","Samsung","A22",20,18,1.60,null,"Ativo",""],
["COMP-521","Componentes","Lente Câmera Samsung A32","Samsung","A32",20,18,1.45,null,"Ativo",""],
["COMP-3275","Componentes","Lente Câmera Redmi Note 11 4G","Redmi","Note 11 4G",20,18,1.08,null,"Ativo",""],
["COMP-1478","Componentes","Conector Solto G4/G4 Plus","Motorola","G4 · G4 Plus · Mín 10 pcs",20,18,1.00,null,"Ativo",""],
["COMP-1486","Componentes","Conector Solto G7/G7 Plus","Motorola","G7 · G7 Plus · Mín 5 pcs",20,18,1.00,null,"Ativo",""],
["COMP-1490","Componentes","Conector Solto Tablet DL","Outros","Tablet DL · Mín 10 pcs",20,18,1.00,null,"Ativo",""],
["COMP-1500","Componentes","Conector Solto J5/J7/J4","Samsung","J5 · J5Pro · J7 · J4",20,18,1.00,null,"Ativo",""],
["COMP-1507","Componentes","Conector Solto K4 2017","Outros","K4 2017",20,18,1.00,null,"Ativo",""],
["COMP-1513","Componentes","Conector Solto J2 Prime/G530/J7 Neo","Samsung","J2 Prime · G530 · J7 Metal · J7 Neo",20,18,1.00,null,"Ativo",""],
["COMP-1521","Componentes","Conector Solto G5S","Motorola","G5S",20,18,1.00,null,"Ativo",""],
["COMP-1523","Componentes","Conector Solto K11/K11 Plus","Outros","K11 · K11 Plus",20,18,1.00,null,"Ativo",""],
["COMP-1526","Componentes","Conector Solto A20/A30/M10","Samsung","A20 · A30 · M10",20,18,1.00,null,"Ativo",""],
["COMP-8686","Componentes","Conector Solto A10S","Samsung","A10S",20,18,1.00,null,"Ativo",""],
["COMP-3306","Componentes","Tampa Samsung A32 4G Azul","Samsung","A32 4G · Azul",48.50,43.65,9.70,null,"Ativo",""],
["COMP-4327","Componentes","Tampa Samsung A02 Vermelha","Samsung","A02 · Vermelha",48.50,43.65,9.70,null,"Ativo",""],
["COMP-8531","Componentes","Tampa Samsung A03 Core Preto","Samsung","A03 Core · Preto",48.25,43.43,9.65,null,"Ativo",""],
["COMP-10754","Componentes","Tampa Samsung A02 Azul","Samsung","A02 · Azul",49.75,44.78,9.95,null,"Ativo",""],
["COMP-10782","Componentes","Tampa Samsung A03 Core Vermelho","Samsung","A03 Core · Vermelho",54.60,49.14,10.92,null,"Ativo",""],
["COMP-8714","Componentes","Tampa Samsung A13 Branco","Samsung","A13 · Branco",47.45,42.71,9.49,null,"Ativo",""],
["COMP-8715","Componentes","Tampa Samsung A13 Preto","Samsung","A13 · Preto",42.70,38.43,8.54,null,"Ativo",""],
["COMP-11495","Componentes","Tampa Samsung A13 Azul","Samsung","A13 · Azul",30.50,27.45,6.10,null,"Ativo",""],
["COMP-10713","Componentes","Tampa Samsung A23 Branca","Samsung","A23 · Branca",32.65,29.39,6.53,null,"Ativo",""],
["COMP-10714","Componentes","Tampa Samsung A23 Preta","Samsung","A23 · Preta",32.65,29.39,6.53,null,"Ativo",""],
["COMP-12451","Componentes","Tampa Samsung A23 4G Azul","Samsung","A23 4G · Azul",37.25,33.53,7.45,null,"Ativo",""],
["COMP-13900","Componentes","Tampa Samsung A02 Cinza c/ Lente","Samsung","A02 · Cinza · Com lente da câmera",49.75,44.78,9.95,null,"Ativo",""],
["COMP-11062","Componentes","Tampa Samsung A14 5G Preto","Samsung","A14 5G · Preto",59.90,53.91,11.98,null,"Ativo",""],
["COMP-11063","Componentes","Tampa Samsung A14 5G Verde","Samsung","A14 5G · Verde",57.55,51.80,11.51,null,"Ativo",""],
["COMP-11064","Componentes","Tampa Samsung A14 5G Cinza","Samsung","A14 5G · Cinza",59.90,53.91,11.98,null,"Ativo",""],
["COMP-11635","Componentes","Tampa Redmi Note 12 4G Verde","Redmi","Note 12 4G · Verde",46.40,41.76,9.28,null,"Ativo",""],
["COMP-11679","Componentes","Tampa Xiaomi Redmi Note 12 4G Preta","Xiaomi","Note 12 4G · Preta",52.15,46.94,10.43,null,"Ativo",""],
["COMP-11843","Componentes","Tampa Redmi Note 11G Branco","Redmi","Note 11G · Branco",54.45,49.01,10.89,null,"Ativo",""],
["COMP-10978","Componentes","Botão Carcaça Samsung A10/M10","Samsung","A10 · M10",20,18,1.00,null,"Ativo",""],
["COMP-10997","Componentes","Botão Carcaça Redmi Note 11","Redmi","Note 11",20,18,1.08,null,"Ativo",""],
["COMP-13869","Componentes","Botão Carcaça Samsung A23","Samsung","A23",20,18,1.49,null,"Ativo",""],
["COMP-13871","Componentes","Botão Carcaça Samsung A02","Samsung","A02",20,18,0.72,null,"Ativo",""],
["COMP-14663","Componentes","Botão Carcaça Samsung A22 4G","Samsung","A22 4G",20,18,1.29,null,"Ativo",""],
["COMP-14666","Componentes","Botão Carcaça Samsung A325","Samsung","A325",20,18,1.00,null,"Ativo",""],
["COMP-14735","Componentes","Botão Carcaça Redmi Note 12 4G","Redmi","Note 12 4G",20,18,1.00,null,"Ativo",""],
["COMP-5385","Componentes","Campainha/Alto Falante A02S/A03S","Samsung","A02S · A03S · Mín 5 pcs",20,18,2.39,null,"Ativo",""],
["COMP-8423","Componentes","Campainha/Alto Falante Multi Samsung","Samsung","A12·A10·A20·A02·A14·A22·A32·A21S",22.55,20.30,4.51,null,"Ativo",""],
["COMP-15001","Componentes","Placa Carga Samsung A04","Samsung","A04 · AAA",29,26.1,7.13,null,"Ativo",""],
["COMP-15002","Componentes","Placa Carga Samsung A04S","Samsung","A04S · AAA",24,21.6,5.94,null,"Ativo",""],
["COMP-15003","Componentes","Placa Carga Samsung A05","Samsung","A05 · AAA",21,18.9,5.15,null,"Ativo",""],
["COMP-15004","Componentes","Placa Carga Samsung A05S","Samsung","A05S · AAA",24,21.6,5.92,null,"Ativo",""],
["COMP-15005","Componentes","Placa Carga Samsung A06","Samsung","A06 · AAA",21,18.9,5.13,null,"Ativo",""],
["COMP-15006","Componentes","Placa Carga Samsung A13 5G","Samsung","A13 5G · AAA",48,43.2,11.85,null,"Ativo",""],
["COMP-15007","Componentes","Placa Carga Samsung A24 4G","Samsung","A24 4G · Mecânico AAA",27,24.3,6.57,null,"Ativo",""],
["COMP-15008","Componentes","Placa Carga Samsung A25","Samsung","A25 · AAA",20,18.0,4.91,null,"Ativo",""],
["COMP-15009","Componentes","Placa Carga Samsung A33 4G","Samsung","A33 4G · AAA",52,46.8,12.93,null,"Ativo",""],
["COMP-15010","Componentes","Placa Carga Samsung A34 4G","Samsung","A34 4G · AAA",44,39.6,10.85,null,"Ativo",""],
["COMP-15011","Componentes","Campainha/Alto Falante A03 Core","Samsung","A03 Core",33,29.7,8.13,null,"Ativo",""],
["BAT-SA-A13-5G","Componentes","Bateria Samsung A13 5G / M13","Samsung","A13 5G · M13 4G · M13 5G · GE-121",138,124.2,34.43,null,"Ativo",""],
["PC-SA-A10S","Peças/Frontais","Frontal Samsung A10S","Samsung","China Sem Aro WK · Cód:K2085",120,108,56.27,null,"Ativo",""],
["PC-RD-N11A","Peças/Frontais","Frontal Redmi Note 11/11S/12S Com Aro","Redmi","Com Aro WK · Cód:K6006",120,108,75.30,null,"Ativo",""],
["ENC-SA-A07","Encomenda","Samsung Galaxy A07 128GB","Samsung","128GB · 4GB RAM · Câm 50MP · Tela 6.7 · 4G",853,767.7,699.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-SA-A36-5G","Encomenda","Samsung Galaxy A36 5G 128GB","Samsung","128GB · 6GB RAM · Super AMOLED · Snapdragon · NFC",1646,1481.4,1349.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-SA-A57-5G","Encomenda","Samsung Galaxy A57 5G 256GB","Samsung","256GB · 8GB RAM · Câm 50MP · IP68 · AMOLED 6.7",3415,3073.5,2799.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-AP-IP15-256","Encomenda","iPhone 15 256GB","Apple","256GB · A16 Bionic · Dynamic Island · USB-C · Câm 48MP",6099,5489.1,4999.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-MT-G67-5G","Encomenda","Moto G67 5G 256GB","Motorola","256GB · 12GB RAM · Câm 50MP Sony · AMOLED 120Hz",2439,2195.1,1999.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-MT-G77-5G","Encomenda","Moto G77 5G 256GB","Motorola","256GB · 24GB RAM · Câm 108MP · AMOLED 1.5K 120Hz",2805,2524.5,2299.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-RD-N15-4G","Encomenda","Redmi Note 15 4G 256GB","Xiaomi","256GB · 8GB RAM · Câm 108MP · AMOLED 120Hz · 6000mAh",2073,1865.7,1699.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-RD-N15-PRO","Encomenda","Redmi Note 15 Pro 4G 256GB","Xiaomi","256GB · 12GB RAM · Câm 200MP · Helio G200-Ultra · Global",2439,2195.1,1999.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-PO-M8P","Encomenda","Poco M8 Pro 5G 256GB","Poco","256GB · 8GB RAM · 5G · NFC · Global",2439,2195.1,1999.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-PO-X7P","Encomenda","Poco X7 Pro 5G 256GB","Poco","256GB · 8GB RAM · Dimensity 8400 · AMOLED 120Hz · Global",2622,2359.8,2149.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-PO-X8P-512","Encomenda","Poco X8 Pro 512GB 5G","Poco","512GB · 8GB RAM · NFC · 5G · Global · c/ NF",3415,3073.5,2799.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-PO-X8PM-256","Encomenda","Poco X8 Pro Max 256GB 5G","Poco","256GB · 12GB RAM · Dimensity 9500s · 8500mAh · Global",3171,2853.9,2599.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-PO-X8PM-512","Encomenda","Poco X8 Pro Max 512GB 5G","Poco","512GB · 12GB RAM · Dimensity 9500s · 8500mAh · Global",4269,3842.1,3499.0,null,"Ativo","Encomenda · 5 dias"],
["ENC-TAB-S10FE","Encomenda","Samsung Tab S10 FE 128GB WiFi","Samsung","128GB · 8GB RAM · Tela 10.9 90Hz · Android 15 · S Pen + Capa",3593,3233.7,2945.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-XI-PADX1","Encomenda","Xiaomi Poco Pad X1 512GB","Xiaomi","512GB · 8GB RAM · LCD 11.2 · Bateria 8850mAh · Global",3038,2734.2,2490.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-RD-PAD2","Encomenda","Xiaomi Redmi Pad 2 256GB","Xiaomi","256GB · 8GB RAM · Lançamento 2026 · Global",1585,1426.5,1299.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-TCL-50Q","Encomenda","Smart TV TCL 50\" QLED 4K","TCL","50\" · QLED · Google TV · AiPQ · Dolby Atmos",2561,2304.9,2099.0,null,"Ativo","Encomenda · 10 dias"],
["ENC-JBL-BB4","Encomenda","JBL Boombox 4 Bluetooth","JBL","210W · IP68 · Bivolt · Auracast · 24h bateria",3415,3073.5,2799.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-JBL-EE2","Encomenda","JBL Encore Essential 2 100W","JBL","100W · Bluetooth · RGB · Bateria 15h",1463,1316.7,1199.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-AIW-BB200","Encomenda","AIWA Boombox Plus 200W","AIWA","200W · Bluetooth · 30h · IP66 · AWS-BBS-01-B",1097,987.3,899.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-HW-FIT5P","Encomenda","Huawei Watch Fit 5 Pro","Huawei","AMOLED 1.92 · ECG · GPS · 64GB · FullView",1585,1426.5,1299.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-ACR-NV15","Encomenda","Notebook Acer Nitro V15 Gamer","Acer","i5 · 16GB RAM · 512GB SSD · RTX 4050 6GB · 15.6 FHD 165Hz",6099,5489.1,4999.0,null,"Ativo","Encomenda · 10 dias"],
["ENC-ELX-AF3L","Encomenda","Air Fryer Electrolux 3L Rita Lobo","Electrolux","3L · 1200W · Desligamento Automático · EAF05 · 220V",463,416.7,379.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-BRI-AF5L","Encomenda","Air Fryer Britânia 5,5L BFR50","Britânia","5.5L · 1500W · Antiaderente Redstone · 220V",402,361.8,329.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-FAC-AF3L","Encomenda","Air Fryer Facilita Fry 3L","Elgin","3L · 1400W · Air Circuit 360° · Preta · 220V",292,262.8,239.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-WAP-VPZ","Encomenda","Vaporizador WAP WAPORE FAST 1250","WAP","1250W · 200ml · Com Escova",426,383.4,349.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-PAN-5PC","Encomenda","Jogo de 5 Panelas","Diversos","5 peças · Fundo triplo · Antiaderente",304,273.6,249.0,null,"Ativo","Encomenda · 10 dias"],
["ENC-SA-AC12K","Encomenda","Ar Cond Samsung Windfree 12000 BTU","Samsung","12.000 BTU · Inverter · Hi Wall · Sem Vento · WiFi · 220V",3468,3121.2,2842.0,null,"Ativo","Encomenda · 15 dias"],
["ENC-TCL-AC18K","Encomenda","Ar Cond TCL T-Pro 2.0 18000 BTU","TCL","18.000 BTU · Inverter 2.0 · R-32 · QF · Branco",2927,2634.3,2399.0,null,"Ativo","Encomenda · 15 dias"],
["ENC-CAD-GAMER","Encomenda","Cadeira Gamer Ergonômica 150kg","Diversos","Reclinável · Tecido · 150kg · Lombar + Pés · Base Metálica",975,877.5,799.0,null,"Ativo","Encomenda · 10 dias"],
["ENC-HDR-ZEUS","Encomenda","Headset Gamer Redragon Zeus Lite","Redragon","Fio · RGB · Drivers 50mm · Preto",219,197.1,179.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-TEC-THAR","Encomenda","Teclado Mecânico Mancer Tharix","Mancer","ABNT2 · Rainbow · Switch Vermelho · Anti-Ghost",365,328.5,299.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-MCS-510","Encomenda","Câmera Mercusys MC510 WiFi 2K","TP-Link","2K · Pan/Tilt 360° · IP65 · Externo · WiFi",194,174.6,159.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-TEN-MAT","Encomenda","Tênis Matteo Classic Ease","Matteo","Couro · Masculino · Casual · Preto · Nr 37-45",304,273.6,249.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-CHN-UA","Encomenda","Chinelo Under Armour Core 2","Under Armour","Unissex · EVA · Anatômico",182,163.8,149.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-LAN-TNT","Encomenda","La Nuit Trésor Lancôme EDP 30ml","Lancôme","EDP · 30ml · Feminino",487,438.3,399.0,null,"Ativo","Encomenda · 7 dias"],
["ENC-LAN-IDOL","Encomenda","Idôle Lancôme EDT 100ml","Lancôme","EDT · 100ml · Feminino · Floral-Fresco",609,548.1,499.0,null,"Ativo","Encomenda · 7 dias"]
];

/* ================= ESTADO GLOBAL ================= */
let CATALOGO = [];           // [{c,cat,n,m,e,p,pix,custo,estq,st,obs}]
let carrinho = [];           // [{prod, q, manual}]
let forma = 'PIX';
let catSel = 'Todas';
let mostrarLucro = false;
let ultimaVenda = null;

const LS_VENDAS='ss09_vendas', LS_ESTQ='ss09_estoque', LS_CACHE='ss09_cat_cache', LS_ZAP='ss09_zap';
const ls = k => { try{return JSON.parse(localStorage.getItem(k))}catch(e){return null} };
const lsSet = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const fmt = n => (n==null||isNaN(n)) ? '—' : n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const r2 = n => Math.round(n*100)/100;
const esc = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ================= LEITURA DA PLANILHA POR NOME DE ABA (compartilhado) =================
   Buscar por NOME de aba em vez de gid: gid não é estável (muda se o arquivo for convertido/
   recriado, como já aconteceu uma vez). Usado tanto pelo catálogo principal quanto por
   Capinhas/Películas. */
const normHeader = s => String(s||'').toLowerCase()
  .replace(/[áàâã]/g,'a').replace(/[éê]/g,'e').replace(/í/g,'i')
  .replace(/[óôõ]/g,'o').replace(/ú/g,'u').replace(/ç/g,'c').trim();

async function fetchCSVPorNomeAba(nomes){
  for(const nome of nomes){
    const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(nome)}`;
    try{
      const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),9000);
      const resp=await fetch(url,{signal:ctl.signal,cache:'no-store'});
      clearTimeout(t);
      if(!resp.ok){ console.warn('[planilha] aba "'+nome+'" respondeu HTTP '+resp.status); continue; }
      const txt=await resp.text();
      if(/^\s*<(!DOCTYPE|html)/i.test(txt)){ console.warn('[planilha] aba "'+nome+'" retornou HTML em vez de CSV (nome errado, permissão, ou arquivo nao convertido p/ Google Sheets?)'); continue; }
      return {texto:txt, nome}; // "nome" = título exato da aba, usado depois p/ escrever de volta (Tarefa 4)
    }catch(e){ console.warn('[planilha] falha ao buscar aba "'+nome+'":', e.message); }
  }
  return null;
}

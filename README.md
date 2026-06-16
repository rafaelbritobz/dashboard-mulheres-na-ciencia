# Mulheres na Ciência - Dashboard

Um painel interativo desenvolvido em React e Vite para análise analítica e estatística dos dados de bolsistas de Produtividade em Pesquisa (PQ) do CNPq. O projeto mapeia a distribuição de gênero e identifica disparidades, concentrações geográficas (polos) e de excelência científica (elite).

## 🚀 Como Executar o Projeto

### Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### Passos para Inicialização

1. **Instalar as dependências:**
   
   ```bash
   npm install --legacy-peer-deps
   ```
   
   *(Nota: O parâmetro `--legacy-peer-deps` é recomendado para compatibilidade de dependências do ecossistema de mapas e gráficos).*

2. **Configurar variáveis de ambiente (Opcional):**
   Caso utilize integração com inteligência artificial, configure o arquivo `.env` baseado no arquivo `.env.example`.

3. **Iniciar o servidor de desenvolvimento:**
   
   ```bash
   npm run dev
   ```

4. **Compilar para produção:**
   
   ```bash
   npm run build
   ```

## 🛠️ Tecnologias Utilizadas

* **React 19**
* **Vite**
* **Tailwind CSS** (estilização moderna e responsiva)
* **Recharts** (gráficos estatísticos e tornado)
* **React Simple Maps** (mapa interativo de distribuição regional)
* **PapaParse** (processamento de dados CSV)

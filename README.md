# Preferenza · Inteligência Comercial

Código do painel comercial da Preferenza, com **dados demonstrativos**. O dashboard privado de produção e suas bases de vendas, metas e custos não fazem parte deste repositório público.

## Executar localmente

Requer Node.js e Python 3.

```bash
npm test
npm run build
npm start
```

Abra `http://localhost:3000`. A referência inicial é sintética. O botão **Importar planilha** permite usar um arquivo local; a importação fica no IndexedDB do navegador e não é enviada a um servidor. Use **Minha base de dados → Restaurar referência** para voltar aos dados de demonstração.

## Estrutura

- `public/app.mjs`, `engine.mjs`, `phase3.mjs` e `goals-2026.mjs`: interface, cálculos e importadores.
- `public/demo.mjs` e `reference-data.mjs`: referência fictícia para execução pública.
- `public/block-export.mjs`: exportação dos blocos em PNG/PDF no navegador.
- `scripts/build.mjs`: cópia de `public/` para `dist/`.
- `tests/engine.test.mjs` e `tests/fixtures/`: testes e planilhas sintéticas.

O filtro de mês, perfil, UF, formato e grupo afeta indicadores, gráfico e tabela. O gráfico mostra valores nas barras e desvio percentual entre a referência e o realizado. Um `*` sinaliza desvio indicativo quando a meta tem pendências; isso não homologa o atingimento.

## Privacidade e implantação

Este repositório **não** contém as bases reais, os controles por CNPJ, o histórico Git do Site nem credenciais de hospedagem. Não adicione arquivos ERP, planilhas de metas/custos ou módulos gerados com dados privados. O `.gitignore` bloqueia caminhos comuns, mas revise qualquer commit antes de enviar. Um servidor local não reproduz a autenticação do dashboard privado.

As bibliotecas SheetJS CE e html2canvas e as fontes DejaVu são distribuídas com suas licenças em `public/vendor/` e `public/assets/`.

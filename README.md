# ER Studio

Modelador visual de diagramas Entidade-Relacionamento inspirado em ferramentas como dbdiagram.io e diagrams.net. O projeto funciona diretamente no navegador, sem dependências externas.

## Como executar

1. Extraia o arquivo ZIP.
2. Abra `index.html` no navegador.

Também é possível iniciar um servidor local:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Funcionalidades

- Criar, editar, duplicar e excluir tabelas.
- Definir campos, tipos, chave primária, `NOT NULL`, `UNIQUE`, `DEFAULT` e valores `ENUM`.
- Escolher uma cor personalizada para o cabeçalho de cada tabela.
- Arrastar tabelas no canvas.
- Relacionamentos 1:1, 1:N e N:N, com edição por duplo clique.
- Destaque animado de campos, linhas, sentido da referência e cardinalidades.
- Zoom, movimentação da tela e organização automática.
- Busca por tabela, campo, tipo, valor padrão ou enumeração.
- Desfazer e refazer alterações.
- Persistência automática no `localStorage`.
- Backup externo automático em arquivo TXT vinculado pelo usuário.
- Restauração do diagrama a partir de backup `.txt` mesmo após limpeza do cache.
- Tema claro e escuro.
- Botão **Ajuda** com manual de instruções integrado e atalho `F1`.
- Importação de projeto JSON ou backup TXT.
- Inclusão de tabelas por código SQL nativo.
- Lista lateral de tabelas com editor individual de `CREATE TABLE`.
- Importação em modo **adicionar** ou **substituir**.
- Exportação para JSON, SQL, SVG, HTML independente e backup TXT.
- Geração de SQL para Oracle, PostgreSQL e MySQL.

## Importação de SQL nativo

Use o botão **SQL nativo** da barra de ferramentas ou abra **Importar → SQL nativo**. Escolha se deseja adicionar as tabelas ao diagrama atual ou substituir o projeto e cole o DDL.

O parser reconhece:

- `CREATE TABLE`, com ou sem esquema.
- Identificadores entre aspas duplas, crases ou colchetes.
- Tipos com parâmetros, como `NUMBER(12,2)` e `VARCHAR(150)`.
- Identidade Oracle/PostgreSQL e `AUTO_INCREMENT` MySQL.
- Chaves primárias declaradas na coluna ou como restrição da tabela.
- `NOT NULL`, `UNIQUE` e expressões `DEFAULT`.
- `ENUM('VALOR_1', 'VALOR_2')` do MySQL.
- Restrições `CHECK (CAMPO IN (...))` usadas como enumeração em Oracle e PostgreSQL.
- Chaves estrangeiras com `REFERENCES` na coluna.
- Chaves estrangeiras declaradas com `CONSTRAINT ... FOREIGN KEY`.
- Chaves estrangeiras adicionadas posteriormente com `ALTER TABLE`.
- Comentários SQL com `--` e `/* ... */`.

O arquivo `exemplo.sql` contém um script pronto para teste.

## ENUM e DEFAULT

No editor visual, cada campo possui as colunas **Default** e **ENUM**.

- Em **Default**, informe a expressão usada após `DEFAULT`, como `'ATIVO'`, `0`, `SYSDATE` ou `CURRENT_TIMESTAMP`.
- Em **ENUM**, informe os valores permitidos separados por vírgula.
- Valores entre aspas são aceitos, inclusive com espaços.

No diagrama, campos enumerados recebem a indicação `ENUM` e campos com valor padrão recebem a indicação `DEFAULT`. Ao posicionar o mouse sobre o campo, são exibidos os valores permitidos e o valor padrão.

Na geração SQL:

- MySQL usa `ENUM(...)`.
- Oracle e PostgreSQL usam `CHECK (CAMPO IN (...))`.
- `DEFAULT` é preservado nos três dialetos.

## Destaque das ligações

Clique em qualquer campo que participe de um relacionamento. O ER Studio destaca:

- O campo selecionado.
- Todos os campos ligados a ele.
- As linhas correspondentes.
- As cardinalidades.
- A direção da referência, com seta da chave estrangeira para a chave referenciada.

As linhas usam espessura visual constante durante zoom e movimentação.

## Editor SQL por tabela

Na lista lateral, um clique centraliza a tabela no diagrama e dois cliques abrem o editor individual.

O editor aceita exatamente um `CREATE TABLE` e comandos `ALTER TABLE` referentes à própria tabela. Campos que mantêm o mesmo nome preservam o identificador interno, evitando a perda de relacionamentos de entrada.

## Menu da tabela

Clique em `⋮` no cabeçalho para acessar:

- **Editar tabela**.
- **Editar script SQL**.
- **Editar relacionamento**.
- **Mudar cor do título**.
- **Duplicar**.
- **Excluir tabela**.

Quando a tabela possui mais de um relacionamento, o sistema exibe uma lista para escolha.

## Exportação HTML

A opção **Exportar → Página HTML final** cria um arquivo `.html` único, sem dependências externas, contendo:

- O diagrama completo.
- Cores personalizadas.
- Zoom e ajuste à tela.
- Movimentação com o mouse.
- Tema claro e escuro.
- Tooltips com `ENUM` e `DEFAULT`.

## Observações

Relacionamentos N:N são mantidos visualmente. Na geração SQL, o sistema informa que é necessária uma tabela associativa.

Restrições compostas são importadas, mas o editor representa `UNIQUE` e `PRIMARY KEY` no nível de cada campo. Revise o SQL gerado antes de utilizá-lo em produção quando o modelo possuir regras compostas complexas.


## Backup externo em TXT

O ER Studio continua salvando o projeto automaticamente no `localStorage`, mas também pode manter uma cópia fora do cache do navegador.

1. Clique em **Backup TXT**.
2. Selecione **Vincular arquivo TXT**.
3. Escolha a pasta e o nome do arquivo.
4. Após a vinculação, cada alteração concluída no diagrama é gravada automaticamente no TXT.

O arquivo contém o projeto completo: tabelas, campos, posições, cores, `DEFAULT`, `ENUM` e relacionamentos.

Caso o cache ou os dados do site sejam apagados, abra novamente **Backup TXT** e use **Restaurar outro backup TXT**. Se o navegador ainda lembrar o vínculo, use **Restaurar arquivo vinculado**.

> A gravação direta exige um navegador compatível com a File System Access API, normalmente Google Chrome ou Microsoft Edge em `localhost` ou HTTPS. Em outros navegadores, utilize **Baixar cópia TXT** periodicamente.


## Camada de mensagens

As mensagens de sucesso, erro e aviso são movidas automaticamente para o `<dialog>` que estiver aberto. Isso faz com que permaneçam acima do fundo transparente dos modais nativos do navegador. Ao fechar a janela, o contêiner de mensagens volta para o `body`.

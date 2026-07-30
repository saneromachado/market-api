# Catálogo de cenários para estudo

Os testes iniciais cobrem o caminho principal e alguns erros importantes. Esta
lista serve como roteiro de evolução.

| Área         | Cenário sugerido                                | Resultado esperado                  |
| ------------ | ----------------------------------------------- | ----------------------------------- |
| Autenticação | E-mail inexistente                              | `401` sem revelar qual campo falhou |
| Autenticação | Token alterado ou expirado                      | `401`                               |
| Categoria    | Nome repetido                                   | `409`                               |
| Produto      | Buscar parte do nome sem diferenciar maiúsculas | Item encontrado                     |
| Produto      | Paginar com `limit=2`                           | Metadados e duas linhas             |
| Produto      | Código de barras repetido                       | `409`                               |
| Produto      | Categoria inexistente                           | `404`                               |
| Estoque      | Saída maior que o saldo                         | `400` e saldo preservado            |
| Estoque      | Ajustar saldo para zero                         | Movimento e saldo zero              |
| Estoque      | Produto abaixo do mínimo                        | Presente em `/low-stock`            |
| Venda        | Dois itens, um sem saldo                        | Nada vendido e estoques preservados |
| Venda        | Produto repetido no payload                     | `400`                               |
| Venda        | Desconto maior que subtotal                     | `400`                               |
| Venda        | Produto inativo                                 | `400`                               |
| Venda        | Cancelar duas vezes                             | Apenas uma devolução ao estoque     |
| Contrato     | UUID inválido na URL                            | `400`                               |
| Contrato     | Campo extra no JSON                             | `400`                               |
| Concorrência | Duas vendas disputam a última unidade           | Apenas uma conclui                  |

## Exemplo de teste adicional

```ts
test('não permite saída maior que o saldo', async ({ request }) => {
  const response = await request.post('/inventory/movements', {
    headers,
    data: {
      productId,
      type: 'EXIT',
      quantity: 999,
      reason: 'Tentativa inválida',
    },
  });

  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    message: 'Estoque insuficiente para esta saída',
  });
});
```

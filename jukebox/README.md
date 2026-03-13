# 🎵 Music Queue — Sistema de Fila de Pedidos

Backend Spring Boot 3 + Java 21 para gerenciamento de fila de pedidos de músicas em ambiente local.

---

## ▶️ Como rodar

```bash
# Clonar / entrar na pasta
cd music-queue

# Rodar
./mvnw spring-boot:run

# O servidor sobe em: http://localhost:8080
```

> **Requisito:** Java 21 instalado. O Maven Wrapper (`mvnw`) já está incluso.

---

## 🌐 Endpoints REST

### Totem (cliente)

| Método | URL | Descrição |
|--------|-----|-----------|
| `POST` | `/api/pedidos` | Fazer um pedido de música |

**Body do POST:**
```json
{
  "nomeCliente": "João",
  "tituloMusica": "Bohemian Rhapsody",
  "observacao": "pra minha esposa (opcional)"
}
```

---

### Painel do Operador

| Método | URL | Descrição |
|--------|-----|-----------|
| `GET` | `/api/pedidos` | Fila ativa (pendentes + aprovados + tocando) |
| `GET` | `/api/pedidos/pendentes` | Só os pedidos pendentes |
| `GET` | `/api/pedidos/{id}` | Buscar pedido específico |
| `POST` | `/api/pedidos/{id}/aprovar` | ✅ Aprovar pedido |
| `POST` | `/api/pedidos/{id}/rejeitar` | ❌ Rejeitar pedido |
| `POST` | `/api/pedidos/{id}/tocar` | ▶️ Marcar como tocando agora |
| `POST` | `/api/pedidos/{id}/concluir` | ✔️ Marcar como tocado (concluído) |

---

## 📡 WebSocket (tempo real)

**Endpoint de conexão:**
```
ws://localhost:8080/ws
```

**Tópicos para assinar:**

| Tópico | Quando é enviado | Payload |
|--------|-----------------|---------|
| `/topic/pedidos` | Novo pedido ou mudança de status | `{ tipo, pedido }` |
| `/topic/fila` | Qualquer mudança na fila | `[ ...pedidos ]` |

**Tipos de evento em `/topic/pedidos`:**
- `NOVO_PEDIDO` — chegou um novo pedido
- `STATUS_ATUALIZADO` — operador mudou o status de um pedido

**Exemplo com SockJS + STOMP (JavaScript):**
```javascript
const socket = new SockJS('http://localhost:8080/ws');
const client = Stomp.over(socket);

client.connect({}, () => {
    // Escuta novos pedidos
    client.subscribe('/topic/pedidos', (msg) => {
        const evento = JSON.parse(msg.body);
        console.log(evento.tipo, evento.pedido);
    });

    // Escuta atualização da fila completa
    client.subscribe('/topic/fila', (msg) => {
        const fila = JSON.parse(msg.body);
        console.log('Fila atualizada:', fila);
    });
});
```

---

## 🔄 Ciclo de vida de um pedido

```
PENDENTE ──▶ APROVADO ──▶ TOCANDO ──▶ TOCADO
    └──────────────────────────────▶ REJEITADO
```

---

## 📊 Status dos pedidos

| Status | Significado |
|--------|-------------|
| `PENDENTE` | Aguardando aprovação do operador |
| `APROVADO` | Aprovado, na fila pra tocar |
| `TOCANDO` | Tocando agora |
| `TOCADO` | Já foi tocado |
| `REJEITADO` | Rejeitado pelo operador |

---

## 🛠️ Extras

- **Console H2 (banco):** `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:file:./data/musicqueue`
  - Usuário: `sa` | Senha: *(vazio)*

- **Dados persistem** entre reinicializações (arquivo `./data/musicqueue.mv.db`)

---

## 📦 Estrutura do Projeto

```
src/main/java/com/musicqueue/
├── controller/
│   └── PedidoController.java      # Endpoints REST
├── model/
│   └── Pedido.java                # Entidade JPA
├── repository/
│   └── PedidoRepository.java      # Queries JPA
├── service/
│   └── PedidoService.java         # Lógica de negócio + WebSocket
├── dto/
│   └── PedidoDTO.java             # Records de request/response
└── config/
    ├── WebSocketConfig.java       # Config STOMP
    └── GlobalExceptionHandler.java
```

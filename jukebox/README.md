# 🎵 Jukebox — Sistema de Fila de Músicas

Sistema completo para gerenciamento de pedidos de músicas em tempo real, ideal para uso em restaurantes, bares ou eventos.

Desenvolvido com **Spring Boot (Java 21)** no backend e frontend integrado servido pela própria aplicação.

---

## 🚀 Como rodar o projeto

### Pré-requisitos

* Java 21 instalado

---

### ▶️ Executando

```bash
mvnw.cmd spring-boot:run
```

Ou via IntelliJ (Run Application)

---

### 🌐 Acesso

* Sistema:

```
http://localhost:8080
```

* Painel do operador:

```
http://localhost:8080/painel.html
```

* Cliente (totem):

```
http://localhost:8080/cliente.html
```

* Swagger (documentação da API):

```
http://localhost:8080/swagger-ui/index.html
```

---

## ⚙️ Configuração (IMPORTANTE)

Este projeto **não versiona credenciais**.

### 📄 Crie o arquivo:

```
application-local.properties
```

### 📝 Exemplo:

```properties
spring.datasource.url=jdbc:h2:file:./data/musicqueue
spring.datasource.username=sa
spring.datasource.password=

youtube.api.key=SUA_CHAVE_AQUI
```

---

## 🔒 Segurança

* O arquivo `application-local.properties` está no `.gitignore`
* O banco H2 (`/data`) não é versionado
* Cada desenvolvedor usa suas próprias credenciais

---

## 📡 Funcionalidades

* ✅ Fila de músicas em tempo real
* ✅ Atualização via WebSocket
* ✅ Painel do operador
* ✅ Interface para clientes
* ✅ Integração com YouTube
* ✅ Histórico de pedidos
* ✅ Persistência local com H2

---

## 🔄 Fluxo dos pedidos

```
PENDENTE → APROVADO → TOCANDO → TOCADO
        ↘ REJEITADO
```

---

## 🧠 Arquitetura

* Backend: Spring Boot
* Comunicação: REST + WebSocket (STOMP)
* Banco: H2 persistente (arquivo local)
* Frontend: HTML/CSS/JS servido pelo Spring

---

## 🌐 Uso em rede (restaurante)

Para acessar de outros dispositivos na mesma rede:

1. Descubra o IP do servidor:

```
ipconfig
```

2. Acesse via navegador:

```
http://SEU_IP:8080/cliente.html
```

---

## 📦 Estrutura do projeto

```
jukebox/
├── music-queue/
│   ├── src/main/java/com/musicqueue/
│   └── src/main/resources/
│       ├── static/
│       └── application.properties
```

---

## 🚧 Próximas melhorias

* Autenticação de operador
* Migração para banco relacional (PostgreSQL)

---

## 📌 Observações

Este projeto faz parte de um sistema maior de gerenciamento para restaurantes, integrado ao módulo de cardápio.

package com.musicqueue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicqueue.dto.PedidoDTO.NovoPedidoRequest;
import com.musicqueue.model.Pedido;
import com.musicqueue.repository.PedidoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PedidoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PedidoRepository pedidoRepository;

    @BeforeEach
    void limpar() {
        pedidoRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve criar um pedido com sucesso")
    void deveCriarPedido() throws Exception {
        var request = new NovoPedidoRequest("João", "Bohemian Rhapsody", "pra minha esposa");

        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nomeCliente").value("João"))
                .andExpect(jsonPath("$.tituloMusica").value("Bohemian Rhapsody"))
                .andExpect(jsonPath("$.status").value("PENDENTE"));
    }

    @Test
    @DisplayName("Deve rejeitar pedido sem nome do cliente")
    void deveRejeitarSemNome() throws Exception {
        var request = new NovoPedidoRequest("", "Bohemian Rhapsody", null);

        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nomeCliente").exists());
    }

    @Test
    @DisplayName("Fluxo completo: criar → aprovar → tocar → concluir")
    void fluxoCompleto() throws Exception {
        // 1. Criar pedido
        var request = new NovoPedidoRequest("Maria", "Hotel California", null);
        var resultado = mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        var body = objectMapper.readTree(resultado.getResponse().getContentAsString());
        long id = body.get("id").asLong();

        // 2. Aprovar
        mockMvc.perform(post("/api/pedidos/" + id + "/aprovar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APROVADO"))
                .andExpect(jsonPath("$.posicao").value(1));

        // 3. Marcar tocando
        mockMvc.perform(post("/api/pedidos/" + id + "/tocar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TOCANDO"));

        // 4. Concluir
        mockMvc.perform(post("/api/pedidos/" + id + "/concluir"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TOCADO"));
    }

    @Test
    @DisplayName("Deve listar a fila ativa")
    void deveListarFila() throws Exception {
        // Cria dois pedidos
        pedidoRepository.save(pedido("Ana", "Yesterday", Pedido.StatusPedido.PENDENTE));
        pedidoRepository.save(pedido("Carlos", "Stairway to Heaven", Pedido.StatusPedido.APROVADO));

        mockMvc.perform(get("/api/pedidos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    private Pedido pedido(String cliente, String musica, Pedido.StatusPedido status) {
        var p = new Pedido();
        p.setNomeCliente(cliente);
        p.setTituloMusica(musica);
        p.setStatus(status);
        return p;
    }
}

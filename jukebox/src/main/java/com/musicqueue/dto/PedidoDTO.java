package com.musicqueue.dto;

import com.musicqueue.model.Pedido;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class PedidoDTO {

    // ─── Request: cliente fazendo um pedido ───────────────────────────────────
    public record NovoPedidoRequest(
            @NotBlank(message = "Nome do cliente é obrigatório")
            @Size(max = 100, message = "Nome muito longo")
            String nomeCliente,

            @NotBlank(message = "Título da música é obrigatório")
            @Size(max = 200, message = "Título muito longo")
            String tituloMusica,

            @Size(max = 300, message = "Observação muito longa")
            String observacao
    ) {}

    // ─── Request: operador atualizando status ─────────────────────────────────
    public record AtualizarStatusRequest(
            @NotBlank(message = "Status é obrigatório")
            String status
    ) {}

    // ─── Response: pedido serializado ────────────────────────────────────────
    public record PedidoResponse(
            Long id,
            String nomeCliente,
            String tituloMusica,
            String observacao,
            String status,
            Integer posicao,
            LocalDateTime criadoEm
    ) {
        public static PedidoResponse from(Pedido p) {
            return new PedidoResponse(
                    p.getId(),
                    p.getNomeCliente(),
                    p.getTituloMusica(),
                    p.getObservacao(),
                    p.getStatus().name(),
                    p.getPosicao(),
                    p.getCriadoEm()
            );
        }
    }

    // ─── Evento WebSocket enviado ao painel ───────────────────────────────────
    public record EventoPedido(
            String tipo,        // NOVO_PEDIDO | STATUS_ATUALIZADO | FILA_ATUALIZADA
            PedidoResponse pedido
    ) {}
}

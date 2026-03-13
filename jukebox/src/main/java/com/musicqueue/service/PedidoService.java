package com.musicqueue.service;

import com.musicqueue.dto.PedidoDTO.*;
import com.musicqueue.model.Pedido;
import com.musicqueue.model.Pedido.StatusPedido;
import com.musicqueue.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ─── Cliente faz um pedido ────────────────────────────────────────────────

    @Transactional
    public PedidoResponse criarPedido(NovoPedidoRequest request) {
        var pedido = new Pedido();
        pedido.setNomeCliente(request.nomeCliente());
        pedido.setTituloMusica(request.tituloMusica());
        pedido.setObservacao(request.observacao());
        pedido.setStatus(StatusPedido.PENDENTE);

        pedido = pedidoRepository.save(pedido);
        log.info("Novo pedido criado: id={} cliente='{}' música='{}'",
                pedido.getId(), pedido.getNomeCliente(), pedido.getTituloMusica());

        var response = PedidoResponse.from(pedido);

        // Notifica o painel em tempo real
        notificarPainel("NOVO_PEDIDO", response);

        return response;
    }

    // ─── Operador atualiza status de um pedido ────────────────────────────────

    @Transactional
    public PedidoResponse atualizarStatus(Long id, AtualizarStatusRequest request) {
        var pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado: " + id));

        var novoStatus = StatusPedido.valueOf(request.status().toUpperCase());
        var statusAnterior = pedido.getStatus();

        validarTransicao(statusAnterior, novoStatus);

        pedido.setStatus(novoStatus);

        // Ao aprovar, coloca no final da fila
        if (novoStatus == StatusPedido.APROVADO) {
            int proxPosicao = pedidoRepository.findMaxPosicao().orElse(0) + 1;
            pedido.setPosicao(proxPosicao);
            log.info("Pedido id={} aprovado, posição na fila: {}", id, proxPosicao);
        }

        // Ao marcar como tocando, marca o anterior como tocado
        if (novoStatus == StatusPedido.TOCANDO) {
            pedidoRepository.findFirstByStatus(StatusPedido.TOCANDO).ifPresent(atual -> {
                atual.setStatus(StatusPedido.TOCADO);
                pedidoRepository.save(atual);
                log.info("Pedido id={} marcado como TOCADO", atual.getId());
            });
            log.info("Pedido id={} agora TOCANDO: '{}'", id, pedido.getTituloMusica());
        }

        pedido = pedidoRepository.save(pedido);
        var response = PedidoResponse.from(pedido);

        notificarPainel("STATUS_ATUALIZADO", response);
        notificarFilaCompleta(); // atualiza a fila inteira no painel

        return response;
    }

    // ─── Operador marca a música tocando como concluída ───────────────────────

    @Transactional
    public PedidoResponse marcarTocado(Long id) {
        var pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado: " + id));

        pedido.setStatus(StatusPedido.TOCADO);
        pedido = pedidoRepository.save(pedido);
        log.info("Pedido id={} marcado como TOCADO", id);

        var response = PedidoResponse.from(pedido);
        notificarPainel("STATUS_ATUALIZADO", response);
        notificarFilaCompleta();

        return response;
    }

    // ─── Consultas ────────────────────────────────────────────────────────────

    public List<PedidoResponse> listarFilaAtiva() {
        return pedidoRepository.findFilaAtiva()
                .stream()
                .map(PedidoResponse::from)
                .toList();
    }

    public List<PedidoResponse> listarPendentes() {
        return pedidoRepository.findByStatusOrderByCriadoEmAsc(StatusPedido.PENDENTE)
                .stream()
                .map(PedidoResponse::from)
                .toList();
    }

    public PedidoResponse buscarPorId(Long id) {
        return pedidoRepository.findById(id)
                .map(PedidoResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado: " + id));
    }

    // ─── Helpers privados ─────────────────────────────────────────────────────

    private void notificarPainel(String tipo, PedidoResponse pedido) {
        var evento = new EventoPedido(tipo, pedido);
        messagingTemplate.convertAndSend("/topic/pedidos", evento);
        log.debug("WebSocket enviado: tipo={} pedidoId={}", tipo, pedido.id());
    }

    private void notificarFilaCompleta() {
        var fila = listarFilaAtiva();
        messagingTemplate.convertAndSend("/topic/fila", fila);
    }

    private void validarTransicao(StatusPedido de, StatusPedido para) {
        boolean valida = switch (de) {
            case PENDENTE  -> para == StatusPedido.APROVADO || para == StatusPedido.REJEITADO;
            case APROVADO  -> para == StatusPedido.TOCANDO  || para == StatusPedido.REJEITADO;
            case TOCANDO   -> para == StatusPedido.TOCADO;
            case TOCADO, REJEITADO -> false;
        };

        if (!valida) {
            throw new IllegalStateException(
                    "Transição inválida: %s → %s".formatted(de, para));
        }
    }
}

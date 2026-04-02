package com.musicqueue.service;

import com.musicqueue.dto.PedidoDTO.*;
import com.musicqueue.model.PedidoModel;
import com.musicqueue.enums.StatusPedido;
import com.musicqueue.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final YoutubeService youtubeService;

    @Transactional
    public PedidoResponse criarPedido(NovoPedidoRequest request) {
        var pedido = new PedidoModel();
        pedido.setNomeCliente(request.nomeCliente());
        pedido.setTituloMusica(request.tituloMusica());
        pedido.setObservacao(request.observacao());

        var infoYoutube = youtubeService.buscarVideoCompleto(request.tituloMusica());
        if (infoYoutube != null) {
            pedido.setVideoId(infoYoutube.getId());
            pedido.setTituloYoutube(infoYoutube.getTitulo());
        }

        pedido.setStatus(StatusPedido.PENDENTE);
        pedido = pedidoRepository.save(pedido);

        log.info("Novo pedido criado: id={} cliente='{}'", pedido.getId(), pedido.getNomeCliente());

        var response = PedidoResponse.from(pedido);
        notificarPainel("NOVO_PEDIDO", response);
        return response;
    }

    @Transactional
    public PedidoResponse atualizarStatus(Long id, AtualizarStatusRequest request) {
        var pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));

        StatusPedido novoStatus = StatusPedido.valueOf(request.status());

        // SE O NOVO STATUS FOR TOCANDO, LIMPA O BANCO ANTES
        if (novoStatus == StatusPedido.TOCANDO) {
            pedidoRepository.finalizarMusicasAnteriores();
        }

        pedido.setStatus(novoStatus);

        if (novoStatus == StatusPedido.APROVADO) {
            Integer ultimaPosicao = pedidoRepository.findMaxPosicaoByStatus(StatusPedido.APROVADO);
            pedido.setPosicao(ultimaPosicao == null ? 1 : ultimaPosicao + 1);
        }

        pedido = pedidoRepository.save(pedido);

        // Automação se aprovou e não tem nada tocando
        if (novoStatus == StatusPedido.APROVADO) {
            boolean temAlgoTocando = pedidoRepository.existsByStatus(StatusPedido.TOCANDO);
            if (!temAlgoTocando) {
                tocarProximoNaFila();
            }
        }

        var response = PedidoResponse.from(pedido);
        notificarPainel("STATUS_ATUALIZADO", response);
        notificarFilaCompleta();
        return response;
    }

    @Transactional
    public void tocarProximoNaFila() {
        Optional<PedidoModel> proximo = pedidoRepository.findFirstByStatusOrderByPosicaoAsc(StatusPedido.APROVADO);

        if (proximo.isPresent()) {
            // LIMPA O BANCO ANTES DE DEFINIR O PRÓXIMO COMO TOCANDO
            pedidoRepository.finalizarMusicasAnteriores();

            PedidoModel pedido = proximo.get();
            pedido.setStatus(StatusPedido.TOCANDO);
            pedidoRepository.save(pedido);

            var response = PedidoResponse.from(pedido);
            notificarPainel("STATUS_ATUALIZADO", response);
            notificarFilaCompleta();
        }
    }

    @Transactional
    public PedidoResponse marcarTocado(Long id) {
        var pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado: " + id));

        pedido.setStatus(StatusPedido.TOCADO);
        pedido = pedidoRepository.save(pedido);

        log.info("Pedido id={} concluído.", id);

        var response = PedidoResponse.from(pedido);
        notificarPainel("STATUS_ATUALIZADO", response);

        // Quando uma música acaba, tenta puxar a próxima
        tocarProximoNaFila();
        notificarFilaCompleta();

        return response;
    }

    // ─── Consultas e Helpers ──────────────────────────────────────────────────

    public List<PedidoResponse> listarFilaAtiva() {
        return pedidoRepository.findFilaAtiva().stream().map(PedidoResponse::from).toList();
    }

    public List<PedidoResponse> listarPendentes() {
        return pedidoRepository.findByStatusOrderByCriadoEmAsc(StatusPedido.PENDENTE).stream().map(PedidoResponse::from).toList();
    }

    public PedidoResponse buscarPorId(Long id) {
        return pedidoRepository.findById(id).map(PedidoResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado: " + id));
    }

    private void notificarPainel(String tipo, PedidoResponse pedido) {
        var evento = new EventoPedido(tipo, pedido);
        messagingTemplate.convertAndSend("/topic/pedidos", evento);
    }

    private void notificarFilaCompleta() {
        var fila = listarFilaAtiva();
        messagingTemplate.convertAndSend("/topic/fila", fila);
    }
}
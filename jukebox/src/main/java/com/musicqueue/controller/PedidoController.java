package com.musicqueue.controller;

import com.musicqueue.dto.PedidoDTO.*;
import com.musicqueue.dto.YoutubeSearchResult;
import com.musicqueue.service.PedidoService;
import com.musicqueue.service.YoutubeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
//@CrossOrigin(origins = "http://127.0.0.1:5500")
public class PedidoController {

    private final PedidoService pedidoService;
    private final YoutubeService youtubeService;

    // ─── Totem: fazer um pedido ───────────────────────────────────────────────

    @PostMapping("/")
    public ResponseEntity<PedidoResponse> criarPedido(
            @Valid @RequestBody NovoPedidoRequest request) {
        var response = pedidoService.criarPedido(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─── Painel: listar fila ativa (pendentes + aprovados + tocando) ──────────

    @GetMapping("/")
    public ResponseEntity<List<PedidoResponse>> listarFilaAtiva() {
        return ResponseEntity.ok(pedidoService.listarFilaAtiva());
    }

    // ─── Painel: listar apenas pendentes ─────────────────────────────────────

    @GetMapping("/pendentes")
    public ResponseEntity<List<PedidoResponse>> listarPendentes() {
        return ResponseEntity.ok(pedidoService.listarPendentes());
    }

    // ─── Painel: buscar pedido específico ─────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<PedidoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.buscarPorId(id));
    }

    // ─── Painel: aprovar, rejeitar, iniciar, concluir ────────────────────────

    @PatchMapping("/{id}/status")
    public ResponseEntity<PedidoResponse> atualizarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarStatusRequest request) {
        var response = pedidoService.atualizarStatus(id, request);
        return ResponseEntity.ok(response);
    }

    // ─── Painel: atalho — marcar tocando ─────────────────────────────────────

    @PostMapping("/{id}/tocar")
    public ResponseEntity<PedidoResponse> tocar(@PathVariable Long id) {
        return ResponseEntity.ok(
                pedidoService.atualizarStatus(id, new AtualizarStatusRequest("TOCANDO")));
    }

    // ─── Painel: atalho — marcar como tocado (concluído) ─────────────────────

    @PostMapping("/{id}/concluir")
    public ResponseEntity<PedidoResponse> concluir(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.marcarTocado(id));
    }

    // ─── Painel: atalho — rejeitar ────────────────────────────────────────────

    @PostMapping("/{id}/rejeitar")
    public ResponseEntity<PedidoResponse> rejeitar(@PathVariable Long id) {
        return ResponseEntity.ok(
                pedidoService.atualizarStatus(id, new AtualizarStatusRequest("REJEITADO")));
    }

    // ─── Painel: atalho — aprovar ─────────────────────────────────────────────

    @PostMapping("/{id}/aprovar")
    public ResponseEntity<PedidoResponse> aprovar(@PathVariable Long id) {
        return ResponseEntity.ok(
                pedidoService.atualizarStatus(id, new AtualizarStatusRequest("APROVADO")));
    }

    @GetMapping("/youtube/buscar")
    public ResponseEntity<YoutubeSearchResult> buscar(@RequestParam String query) {
        YoutubeSearchResult resultado = youtubeService.buscarVideoId(query);
        if (resultado == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/proxima")
    public ResponseEntity<PedidoResponse> pularParaProxima() {
        List<PedidoResponse> filaAtiva = pedidoService.listarFilaAtiva();

        // 1. Finaliza a música atual
        filaAtiva.stream()
                .filter(p -> "TOCANDO".equals(p.status()))
                .findFirst()
                .ifPresent(p -> pedidoService.marcarTocado(p.id()));

        // 2. Busca a próxima música aprovada
        Optional<PedidoResponse> proxima = filaAtiva.stream()
                .filter(p -> "APROVADO".equals(p.status()))
                .findFirst();

        if (proxima.isPresent()) {
            // 3. Atualiza para TOCANDO e retorna os dados para o Frontend
            PedidoResponse atualizada = pedidoService.atualizarStatus(
                    proxima.get().id(),
                    new AtualizarStatusRequest("TOCANDO")
            );
            return ResponseEntity.ok(atualizada);
        }

        return ResponseEntity.noContent().build();
    }

}

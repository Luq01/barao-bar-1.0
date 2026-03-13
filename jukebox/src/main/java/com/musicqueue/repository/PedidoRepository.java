package com.musicqueue.repository;

import com.musicqueue.model.Pedido;
import com.musicqueue.model.Pedido.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    // Fila de pendentes ordenada por data de criação
    List<Pedido> findByStatusOrderByCriadoEmAsc(StatusPedido status);

    // Fila aprovada ordenada por posição
    List<Pedido> findByStatusOrderByPosicaoAsc(StatusPedido status);

    // Música tocando agora
    Optional<Pedido> findFirstByStatus(StatusPedido status);

    // Fila completa visível pro painel (pendentes + aprovados + tocando)
    @Query("""
        SELECT p FROM Pedido p
        WHERE p.status IN ('PENDENTE', 'APROVADO', 'TOCANDO')
        ORDER BY
            CASE p.status
                WHEN 'TOCANDO' THEN 0
                WHEN 'APROVADO' THEN 1
                WHEN 'PENDENTE' THEN 2
            END,
            p.posicao ASC NULLS LAST,
            p.criadoEm ASC
    """)
    List<Pedido> findFilaAtiva();

    // Próximo da fila aprovada
    Optional<Pedido> findFirstByStatusOrderByPosicaoAsc(StatusPedido status);

    // Maior posição atual na fila aprovada
    @Query("SELECT MAX(p.posicao) FROM Pedido p WHERE p.status = 'APROVADO'")
    Optional<Integer> findMaxPosicao();
}

package com.musicqueue.repository;

import com.musicqueue.model.PedidoModel;
import com.musicqueue.enums.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<PedidoModel, Long> {

    // Fila de pendentes ordenada por data de criação
    List<PedidoModel> findByStatusOrderByCriadoEmAsc(StatusPedido status);

    // Fila completa visível pro painel (pendentes + aprovados + tocando)
    @Query("""
    SELECT p FROM PedidoModel p
    WHERE p.status IN (
        com.musicqueue.enums.StatusPedido.PENDENTE,
        com.musicqueue.enums.StatusPedido.APROVADO,
        com.musicqueue.enums.StatusPedido.TOCANDO,
        com.musicqueue.enums.StatusPedido.TOCADO,
        com.musicqueue.enums.StatusPedido.REJEITADO
    )
    ORDER BY
        CASE p.status
            WHEN com.musicqueue.enums.StatusPedido.TOCANDO THEN 0
            WHEN com.musicqueue.enums.StatusPedido.APROVADO THEN 1
            WHEN com.musicqueue.enums.StatusPedido.PENDENTE THEN 2
            ELSE 3
        END,
        p.posicao ASC NULLS LAST,
        p.criadoEm ASC
""")
    List<PedidoModel> findFilaAtiva();

    // Próximo da fila aprovada
    Optional<PedidoModel> findFirstByStatusOrderByPosicaoAsc(StatusPedido status);

    // Maior posição atual na fila aprovada
    @Query("SELECT MAX(p.posicao) FROM PedidoModel p WHERE p.status = :status")
    Integer findMaxPosicaoByStatus(StatusPedido status);

    @Query("SELECT p FROM PedidoModel p WHERE p.status = 'TOCANDO'")
    Optional<PedidoModel> findTocando();


    boolean existsByStatus(StatusPedido status); // Use 'existsBy' para boolean

    @Modifying
    @Transactional
    @Query("UPDATE PedidoModel p SET p.status = com.musicqueue.enums.StatusPedido.TOCADO WHERE p.status = com.musicqueue.enums.StatusPedido.TOCANDO")
    void finalizarMusicasAnteriores();
}

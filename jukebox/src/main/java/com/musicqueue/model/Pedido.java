package com.musicqueue.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "pedidos")
@Getter
@Setter
@NoArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomeCliente;

    @Column(nullable = false)
    private String tituloMusica;

    // Observação opcional do cliente (ex: "parabéns pra minha mãe")
    private String observacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPedido status = StatusPedido.PENDENTE;

    @Column(nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    private LocalDateTime atualizadoEm;

    // Posição na fila (usada pra ordenação)
    private Integer posicao;

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }

    public enum StatusPedido {
        PENDENTE,   // aguardando aprovação do operador
        APROVADO,   // aprovado, na fila pra tocar
        TOCANDO,    // tocando agora
        TOCADO,     // já foi tocado
        REJEITADO   // rejeitado pelo operador
    }
}

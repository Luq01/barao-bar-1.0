package com.musicqueue.enums;

public enum StatusPedido {
    PENDENTE,   // aguardando aprovação do operador
    APROVADO,   // aprovado, na fila pra tocar
    TOCANDO,    // tocando agora
    TOCADO,     // já foi tocado
    REJEITADO   // rejeitado pelo operador
}

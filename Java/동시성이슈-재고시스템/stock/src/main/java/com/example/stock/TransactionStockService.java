package com.example.stock;

import com.example.stock.service.StockService;

public class TransactionStockService {
    private StockService stockService;

    public TransactionStockService(StockService stockService) {
        this.stockService = stockService;
    }

    public void decrease(Long id, Long quantity) {
        strartTransaction();
        stockService.decrease(id, quantity);
        // 다른 스레드는 갱신 이전에 값을 가져가서 동시성 문제 발생
        endTransaction();
    }
    private void strartTransaction() {
        System.out.println("트랜잭션 시작");
    }
    private void endTransaction() {
        System.out.println("트랜잭션 종료");
    }
}

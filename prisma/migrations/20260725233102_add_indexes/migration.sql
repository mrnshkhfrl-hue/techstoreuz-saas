-- CreateIndex
CREATE INDEX "Product_shopId_idx" ON "Product"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_shopId_idx" ON "Order"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Admin_shopId_idx" ON "Admin"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "TradeInRequest_shopId_idx" ON "TradeInRequest"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "TradeInSku_shopId_idx" ON "TradeInSku"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "TradeInPenalty_shopId_idx" ON "TradeInPenalty"("shopId", "createdAt");

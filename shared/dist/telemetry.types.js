"use strict";
/**
 * CHUẨN HÓA JSON EVENT SCHEMA (HỢP ĐỒNG DỮ LIỆU MILESTONE 1 - TUẦN 1)
 * Trích xuất trực tiếp từ Mục 4 của Báo cáo - PBL4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelemetryEnvelope = sendTelemetryEnvelope;
/**
 * Hàm helper chuẩn dùng chung để gửi telemetry về God-View Server
 */
async function sendTelemetryEnvelope(envelope, godViewUrl = process.env.GOD_VIEW_URL || 'http://172.20.0.99:4000/api/telemetry') {
    try {
        await fetch(godViewUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(envelope)
        });
    }
    catch (err) {
        // Không làm sập ứng dụng nếu God-View Server chưa online
    }
}
//# sourceMappingURL=telemetry.types.js.map
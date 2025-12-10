"use strict";
/**
 * GoShopperAI Cloud Functions
 * Main entry point - exports all cloud functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPriceHistory = exports.getPriceComparison = exports.savePriceData = exports.checkExpiredSubscriptions = exports.cancelSubscription = exports.upgradeSubscription = exports.recordScanUsage = exports.getSubscriptionStatus = exports.mokoPaymentWebhook = exports.verifyMokoPayment = exports.initiateMokoPayment = exports.parseReceiptV2 = exports.parseReceipt = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Export functions
var parseReceipt_1 = require("./receipt/parseReceipt");
Object.defineProperty(exports, "parseReceipt", { enumerable: true, get: function () { return parseReceipt_1.parseReceipt; } });
Object.defineProperty(exports, "parseReceiptV2", { enumerable: true, get: function () { return parseReceipt_1.parseReceiptV2; } });
var mokoAfrika_1 = require("./payments/mokoAfrika");
Object.defineProperty(exports, "initiateMokoPayment", { enumerable: true, get: function () { return mokoAfrika_1.initiateMokoPayment; } });
Object.defineProperty(exports, "verifyMokoPayment", { enumerable: true, get: function () { return mokoAfrika_1.verifyMokoPayment; } });
Object.defineProperty(exports, "mokoPaymentWebhook", { enumerable: true, get: function () { return mokoAfrika_1.mokoPaymentWebhook; } });
var subscriptionManager_1 = require("./subscription/subscriptionManager");
Object.defineProperty(exports, "getSubscriptionStatus", { enumerable: true, get: function () { return subscriptionManager_1.getSubscriptionStatus; } });
Object.defineProperty(exports, "recordScanUsage", { enumerable: true, get: function () { return subscriptionManager_1.recordScanUsage; } });
Object.defineProperty(exports, "upgradeSubscription", { enumerable: true, get: function () { return subscriptionManager_1.upgradeSubscription; } });
Object.defineProperty(exports, "cancelSubscription", { enumerable: true, get: function () { return subscriptionManager_1.cancelSubscription; } });
Object.defineProperty(exports, "checkExpiredSubscriptions", { enumerable: true, get: function () { return subscriptionManager_1.checkExpiredSubscriptions; } });
var priceService_1 = require("./prices/priceService");
Object.defineProperty(exports, "savePriceData", { enumerable: true, get: function () { return priceService_1.savePriceData; } });
Object.defineProperty(exports, "getPriceComparison", { enumerable: true, get: function () { return priceService_1.getPriceComparison; } });
Object.defineProperty(exports, "getPriceHistory", { enumerable: true, get: function () { return priceService_1.getPriceHistory; } });
//# sourceMappingURL=index.js.map